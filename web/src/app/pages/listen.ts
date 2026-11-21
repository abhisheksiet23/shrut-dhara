import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlaybackService } from '../core/playback.service';
import { OfflineService } from '../core/offline.service';
import { ContentService } from '../core/content.service';
import { StudyService } from '../core/study.service';
import { UiService } from '../core/ui.service';
import { formatTime } from '../core/models';
import { Icon } from '../shared/icon';
import { Art } from '../shared/art';

@Component({
  imports: [FormsModule, Icon, Art],
  template: ` <div class="page-title">
      <div class="eyebrow">आँखों को आराम, विचारों को विस्तार</div>
      <h1>श्रवण यात्रा</h1>
      <p>समीक्षित हिन्दी narration की तैयारी के साथ वास्तविक playback जाँच।</p>
    </div>
    <div class="listening-layout">
      <section class="player-card">
        <div class="audio-art">
          <app-art />
          <div class="audio-art-title">
            <span lang="en">LOCAL AUDIO · CALIBRATION</span>
            <h2>श्रवण की तैयारी</h2>
            <p>हिन्दी अध्याय की narration अभी उपलब्ध नहीं है</p>
          </div>
        </div>
        <div class="player-body">
          <div class="player-title">
            <div>
              <span class="eyebrow">परीक्षण audio · २ parts</span>
              <h2 lang="en">Audio calibration</h2>
            </div>
            <app-icon name="headphones" />
          </div>
          <div class="simulation-note" lang="en">
            Generated tones · real audio, not speech or scripture
          </div>
          <p class="player-status" role="status" lang="en">
            {{ player.status() }} · Part {{ player.part() + 1 }}
          </p>
          <label class="sr-only" for="audio-seek">Listening position</label>
          <input
            id="audio-seek"
            class="seek"
            type="range"
            min="0"
            [max]="player.duration()"
            step="1"
            [value]="player.position()"
            [attr.aria-valuetext]="time(player.position())"
            (change)="seekInput($event)"
          />
          <div class="time-labels">
            <span>{{ time(player.position()) }}</span
            ><span>{{ time(player.duration() - player.position()) }} शेष</span>
          </div>
          <div class="playback-controls">
            <button class="icon-button speed" aria-label="Playback speed" (click)="speed()">
              {{ study.state().preferences.speed }}×
            </button>
            <button
              class="skip-control"
              aria-label="15 seconds back"
              (click)="seek(player.position() - 15)"
            >
              ↶<small>15</small>
            </button>
            <button
              class="play-button"
              [attr.aria-label]="player.running() ? 'Pause audio' : 'Play audio'"
              (click)="toggle()"
              [disabled]="busy()"
            >
              <app-icon [name]="player.running() ? 'pause' : 'play'" />
            </button>
            <button
              class="skip-control"
              aria-label="15 seconds forward"
              (click)="seek(player.position() + 15)"
            >
              ↷<small>15</small>
            </button>
            <button class="icon-button" aria-label="Restart recording" (click)="restart()">
              <app-icon name="back" />
            </button>
          </div>
          <div class="player-footer"><app-icon name="lock" /> श्रवण प्रगति पठन से अलग सहेजी जाती है</div>
        </div>
      </section>
      <aside class="listening-aside">
        <section class="queue-panel">
          <div class="section-heading">
            <h2 lang="en">Prepared sequence</h2>
            <span>{{ offline.saved().length }} / {{ assets().length }} saved</span>
          </div>
          @for (asset of assets(); track asset.id; let i = $index) {
            <div class="queue-item" [class.dim]="player.part() !== i">
              <span class="queue-number">0{{ i + 1 }}</span>
              <div>
                <b lang="en">Calibration · Part {{ i + 1 }}</b>
                <p>
                  {{ time(asset.duration) }} ·
                  {{
                    offline.saved().includes(asset.id)
                      ? 'Saved in this browser'
                      : 'Not saved offline'
                  }}
                </p>
              </div>
              <button
                class="icon-button"
                [attr.aria-label]="'Select part ' + (i + 1)"
                (click)="part(i)"
                [disabled]="offline.saved().length !== assets().length"
              >
                <app-icon [name]="offline.saved().includes(asset.id) ? 'check' : 'down'" />
              </button>
            </div>
          }
          <p class="small-note">
            दोनों parts save होने पर ही prepared sequence शुरू होगा। अंत में playback रुकेगा। यह chapter
            narration का विकल्प नहीं है।
          </p>
          <button
            class="button full"
            (click)="download()"
            [disabled]="offline.downloading() || offline.saved().length === assets().length"
            lang="en"
          >
            <app-icon name="down" />{{
              offline.downloading()
                ? 'Saving audio…'
                : offline.saved().length === assets().length
                  ? 'Audio saved'
                  : 'Save audio · 28.8 MB'
            }}
          </button>
          @if (offline.downloading()) {
            <p class="small-note" role="status">{{ offline.progress() }}</p>
            <button class="text-button" (click)="offline.cancel()" lang="en">
              Cancel download
            </button>
          }
        </section>
        <section class="driving-panel">
          <app-icon name="car" />
          <h2>सफ़र से पहले तैयार करें।</h2>
          <p>
            आवाज़ जाँचें और दोनों parts save करें। वास्तविक driving में इस्तेमाल करने से पहले अपने browser पर
            background/media-controls test करें।
          </p>
          <button class="button secondary" (click)="openDriving()" lang="en">
            Driving mode <app-icon name="arrow" /></button
          ><small>Firefox / Chrome · device validation pending</small>
        </section>
      </aside>
    </div>
    <dialog #driving aria-labelledby="driving-title">
      <div class="dialog-heading">
        <h2 id="driving-title" lang="en">Driving mode · Calibration</h2>
        <button class="icon-button" aria-label="Close driving mode" (click)="driving.close()">
          <app-icon name="close" />
        </button>
      </div>
      <div class="drive-view">
        <app-icon name="car" /><span class="eyebrow">रुककर तैयार करें · वास्तविक audio</span>
        <h3>ध्वनि परीक्षण</h3>
        <p>Generated tones · कोई शास्त्रीय narration नहीं</p>
        <span id="drive-time">{{ time(player.position()) }} / {{ time(player.duration()) }}</span>
        <div class="drive-controls">
          <button
            class="button secondary"
            aria-label="Driving 15 seconds back"
            (click)="seek(player.position() - 15)"
          >
            −15</button
          ><button
            class="play-button"
            [attr.aria-label]="player.running() ? 'Pause driving audio' : 'Play driving audio'"
            (click)="toggle()"
            [disabled]="busy()"
          >
            <app-icon [name]="player.running() ? 'pause' : 'play'" /></button
          ><button
            class="button secondary"
            aria-label="Driving 15 seconds forward"
            (click)="seek(player.position() + 15)"
          >
            +15
          </button>
        </div>
        <p class="small-note">
          Phone पर screen-off और interruption जाँच बाकी है। Controls की उपलब्धता browser पर निर्भर है।
        </p>
      </div>
    </dialog>`,
})
export class Listen {
  readonly player = inject(PlaybackService);
  readonly offline = inject(OfflineService);
  readonly content = inject(ContentService);
  readonly study = inject(StudyService);
  private ui = inject(UiService);
  readonly time = formatTime;
  readonly busy = signal(false);
  @ViewChild('driving') private driving?: ElementRef<HTMLDialogElement>;

