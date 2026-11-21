import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { OperationCoordinator, StudyDatabaseStore } from './database';
import {
  Backup,
  initialPersonalState,
  MAX_BACKUP_BYTES,
  parseBackup,
  validatePersonalState,
} from './models';

let store: StudyDatabaseStore;
let name: string;
function database() {
  name = `test-${crypto.randomUUID()}`;
  store = new StudyDatabaseStore(name);
  return store;
}
afterEach(async () => {
  if (store) {
    await store.close();
    await deleteDB(name);
  }
});

describe('durable personal state', () => {
  it('persists independent reading/listening changes across connection reopen', async () => {
    const db = database();
    await db.update(0, (state) => ({
      ...state,
      reading: { ...state.reading, sutraId: 'fixture:reflection:3' },
    }));
    await db.update(0, (state) => ({ ...state, listening: { ...state.listening, seconds: 211 } }));
    await db.close();
    store = new StudyDatabaseStore(name);
    const saved = await store.read();
    expect(saved.data.reading.sutraId).toBe('fixture:reflection:3');
    expect(saved.data.listening.seconds).toBe(211);
  });

  it('restores all records together and rejects late pre-restore checkpoints', async () => {
    const db = database();
    const imported = initialPersonalState();
    imported.listening.seconds = 470;
    imported.bookmarks = [
      { sutraId: 'missing:reference', title: 'Unresolved', revision: 'edition-v1' },
    ];
    await db.replace(0, imported);
    await expect(
      db.update(0, (state) => ({ ...state, listening: { ...state.listening, seconds: 99 } })),
    ).rejects.toThrow('State');
    expect((await db.read()).data).toEqual(imported);
  });

  it('invalid mutation cannot partially replace valid data', async () => {
    const db = database();
    await db.update(0, (state) => ({
      ...state,
      preferences: { ...state.preferences, theme: 'night' },
    }));
    const before = await db.read();
    await expect(
      db.update(0, (state) => ({ ...state, listening: { ...state.listening, seconds: -10 } })),
    ).rejects.toThrow();
    expect(await db.read()).toEqual(before);
  });

  it('serializes commands while allowing recovery after a failed command', async () => {
    const coordinator = new OperationCoordinator();
    const sequence: number[] = [];
    const first = coordinator.run(async () => {
      await Promise.resolve();
      sequence.push(1);
    });
    const failed = coordinator.run(async () => {
      throw new Error('Injected');
    });
    const last = coordinator.run(async () => {
      sequence.push(3);
    });
    await first;
    await expect(failed).rejects.toThrow('Injected');
    await last;
    expect(sequence).toEqual([1, 3]);
  });
});

describe('untrusted portable backups', () => {
  function backup(): Backup {
    return {
      format: 'shrutdhara-progress',
      version: 1,
      exportedAt: '2026-11-21T00:00:00Z',
      data: initialPersonalState(),
    };
  }

  it('round trips real data and retains unresolved references', () => {
    const value = backup();
    value.data.reading.sutraId = 'unavailable:chapter:verse';
    expect(parseBackup(JSON.stringify(value))).toEqual(value);
  });

  it('rejects malformed, future, prototype, oversized and unsafe positions', () => {
    for (const text of [
      '{',
      JSON.stringify({ ...backup(), version: 2 }),
      JSON.stringify({ version: 1 }),
      ' '.repeat(MAX_BACKUP_BYTES + 1),
    ])
      expect(() => parseBackup(text)).toThrow();
    expect(() =>
      validatePersonalState({
        ...initialPersonalState(),
        listening: { recordingId: 'ok', part: 0, seconds: Infinity },
      }),
    ).toThrow();
  });

  it('drops injected epochs, locks and unrecognised properties', () => {
    const value = {
      ...backup(),
      epoch: 900,
      lock: 'foreign',
      data: { ...initialPersonalState(), restoreEpoch: 999 },
    };
    const parsed = parseBackup(JSON.stringify(value));
    expect(parsed).not.toHaveProperty('epoch');
    expect(parsed.data).not.toHaveProperty('restoreEpoch');
  });
});
