import { Injectable, inject, signal } from '@angular/core';
import { OperationCoordinator, StudyDatabaseStore } from './database';
import {
  Backup,
  Envelope,
  initialPersonalState,
  ListeningPosition,
  PersonalState,
  Preferences,
  ReadingPosition,
} from './models';
import { SessionService } from './session.service';
import { UiService } from './ui.service';

@Injectable({ providedIn: 'root' })
export class StudyService {
  private session = inject(SessionService);
  private ui = inject(UiService);
  readonly state = signal(initialPersonalState());
  readonly ready = signal(false);
  readonly failed = signal(false);
  readonly coordinator = new OperationCoordinator();
  private database?: StudyDatabaseStore;
  private envelope?: Envelope;

  async load(): Promise<void> {
    this.database ??= new StudyDatabaseStore('shrutdhara-v1', () =>
      this.ui.notify('An older ShrutDhara window is still open. Close it and reopen the app to finish updating.'),
    );
    try {
      this.apply(await this.database.read());
      this.ready.set(true);
      this.failed.set(false);
    } catch (error) {
      this.failed.set(true);
      this.ui.error(error);
    }
  }

  private apply(envelope: Envelope): void {
    this.envelope = envelope;
    this.state.set(envelope.data);
    document.documentElement.dataset['theme'] = envelope.data.preferences.theme;
    document.documentElement.dataset['readingFont'] = envelope.data.preferences.font;
  }

  async mutate(mutation: (state: PersonalState) => PersonalState, internal = false): Promise<void> {
    this.session.assertOwner(internal);
    if (!this.ready() || !this.envelope || !this.database)
      throw new Error('Storage on this device isn’t ready yet. Please try again.');
    const epoch = this.envelope.epoch;
    await this.coordinator.run(async () => {
      this.session.assertOwner(true);
      this.apply(await this.database!.update(epoch, mutation));
    });
  }

  saveReading(reading: ReadingPosition, internal = false): Promise<void> {
    return this.mutate((state) => ({ ...state, reading }), internal);
  }

  saveListening(listening: ListeningPosition, internal = false): Promise<void> {
    return this.mutate((state) => ({ ...state, listening }), internal);
  }

  setPreferences(patch: Partial<Preferences>): Promise<void> {
    return this.mutate((state) => ({ ...state, preferences: { ...state.preferences, ...patch } }));
  }

  toggleBookmark(sutraId: string, title: string, revision: string): Promise<void> {
    return this.mutate((state) => ({
      ...state,
      bookmarks: state.bookmarks.some((item) => item.sutraId === sutraId)
        ? state.bookmarks.filter((item) => item.sutraId !== sutraId)
        : [...state.bookmarks, { sutraId, title, revision }],
    }));
  }

  async snapshot(): Promise<Backup> {
    this.session.assertOwner();
    await this.coordinator.drain();
    const envelope = await this.database!.read();
    return {
      format: 'shrutdhara-progress',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: envelope.data,
    };
  }

  async restore(data: PersonalState): Promise<void> {
    this.session.assertOwner(true);
    const epoch = this.envelope!.epoch;
    await this.coordinator.run(async () => {
      this.session.assertOwner(true);
      this.apply(await this.database!.replace(epoch, data));
    });
  }

  async close(): Promise<void> {
    await this.coordinator.drain();
    await this.database?.close();
    this.database = undefined;
    this.ready.set(false);
  }
}
