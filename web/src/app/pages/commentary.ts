import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlaybackService } from '../core/playback.service';
import { OfflineService } from '../core/offline.service';
import { ContentService } from '../core/content.service';
import { StudyService } from '../core/study.service';
import { UiService } from '../core/ui.service';
import { CALIBRATION_ID, NARRATION_ID, formatTime } from '../core/models';
import { Icon } from '../shared/icon';
import { Art } from '../shared/art';

@Component({
  imports: [FormsModule, RouterLink, Icon, Art],
  styles: `
    .transcript summary {
      cursor: pointer;
      font-size: 13px;
      margin-top: 6px;
      color: var(--muted);
    }
    .transcript p {
      margin: 0.6rem 0;
      line-height: 1.8;
      font-size: 15px;
    }
    .queue-item {
      flex-wrap: wrap;
    }
    .queue-item .grow {
      flex: 1;
      min-width: 0;
    }
    .queue-item .transcript {
      flex-basis: 100%;
    }
    .credits-line {
      margin-top: 18px;
    }
    .credits-line a {
      text-decoration: underline;
    }
    .dev-tools {
      margin-top: 28px;
    }
    .dev-tools summary {
      cursor: pointer;
      font-size: 13px;
      color: var(--muted);
    }
  `,
  template: ` <div class="page-title">
      <a class="text-button" routerLink="/study">← Study contents</a>
      <div class="eyebrow">Earlier commentary</div>
      <h1>Chapter commentary</h1>
      <p>
        This earlier recording is a connected explanation, not sutra-by-sutra Hindi meaning. Its
        saved place is retained separately.
      </p>
      <p>Ācārāṅga Sūtra, Study 1 · a Hindi explanation in seven sections</p>
      <p class="small-note">AI voice, not yet reviewed by a scholar.</p>
      <a class="button secondary" routerLink="/acharanga">See all 24 studies</a>
    </div>

    @if (content.narrationError() && !recording()) {
      <section class="settings-panel">
        <h2>Couldn’t load the narration</h2>
        <p role="alert">{{ content.narrationError() }}</p>
        <button class="button secondary" (click)="content.loadNarration()">Try again</button>
      </section>
    } @else if (recording(); as rec) {
      <div class="listening-layout">
        <section class="player-card">
          <div class="audio-art">
            <app-art />
            <div class="audio-art-title">
              <span>{{
                rec.kind === 'narration' ? 'Ācārāṅga Sūtra · Study 1' : 'Test tones'
              }}</span>
              <h2 lang="hi">{{ rec.title }}</h2>
              <p>{{ rec.label }}</p>
            </div>
          </div>
          <div class="player-body">
            <div class="player-title">
              <div>
                <span class="eyebrow">{{
                  part()?.reference ?? 'Section ' + (player.part() + 1)
                }}</span>
                <h2 lang="hi">{{ part()?.title ?? 'Section ' + (player.part() + 1) }}</h2>
              </div>
              <app-icon name="headphones" />
            </div>
            <p class="player-status" role="status">
              {{ player.status() }} · Section {{ player.part() + 1 }} of {{ rec.parts.length }}
            </p>
            <label class="sr-only" for="audio-seek">Position in this section</label>
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
              <span>{{ time(player.position()) }}</span><span
                >{{ time(player.duration() - player.position()) }} left</span
              >
            </div>
            <div class="playback-controls">
              <button
                class="icon-button speed"
                [attr.aria-label]="
                  'Playback speed ' + study.state().preferences.speed + '×. Tap to change.'
                "
                (click)="speed()"
              >
                {{ study.state().preferences.speed }}×
              </button>
              <button
                class="skip-control"
                aria-label="Back 15 seconds"
                (click)="seek(player.position() - 15)"
              >
                <app-icon name="back15" />
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
                aria-label="Forward 15 seconds"
                (click)="seek(player.position() + 15)"
              >
                <app-icon name="fwd15" />
              </button>
              <button class="icon-button" aria-label="Restart this section" (click)="restart()">
                <app-icon name="restart" />
              </button>
            </div>
            @if (rec.kind === 'narration') {
              <p class="small-note">
                This is an AI voice and hasn’t been reviewed yet. Pronunciation and meaning haven’t
                been checked against the Prakrit original.
              </p>
            }
            <div class="player-footer">
              <app-icon name="lock" /> Your listening place is saved separately from reading.
            </div>
          </div>
        </section>
        <aside class="listening-aside">
          <section class="queue-panel">
            <div class="section-heading">
              <h2>{{ rec.kind === 'narration' ? 'Seven sections' : 'Test sections' }}</h2>
              <span>{{ offline.saved().length }} of {{ rec.parts.length }} saved</span>
            </div>
            @for (item of rec.parts; track item.id; let i = $index) {
              <div class="queue-item" [class.dim]="player.part() !== i">
                <span class="queue-number">0{{ i + 1 }}</span>
                <div class="grow">
                  <b lang="hi">{{ item.title ?? 'Section ' + (i + 1) }}</b>
                  <p>
                    {{ item.reference ? item.reference + ' · ' : '' }}{{ time(item.duration) }} ·
                    <span class="queue-status"
                      ><app-icon
                        [name]="offline.saved().includes(item.id) ? 'saved' : 'stream'"
                      />{{
                        offline.saved().includes(item.id)
                          ? 'Saved on this device'
                          : 'Streams online'
                      }}</span
                    >
                  </p>
                </div>
                <button
                  class="icon-button"
                  [attr.aria-label]="
                    (player.running() && player.part() === i ? 'Pause' : 'Play') +
                    ' section ' +
                    (i + 1)
                  "
                  (click)="playPart(i)"
                  [disabled]="busy() || (rec.kind === 'calibration' && !allSaved())"
                >
                  <app-icon [name]="player.running() && player.part() === i ? 'pause' : 'play'" />
                </button>
                @if (item.paragraphs?.length) {
                  <details class="transcript">
                    <summary>Read the transcript</summary>
                    @for (paragraph of item.paragraphs; track $index) {
                      <p lang="hi">{{ paragraph }}</p>
                    }
                  </details>
                }
              </div>
            }
            <p class="small-note">
              Sections play one after another. When the last one ends, playback stops.
            </p>
            <button
              class="button full"
              (click)="download()"
              [disabled]="offline.downloading() || allSaved()"
            >
              <app-icon name="down" />{{
                offline.downloading()
                  ? 'Saving…'
                  : allSaved()
                    ? 'Saved for offline'
                    : 'Save for offline · ' + megabytes() + ' MB'
              }}
            </button>
            @if (offline.downloading()) {
              <p class="small-note" role="status">{{ offline.progress() }}</p>
              <button class="text-button" (click)="offline.cancel()">Cancel</button>
            }
          </section>
          <section class="driving-panel">
            <app-icon name="car" />
            <h2>Get ready for the road.</h2>
            <p>
              Save every section for offline, then open Driving mode. Before you rely on it, try it
              with the screen off in Firefox or Chrome on your phone.
            </p>
            <button class="button secondary" (click)="openDriving()">
              Driving mode <app-icon name="arrow" /></button
            ><small>Not yet tested on real phones</small>
          </section>
        </aside>
      </div>
      @if (rec.kind === 'narration') {
        <p class="small-note credits-line">
          <a href="/narration/shastraparijna-hi-v1.mp3" download>Download the full MP3</a> ·
          <a href="/narration/shastraparijna-hi-v1.txt">Full transcript (.txt)</a> ·
          <a href="/narration/credits.txt">Credits and terms of use</a>
        </p>
      }
    }

    @if (devTools) {
      <details class="dev-tools">
        <summary>Developer tools</summary>
        <p class="small-note">
          Generated test tones, not a voice or an Āgama. For screen-off and offline checks on a
          phone.
        </p>
        <button class="button secondary" (click)="swapRecording()" [disabled]="busy()">
          {{
            player.selectedId() === NARRATION ? 'Switch to test tones' : 'Back to Shastra-parijnā'
          }}
        </button>
      </details>
    }

    <dialog #driving aria-labelledby="driving-title">
      <div class="dialog-heading">
        <h2 id="driving-title">Driving mode</h2>
        <button class="icon-button" aria-label="Close" (click)="driving.close()">
          <app-icon name="close" />
        </button>
      </div>
      <div class="drive-view">
        <app-icon name="car" /><span class="eyebrow"
          >Set up while parked · all sections offline</span
        >
        <h3 lang="hi">{{ part()?.title ?? recording()?.title }}</h3>
        <p>{{ recording()?.label }}</p>
        <span id="drive-time">{{ time(player.position()) }} / {{ time(player.duration()) }}</span>
        <div class="drive-controls">
          <button
            class="button secondary"
            aria-label="Back 15 seconds"
            (click)="seek(player.position() - 15)"
          >
            −15</button
          ><button
            class="play-button"
            [attr.aria-label]="player.running() ? 'Pause' : 'Play'"
            (click)="toggle()"
            [disabled]="busy()"
          >
            <app-icon [name]="player.running() ? 'pause' : 'play'" /></button
          ><button
            class="button secondary"
            aria-label="Forward 15 seconds"
            (click)="seek(player.position() + 15)"
          >
            +15
          </button>
        </div>
        <p class="small-note">
          Screen-off and incoming-call behaviour hasn’t been tested on real phones yet. Lock-screen
          controls depend on your browser.
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
  readonly NARRATION = NARRATION_ID;
  readonly devTools =
    ['localhost', '127.0.0.1'].includes(location.hostname) || location.search.includes('dev');
  readonly busy = signal(false);
  readonly recording = this.player.recording;
  readonly part = computed(() => this.player.parts()[this.player.part()]);
  readonly allSaved = computed(
    () =>
      this.offline.assets().length > 0 &&
      this.offline.saved().length === this.offline.assets().length,
  );
  readonly megabytes = computed(() => (this.offline.totalBytes() / 1_000_000).toFixed(1));
  @ViewChild('driving') private driving?: ElementRef<HTMLDialogElement>;

  constructor() {
    void this.run(() => this.player.useRecording(NARRATION_ID));
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
  playPart(index: number): void {
    void this.run(async () => {
      if (this.player.part() === index && this.player.prepared()) return this.player.toggle();
      await this.player.changePart(index);
      if (!this.player.running()) await this.player.toggle();
    });
  }
  swapRecording(): void {
    void this.run(() =>
      this.player.useRecording(
        this.player.selectedId() === NARRATION_ID ? CALIBRATION_ID : NARRATION_ID,
      ),
    );
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
          ? 'Saving cancelled. Sections already saved are safe.'
          : error instanceof Error
            ? error.message
            : 'Couldn’t save the audio. Please try again.',
      );
    }
  }

  async openDriving(): Promise<void> {
    try {
      for (const asset of this.offline.assets()) await this.offline.assertSaved(asset);
      this.driving?.nativeElement.showModal();
    } catch (error) {
      this.ui.error(error);
    }
  }
}
