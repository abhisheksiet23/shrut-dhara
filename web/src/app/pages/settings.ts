import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { ApplicationService } from '../core/application.service';
import { StudyService } from '../core/study.service';
import { SessionService } from '../core/session.service';
import { OfflineService } from '../core/offline.service';
import { ContentService } from '../core/content.service';
import { UiService } from '../core/ui.service';
import { Backup, MAX_BACKUP_BYTES, formatTime, parseBackup } from '../core/models';
import { Preferences } from '../shared/preferences';
import { Icon } from '../shared/icon';

@Component({
  imports: [Preferences, Icon],
  template: ` <div class="page-title">
      <div class="eyebrow">Settings</div>
      <h1>Make it comfortable.</h1>
      <p>Reading options, your saved data and offline audio.</p>
    </div>
    <section class="settings-panel">
      <h2>Reading</h2>
      <app-preferences />
      <h2>Your progress stays with you</h2>
      <p>
        Your reading place, listening place and bookmarks are saved in this browser only. Firefox
        and Chrome keep separate progress, so make a backup to move between them. If you clear site
        data or lose this device, progress can’t be recovered without a backup.
      </p>
      <div class="settings-actions">
        <button class="button" (click)="exportBackup()" [disabled]="!session.owned() || busy()">
          <app-icon name="down" />Save a backup</button
        ><button
          class="button secondary"
          (click)="fileInput.click()"
          [disabled]="!session.owned() || busy()"
        >
          Restore from backup
        </button>
      </div>
      <label class="file-label sr-only"
        >Backup file<input
          #fileInput
          type="file"
          accept=".json,application/json"
          (change)="selectBackup($event)"
      /></label>
      <p class="small-note">
        Use a backup file made by ShrutDhara (up to 5 MB). You’ll see a preview before anything
        changes.
      </p>
      @if (importError()) {
        <p class="field-error" role="alert">{{ importError() }}</p>
      }
      <h2>Offline audio</h2>
      <p>
        Selected recording:
        {{ content.recording(offline.activeId())?.label ?? 'No recording available' }}.
      </p>
      <p>
        {{ offline.saved().length }} of {{ offline.assets().length }} sections saved on this device.
        Offline mode: {{ offline.shellReady() ? 'ready' : 'not ready yet' }}.
      </p>
      <p class="small-note">{{ offline.storageStatus() }}</p>
      <div class="settings-actions">
        <button class="button secondary" (click)="persist()" [disabled]="!session.owned()">
          Protect saved audio</button
        ><button
          class="button secondary"
          (click)="remove.showModal()"
          [disabled]="!session.owned() || busy() || !offline.saved().length"
        >
          Remove saved audio
        </button>
      </div>
      @if (offline.updateWaiting()) {
        <h2>App update</h2>
        <p>A new version is ready. Updating won’t interrupt what you’re listening to.</p>
        <button
          class="button secondary"
          (click)="prepareUpdate()"
          [disabled]="!session.owned() || busy()"
        >
          Get ready to update
        </button>
        <p class="small-note">
          Once it’s ready, pause, then close every ShrutDhara tab and window and open the app again.
        </p>
      }
      <h2>About this content</h2>
      <p>
        Book 1 of the Ācārāṅga Sūtra is available to read in Hindi, sutra by sutra. Audio for the
        meanings is being prepared.
      </p>
    </section>
    <dialog #preview aria-labelledby="restore-title">
      <div class="dialog-heading">
        <h2 id="restore-title">Replace your progress?</h2>
        <button
          class="icon-button"
          aria-label="Close"
          (click)="cancelRestore()"
          [disabled]="busy()"
        >
          <app-icon name="close" />
        </button>
      </div>
      @if (pending(); as incoming) {
        <p>
          This backup will replace the reading and listening places, bookmarks and reading settings
          in this browser. Saved audio isn’t affected.
        </p>
        <dl class="source-list">
          <div>
            <dt>Reading place</dt>
            <dd>{{ study.state().reading.sutraId }} → {{ incoming.data.reading.sutraId }}</dd>
          </div>
          <div>
            <dt>Listening place</dt>
            <dd>
              {{ time(study.state().listening.seconds) }} →
              {{ time(incoming.data.listening.seconds) }} · Section
              {{ incoming.data.listening.part + 1 }}
            </dd>
          </div>
          <div>
            <dt>Bookmarks</dt>
            <dd>{{ study.state().bookmarks.length }} → {{ incoming.data.bookmarks.length }}</dd>
          </div>
          <div>
            <dt>Places not in this version</dt>
            <dd>{{ unresolved() }} · kept in your backup, but not downloaded</dd>
          </div>
        </dl>
        <p class="small-note">
          Playback will pause when you confirm. Progress made while this is open may be replaced.
        </p>
        <div class="settings-actions">
          <button class="button" (click)="confirmRestore()" [disabled]="busy()">
            {{ busy() ? 'Restoring…' : 'Replace and restore' }}</button><button
            class="button secondary"
            (click)="cancelRestore()"
            [disabled]="busy()"
          >
            Cancel
          </button>
        </div>
      }
    </dialog>
    <dialog #remove aria-labelledby="remove-title">
      <div class="dialog-heading">
        <h2 id="remove-title">Remove saved audio?</h2>
        <button class="icon-button" aria-label="Close" (click)="remove.close()">
          <app-icon name="close" />
        </button>
      </div>
      <p>
        Playback will stop and all saved sections will be removed from this device. Your places and
        bookmarks stay. You’ll need to save the audio again to listen offline.
      </p>
      <div class="settings-actions">
        <button class="button" (click)="removeAudio()" [disabled]="busy()">Stop and remove</button
        ><button class="button secondary" (click)="remove.close()">Cancel</button>
      </div>
    </dialog>`,
})
export class Settings {
  readonly app = inject(ApplicationService);
  readonly study = inject(StudyService);
  readonly session = inject(SessionService);
  readonly offline = inject(OfflineService);
  private content = inject(ContentService);
  private ui = inject(UiService);
  readonly pending = signal<Backup | null>(null);
  readonly importError = signal('');
  readonly busy = signal(false);
  readonly time = formatTime;
  @ViewChild('preview') private preview?: ElementRef<HTMLDialogElement>;
  @ViewChild('remove') private remove?: ElementRef<HTMLDialogElement>;

