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
      <div class="eyebrow">अपनी सुविधा से</div>
      <h1 lang="en">Make it your space.</h1>
      <p>सरल विकल्प। आपका नियंत्रण।</p>
    </div>
    <section class="settings-panel">
      <h2 lang="en">Reading preferences</h2>
      <app-preferences />
      <h2 lang="en">Your progress, kept private</h2>
      <p>
        पठन, श्रवण और bookmarks इसी browser में रहते हैं। Firefox और Chrome की प्रगति अलग है; दूसरे browser में
        जाने के लिए backup export/restore करें। Site data हटाने या device खोने पर backup के बिना प्रगति वापस
        नहीं आएगी।
      </p>
      <div class="settings-actions">
        <button
          class="button"
          (click)="exportBackup()"
          [disabled]="!session.owned() || busy()"
          lang="en"
        >
          <app-icon name="down" />Export backup</button
        ><button
          class="button secondary"
          (click)="fileInput.click()"
          [disabled]="!session.owned() || busy()"
          lang="en"
        >
          Restore backup
        </button>
      </div>
      <label class="file-label sr-only"
        >बैकअप फ़ाइल<input
          #fileInput
          type="file"
          accept=".json,application/json"
          (change)="selectBackup($event)"
      /></label>
      <p class="small-note">
        केवल supported JSON v1 · अधिकतम 5 MiB · restore से पहले preview और confirmation।
      </p>
      @if (importError()) {
        <p class="field-error" role="alert">{{ importError() }}</p>
      }
      <h2 lang="en">Offline storage</h2>
      <p>
        {{ offline.saved().length }} / 2 calibration parts सहेजे हैं। App shell:
        {{ offline.shellReady() ? 'cached' : 'not ready / development server' }}.
      </p>
      <p class="small-note">{{ offline.storageStatus() }}</p>
      <div class="settings-actions">
        <button
          class="button secondary"
          (click)="persist()"
          [disabled]="!session.owned()"
          lang="en"
        >
          Request persistent storage</button
        ><button
          class="button secondary"
          (click)="remove.showModal()"
          [disabled]="!session.owned() || busy() || !offline.saved().length"
          lang="en"
        >
          Remove saved audio
        </button>
      </div>
      <h2 lang="en">Application updates</h2>
      <p>
        {{
          offline.updateWaiting() ? 'नया app version तैयार है।' : 'अभी कोई waiting update नहीं मिला।'
        }}
        Update अपने आप playback नहीं रोकेगा।
      </p>
      <button
        class="button secondary"
        (click)="prepareUpdate()"
        [disabled]="!session.owned() || busy()"
        lang="en"
      >
        Prepare update / safe close
      </button>
      <p class="small-note">
        Pause और save के बाद सभी ShrutDhara tabs/installed windows बंद करके फिर खोलें।
      </p>
      <h2 lang="en">Content & browser status</h2>
      <p>
        मूल सूत्र अभी उपलब्ध नहीं हैं। श्रवण यात्रा में हिन्दी व्याख्या की समीक्षा प्रति है। Reading samples और
        generated audio tones development fixtures हैं। Firefox और Chrome पर वास्तविक phone validation
        बाकी है।
      </p>
    </section>
    <dialog #preview aria-labelledby="restore-title">
      <div class="dialog-heading">
        <h2 id="restore-title" lang="en">Replace personal progress?</h2>
        <button
          class="icon-button"
          aria-label="Close restore preview"
          (click)="cancelRestore()"
          [disabled]="busy()"
        >
          <app-icon name="close" />
        </button>
      </div>
      @if (pending(); as incoming) {
        <p>
          इस browser की वर्तमान journeys, bookmarks और preferences की जगह यह backup आएगा।
          Audio/content files नहीं बदले जाएँगे।
        </p>
        <dl class="source-list">
          <div>
            <dt>Reading</dt>
            <dd>{{ study.state().reading.sutraId }} → {{ incoming.data.reading.sutraId }}</dd>
          </div>
          <div>
            <dt>Listening</dt>
            <dd>
              {{ time(study.state().listening.seconds) }} →
              {{ time(incoming.data.listening.seconds) }} · Part
              {{ incoming.data.listening.part + 1 }}
            </dd>
          </div>
          <div>
            <dt>Bookmarks</dt>
            <dd>{{ study.state().bookmarks.length }} → {{ incoming.data.bookmarks.length }}</dd>
          </div>
          <div>
            <dt>Unavailable references</dt>
            <dd>{{ unresolved() }} · references सुरक्षित रहेंगी; download अपने आप नहीं होगा</dd>
          </div>
        </dl>
        <p class="small-note">
          Preview के दौरान सामान्य प्रगति save हो सकती है। Confirm पर playback paused रहेगा।
        </p>
        <div class="settings-actions">
          <button class="button" (click)="confirmRestore()" [disabled]="busy()" lang="en">
            {{ busy() ? 'Restoring…' : 'Replace and restore' }}</button><button
            class="button secondary"
            (click)="cancelRestore()"
            [disabled]="busy()"
            lang="en"
          >
            Cancel
          </button>
        </div>
      }
    </dialog>
    <dialog #remove aria-labelledby="remove-title">
      <div class="dialog-heading">
        <h2 id="remove-title" lang="en">Remove saved audio?</h2>
        <button class="icon-button" aria-label="Close remove preview" (click)="remove.close()">
          <app-icon name="close" />
        </button>
      </div>
      <p>
        Playback रुक जाएगा और दोनों calibration parts इस browser से हट जाएँगे। आपकी reading/listening
        positions और bookmarks सुरक्षित रहेंगे। Offline सुनने के लिए audio फिर save करना होगा।
      </p>
      <div class="settings-actions">
        <button class="button" (click)="removeAudio()" [disabled]="busy()" lang="en">
          Stop and remove</button
        ><button class="button secondary" (click)="remove.close()" lang="en">Cancel</button>
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
      this.ui.notify('Backup फ़ाइल तैयार है। इसे सुरक्षित जगह रखें।');
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
      if (file.size > MAX_BACKUP_BYTES) throw new Error('बैकअप 5 MiB से बड़ा है।');
      this.pending.set(parseBackup(await file.text()));
      this.preview?.nativeElement.showModal();
    } catch (error) {
      this.importError.set(
        `${error instanceof Error ? error.message : 'फ़ाइल पढ़ी नहीं जा सकी।'} कोई imported data लागू नहीं किया गया।`,
      );
    } finally {
      input.value = '';
    }
  }

  unresolved(): number {
    const incoming = this.pending();
    if (!incoming) return 0;
    const available = this.content.chapter()?.passages.map((item) => item.id) ?? [];
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
      this.ui.notify('दोनों journeys, bookmarks और preferences restore हुए। Playback paused है।');
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
      this.ui.notify('Saved audio हट गया। Journeys और bookmarks सुरक्षित हैं।');
    } catch (error) {
      this.ui.error(error);
    } finally {
      this.busy.set(false);
    }
  }
}