  assets() {
    return this.content.chapter()?.audio ?? [];
  }

  private async run(operation: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await operation();
    } catch (error) {
      this.ui.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  toggle(): void {
    void this.run(() => this.player.toggle());
  }
  seek(seconds: number): void {
    void this.run(() => this.player.seek(seconds));
  }
  seekInput(event: Event): void {
    this.seek(Number((event.target as HTMLInputElement).value));
  }
  restart(): void {
    void this.run(() => this.player.restart());
  }
  part(index: number): void {
    void this.run(() => this.player.changePart(index));
  }

  async speed(): Promise<void> {
    const rates = [0.75, 1, 1.25, 1.5];
    try {
      await this.study.setPreferences({
        speed: rates[(rates.indexOf(this.study.state().preferences.speed) + 1) % rates.length],
      });
    } catch (error) {
      this.ui.error(error);
    }
  }

  async download(): Promise<void> {
    try {
      await this.offline.saveAudio();
    } catch (error) {
      this.ui.notify(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Download रद्द हुआ। पूरे सहेजे हुए parts सुरक्षित हैं।'
          : error instanceof Error
            ? error.message
            : 'Download विफल हुआ। Retry करें।',
      );
    }
  }

  async openDriving(): Promise<void> {
    try {
      for (const asset of this.assets()) await this.offline.assertSaved(asset);
      this.driving?.nativeElement.showModal();
    } catch (error) {
      this.ui.error(error);
    }
  }
}