  async exportBackup(): Promise<void> {
    try {
      await this.app.readingFlusher();
      await this.app.playback.checkpoint();
      const snapshot = await this.study.snapshot();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shrutdhara-progress-v1.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.ui.notify('Backup saved. Keep it somewhere safe.');
    } catch (error) {
      this.ui.error(error);
    }
  }

  async selectBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importError.set('');
    try {
      this.session.assertOwner();
      if (file.size > MAX_BACKUP_BYTES)
        throw new Error('This file is larger than 5 MB, so it can’t be a ShrutDhara backup.');
      this.pending.set(parseBackup(await file.text()));
      this.preview?.nativeElement.showModal();
    } catch (error) {
      this.importError.set(
        `${error instanceof Error ? error.message : 'Couldn’t read that file.'} Nothing was changed.`,
      );
    } finally {
      input.value = '';
    }
  }

  unresolved(): number {
    const incoming = this.pending();
    if (!incoming) return 0;
    const available = [
      ...(this.content.chapter()?.passages.map((item) => item.id) ?? []),
      ...(this.content.catalog()?.sutras.map((item) => item.id) ?? []),
    ];
    return [
      incoming.data.reading.sutraId,
      ...incoming.data.bookmarks.map((item) => item.sutraId),
    ].filter((id) => !available.includes(id)).length;
  }

  cancelRestore(): void {
    if (this.busy()) return;
    this.pending.set(null);
    this.preview?.nativeElement.close();
  }

  async confirmRestore(): Promise<void> {
    const backup = this.pending();
    if (!backup || this.busy()) return;
    this.busy.set(true);
    try {
      await this.app.restore(backup);
      this.pending.set(null);
      this.preview?.nativeElement.close();
      this.ui.notify('Backup restored. Playback is paused.');
    } catch (error) {
      this.ui.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  async persist(): Promise<void> {
    try {
      await this.offline.requestPersistence();
    } catch (error) {
      this.ui.error(error);
    }
  }

  async prepareUpdate(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.app.prepareUpdate();
    } catch (error) {
      this.ui.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  async removeAudio(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.app.removeAudio();
      this.remove?.nativeElement.close();
      this.ui.notify('Saved audio removed. Your places and bookmarks are safe.');
    } catch (error) {
      this.ui.error(error);
    } finally {
      this.busy.set(false);
    }
  }
}
