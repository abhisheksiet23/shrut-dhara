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
      <div class="eyebrow">आँखों को आराम, विचारों को विस्तार</div>
      <h1>श्रवण यात्रा</h1>
      <p>आचारांग सूत्र · प्रथम अध्ययन · शस्त्रपरिज्ञा की हिन्दी व्याख्या</p>
      <a class="button secondary" routerLink="/acharanga">सभी २४ अध्ययन देखें</a>
    </div>

    @if (content.narrationError() && !recording()) {
      <section class="settings-panel">
        <h2>श्रवण सूची load नहीं हुई</h2>
        <p role="alert">{{ content.narrationError() }}</p>
        <button class="button secondary" (click)="content.loadNarration()">फिर कोशिश करें</button>
      </section>
    } @else if (recording(); as rec) {
      <div class="listening-layout">
        <section class="player-card">
          <div class="audio-art">
            <app-art />
            <div class="audio-art-title">
              <span>{{ rec.kind === 'narration' ? 'आचारांग सूत्र · प्रथम अध्ययन' : 'TEST TONES' }}</span>
              <h2>{{ rec.title }}</h2>
              <p>{{ rec.label }}</p>
            </div>
          </div>
          <div class="player-body">
            <div class="player-title">
              <div>
                <span class="eyebrow">{{ part()?.reference ?? 'भाग ' + (player.part() + 1) }}</span>
                <h2>{{ part()?.title ?? 'भाग ' + (player.part() + 1) }}</h2>
              </div>
              <app-icon name="headphones" />
            </div>
            <p class="player-status" role="status">
              {{ player.status() }} · भाग {{ player.part() + 1 }} / {{ rec.parts.length }}
            </p>
            <label class="sr-only" for="audio-seek">सुनने की जगह</label>
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
              <button class="icon-button" aria-label="इस भाग को शुरू से सुनें" (click)="restart()">
                <app-icon name="back" />
              </button>
            </div>
            @if (rec.kind === 'narration') {
              <p class="small-note">
                यह कृत्रिम आवाज़ में बनी समीक्षा प्रति है। मूल प्राकृत से अर्थ और उच्चारण का मिलान बाकी है।
              </p>
            }
            <div class="player-footer"><app-icon name="lock" /> श्रवण प्रगति पठन से अलग सहेजी जाती है</div>
          </div>
        </section>
        <aside class="listening-aside">
          <section class="queue-panel">
            <div class="section-heading">
              <h2>{{ rec.kind === 'narration' ? 'सात उद्देशक' : 'परीक्षण भाग' }}</h2>
              <span>{{ offline.saved().length }} / {{ rec.parts.length }} सहेजे</span>
            </div>
            @for (item of rec.parts; track item.id; let i = $index) {
              <div class="queue-item" [class.dim]="player.part() !== i">
                <span class="queue-number">0{{ i + 1 }}</span>
                <div class="grow">
                  <b>{{ item.title ?? 'भाग ' + (i + 1) }}</b>
                  <p>
                    {{ item.reference ? item.reference + ' · ' : '' }}{{ time(item.duration) }} ·
                    {{
                      offline.saved().includes(item.id) ? 'ऑफ़लाइन सहेजा हुआ' : 'इंटरनेट से चलेगा'
                    }}
                  </p>
                </div>
                <button
                  class="icon-button"
                  [attr.aria-label]="'भाग ' + (i + 1) + ' सुनें'"
                  (click)="playPart(i)"
                  [disabled]="busy() || (rec.kind === 'calibration' && !allSaved())"
                >
                  <app-icon [name]="player.running() && player.part() === i ? 'pause' : 'play'" />
                </button>
                @if (item.paragraphs?.length) {
                  <details class="transcript">
                    <summary>लिखित व्याख्या पढ़ें</summary>
                    @for (paragraph of item.paragraphs; track $index) {
                      <p>{{ paragraph }}</p>
                    }
                  </details>
                }
              </div>
            }
            <p class="small-note">
              भाग एक के बाद एक अपने आप चलते हैं। अंत में सब रुक जाता है, आगे कुछ अपने आप नहीं चलता।
            </p>
            <button
              class="button full"
              (click)="download()"
              [disabled]="offline.downloading() || allSaved()"
            >
              <app-icon name="down" />{{
                offline.downloading()
                  ? 'सहेजा जा रहा है…'
                  : allSaved()
                    ? 'ऑफ़लाइन सहेजा गया'
                    : 'ऑफ़लाइन सहेजें · ' + megabytes() + ' MB'
              }}
            </button>
            @if (offline.downloading()) {
              <p class="small-note" role="status">{{ offline.progress() }}</p>
              <button class="text-button" (click)="offline.cancel()">रद्द करें</button>
            }
          </section>
          <section class="driving-panel">
            <app-icon name="car" />
            <h2>सफ़र से पहले तैयार करें।</h2>
            <p>
              सभी भाग ऑफ़लाइन सहेजें, फिर ड्राइविंग मोड खोलें। असली सफ़र में भरोसा करने से पहले अपने फ़ोन के
              Firefox/Chrome में स्क्रीन बंद करके जाँच लें।
            </p>
            <button class="button secondary" (click)="openDriving()">
              ड्राइविंग मोड <app-icon name="arrow" /></button
            ><small>Firefox / Chrome · फ़ोन पर जाँच बाकी</small>
          </section>
        </aside>
      </div>
      @if (rec.kind === 'narration') {
        <p class="small-note credits-line">
          <a href="/narration/shastraparijna-hi-v1.mp3" download>पूरा MP3 डाउनलोड करें</a> ·
          <a href="/narration/shastraparijna-hi-v1.txt">पूरी लिखित व्याख्या (.txt)</a> ·
          <a href="/narration/credits.txt">श्रेय और उपयोग की शर्तें</a>
        </p>
      }
    }

    <details class="dev-tools">
      <summary>डेवलपर जाँच · परीक्षण ध्वनि</summary>
      <p class="small-note">
        ये केवल बनाई हुई टोन हैं, कोई आवाज़ या आगम नहीं। फ़ोन पर स्क्रीन-बंद और ऑफ़लाइन जाँच के लिए।
      </p>
      <button class="button secondary" (click)="swapRecording()" [disabled]="busy()">
        {{
          player.selectedId() === NARRATION
            ? 'परीक्षण ध्वनि चुनें'
            : 'शस्त्रपरिज्ञा श्रवण पर लौटें'
        }}
      </button>
    </details>

    <dialog #driving aria-labelledby="driving-title">
      <div class="dialog-heading">
        <h2 id="driving-title">ड्राइविंग मोड</h2>
        <button class="icon-button" aria-label="Close driving mode" (click)="driving.close()">
          <app-icon name="close" />
        </button>
      </div>
      <div class="drive-view">
        <app-icon name="car" /><span class="eyebrow">रुककर तैयार करें · सभी भाग ऑफ़लाइन</span>
        <h3>{{ part()?.title ?? recording()?.title }}</h3>
        <p>{{ recording()?.label }}</p>
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
          फ़ोन पर स्क्रीन-बंद और कॉल आने की जाँच बाकी है। Controls की उपलब्धता browser पर निर्भर है।
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
  readonly busy = signal(false);
  readonly recording = this.player.recording;
  readonly part = computed(() => this.player.parts()[this.player.part()]);
  readonly allSaved = computed(
    () => this.offline.assets().length > 0 && this.offline.saved().length === this.offline.assets().length,
  );
  readonly megabytes = computed(() => (this.offline.totalBytes() / 1_000_000).toFixed(1));
  @ViewChild('driving') private driving?: ElementRef<HTMLDialogElement>;

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
          ? 'Download रद्द हुआ। पूरे सहेजे हुए भाग सुरक्षित हैं।'
          : error instanceof Error
            ? error.message
            : 'Download विफल हुआ। फिर कोशिश करें।',
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
