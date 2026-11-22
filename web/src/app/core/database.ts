import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Envelope, initialPersonalState, PersonalState, validatePersonalState } from './models';

interface StudyDatabase extends DBSchema {
  personal: { key: string; value: Envelope };
}

export class StudyDatabaseStore {
  private database: Promise<IDBPDatabase<StudyDatabase>>;

  constructor(name = 'shrutdhara-v1', onBlocked: () => void = () => {}) {
    // Version 2 fences older app writers, whose validator would drop retained recording positions.
    // The personal store and every existing record stay in place.
    this.database = openDB<StudyDatabase>(name, 2, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('personal')) {
          database.createObjectStore('personal', { keyPath: 'id' });
        }
      },
      blocked: onBlocked,
      blocking: () => {
        void this.close();
      },
    });
  }

  async read(): Promise<Envelope> {
    const database = await this.database;
    const stored = await database.get('personal', 'personal');
    if (!stored) {
      return { id: 'personal', epoch: 0, revision: 0, data: initialPersonalState() };
    }
    if (
      !Number.isSafeInteger(stored.epoch) ||
      stored.epoch < 0 ||
      !Number.isSafeInteger(stored.revision) ||
      stored.revision < 0
    ) {
      throw new Error(
        'Couldn’t read your saved data, so nothing was changed. Your original data is untouched.',
      );
    }
    return { ...stored, data: validatePersonalState(stored.data) };
  }

  async update(
    expectedEpoch: number,
    mutation: (data: PersonalState) => PersonalState,
  ): Promise<Envelope> {
    const database = await this.database;
    const transaction = database.transaction('personal', 'readwrite');
    const stored = (await transaction.store.get('personal')) ?? {
      id: 'personal' as const,
      epoch: 0,
      revision: 0,
      data: initialPersonalState(),
    };
    if (stored.epoch !== expectedEpoch) {
      transaction.abort();
      await transaction.done.catch(() => {});
      throw new Error(
        'Your progress changed in another window, so this save was skipped. Reopen ShrutDhara and try again.',
      );
    }
    let updated: Envelope;
    try {
      updated = {
        ...stored,
        revision: stored.revision + 1,
        data: validatePersonalState(mutation(structuredClone(stored.data))),
      };
      await transaction.store.put(updated);
      await transaction.done;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        /* It may already be aborted. */
      }
      await transaction.done.catch(() => {});
      throw error;
    }
    return updated;
  }

  async replace(expectedEpoch: number, data: PersonalState): Promise<Envelope> {
    const validated = validatePersonalState(data);
    const database = await this.database;
    const transaction = database.transaction('personal', 'readwrite');
    const previous = (await transaction.store.get('personal')) ?? {
      id: 'personal' as const,
      epoch: 0,
      revision: 0,
      data: initialPersonalState(),
    };
    if (previous.epoch !== expectedEpoch) {
      transaction.abort();
      await transaction.done.catch(() => {});
      throw new Error(
        'Your progress changed before the restore finished, so nothing was replaced. Please try again.',
      );
    }
    const next: Envelope = {
      id: 'personal',
      epoch: previous.epoch + 1,
      revision: previous.revision + 1,
      data: validated,
    };
    await transaction.store.put(next);
    await transaction.done;
    return next;
  }

  async close(): Promise<void> {
    (await this.database).close();
  }
}

export class OperationCoordinator {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.tail.then(operation);
    this.tail = next.catch(() => {});
    return next;
  }

  async drain(): Promise<void> {
    await this.tail;
  }
}
