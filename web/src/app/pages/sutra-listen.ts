import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../core/content.service';
import { PlaybackService } from '../core/playback.service';
import { OfflineService } from '../core/offline.service';
import { StudyService } from '../core/study.service';
import { StudyNavigationService } from '../core/study-navigation.service';
import { UiService } from '../core/ui.service';
import { FIRST_SUTRA_ID, MEANING_RECORDING_ID, Sutra } from '../core/study-catalog';
import { formatTime } from '../core/models';
import { StudyContext } from '../shared/study-context';
import { Icon } from '../shared/icon';

@Component({
  imports: [RouterLink, StudyContext, Icon],
  template: `
    <app-study-context [sutra]="sutra()" />
    <div class="study-toolbar">
      <a class="text-button" routerLink="/study">Contents</a
      ><span class="pill amber">AI voice · review sample</span>
    </div>
    @if (sutra(); as current) {
      <div class="sutra-listening-layout">
        <section class="sutra-player">
          <span class="eyebrow">Hindi meaning</span>
          <h1>Sutra {{ current.reference }}</h1>
          <p class="small-note">
            First uddeshaka · Hindi draft through Jacobi’s English translation. Meaning and
            pronunciation await qualified review.
          </p>

          @if (audioAvailable()) {
            <div class="meaning-player-controls">
              <button
                class="icon-button"
                aria-label="Back 15 seconds"
                [disabled]="busy()"
                (click)="seek(-15)"
              >
                <app-icon name="back15" />
              </button>
              <button
                class="play-button"
                [attr.aria-label]="
                  activeHere() && player.running() ? 'Pause audio' : 'Play this sutra'
                "
                [disabled]="busy()"
                (click)="toggle()"
              >
                <app-icon [name]="activeHere() && player.running() ? 'pause' : 'play'" />
              </button>
              <button
                class="icon-button"
                aria-label="Forward 15 seconds"
                [disabled]="busy()"
                (click)="seek(15)"
              >
                <app-icon name="fwd15" />
              </button>
            </div>
            <p class="player-status" role="status">
              {{
                busy() ? 'Getting ready…' : activeHere() ? player.status() : 'Ready when you are'
              }}
            </p>
            <label class="sr-only" for="sutra-seek">Position in this sutra</label>
            <input
              id="sutra-seek"
              class="seek"
              type="range"
              min="0"
              step="1"
              [max]="duration()"
              [value]="position()"
              [disabled]="busy()"
              (change)="seekTo($event)"
            />
            <div class="time-labels">
              <span>{{ time(position()) }}</span><span>{{ time(duration()) }}</span>
            </div>
            <div class="study-toolbar">
              <button class="text-button" [disabled]="busy()" (click)="replay()">
                <app-icon name="restart" />Replay this sutra
              </button>
              <button class="text-button" [disabled]="busy()" (click)="speed()">
                Speed {{ study.state().preferences.speed }}×
              </button>
            </div>
          } @else {
            <div class="meaning-unavailable">
              <h2>Audio is not ready for this sutra</h2>
              <p>No nearby recording has been substituted.</p>
            </div>
            @if (content.meaningAudioError()) {
              <p role="alert">{{ content.meaningAudioError() }}</p>
              <button class="button secondary" (click)="content.loadStudy()">
                Try loading audio again
              </button>
            }
          }

          <nav class="sutra-navigation" aria-label="Sutra navigation">
            <button class="button secondary" [disabled]="!previous() || busy()" (click)="go(previous())">
              <app-icon name="back" />Previous sutra
            </button>
            <button class="button" [disabled]="!next() || busy()" (click)="go(next())">
              Next sutra<app-icon name="arrow" />
            </button>
          </nav>

          <div class="read-listen-bridge">
            <a class="button secondary" [routerLink]="['/read', current.id]"
              ><app-icon name="book" />Read this sutra</a
            >
            <button class="text-button" [attr.aria-pressed]="bookmarked()" (click)="bookmark()">
              <app-icon name="bookmark" />{{
                bookmarked() ? 'Remove bookmark' : 'Bookmark this sutra'
              }}
            </button>
          </div>
        </section>

        <section class="listening-meaning">
          <h2>Hindi meaning <small>Draft</small></h2>
          @if (current.meaning) {
            <p lang="hi">{{ current.meaning }}</p>
          } @else {
            <p>
              The Hindi meaning is being prepared. This source reference stays in its original
              order.
            </p>
          }
          <a class="text-button" routerLink="/study" fragment="study-source">Source and review</a>
        </section>
      </div>

      <section class="offline-study">
        <div>
          <h2>Keep this sample offline</h2>
          <p>
            {{ content.meanings()?.parts?.length ?? 0 }} sutra meanings · {{ savedCount() }} saved ·
            {{ megabytes() }} MB
          </p>
          <p class="small-note">
            The sample stops after sutra 1.1.7. Further meanings are pending; nothing is skipped.
          </p>
        </div>
        <button
          class="button secondary"
          [disabled]="busy() || offline.downloading() || !content.meanings() || allSaved()"
          (click)="download()"
        >
          {{
            offline.downloading()
              ? 'Saving…'
              : allSaved()
                ? 'Saved for offline'
                : 'Save audio sample'
          }}
        </button>
        @if (offline.downloading()) {
          <p role="status">{{ offline.progress() }}</p>
          <button class="text-button" (click)="offline.cancel()">Cancel</button>
        }
      </section>
      <p class="small-note">
        Your reading place is independent. Screen-off and headset behaviour still need testing on
        your phone.
      </p>
      <a class="text-button" routerLink="/listen/commentary"
        >Earlier chapter commentary and saved position</a
      >
    } @else {
      <section class="empty">
        <h1>This sutra reference is unavailable</h1>
        <p>Your listening place is unchanged.</p>
        <a class="button" routerLink="/study">Study contents</a>
      </section>
    }
  `,
})
export class SutraListen implements OnDestroy {
  readonly content = inject(ContentService);
  readonly player = inject(PlaybackService);
  readonly offline = inject(OfflineService);
  readonly study = inject(StudyService);
  private readonly navigation = inject(StudyNavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);
  readonly requestedId = signal(FIRST_SUTRA_ID);
  readonly followsPlayer = signal(false);
  readonly busy = signal(false);
  readonly time = formatTime;
  readonly selectedId = computed(() =>
    this.followsPlayer() && this.player.selectedId() === MEANING_RECORDING_ID
      ? (this.player.parts()[this.player.part()]?.id ?? this.requestedId())
      : this.requestedId(),
  );
  readonly sutra = computed(() => this.content.catalog()?.find(this.selectedId()) ?? null);
  readonly audioIndex = computed(
    () => this.content.catalog()?.audioIndex(this.content.meanings(), this.selectedId()) ?? -1,
  );
  readonly audioAvailable = computed(() => this.audioIndex() >= 0);
  readonly activeHere = computed(
    () =>
      this.player.selectedId() === MEANING_RECORDING_ID &&
      this.player.parts()[this.player.part()]?.id === this.selectedId(),
  );
  readonly position = computed(() => (this.activeHere() ? this.player.position() : 0));
  readonly duration = computed(() =>
    this.activeHere()
      ? this.player.duration()
      : (this.content.meanings()?.parts[this.audioIndex()]?.duration ?? 0),
  );
  readonly previous = computed(
    () => this.content.catalog()?.adjacent(this.selectedId(), -1) ?? null,
  );
  readonly next = computed(() => this.content.catalog()?.adjacent(this.selectedId(), 1) ?? null);
  readonly bookmarked = computed(() =>
    this.study.state().bookmarks.some((item) => item.sutraId === this.selectedId()),
  );
  readonly savedCount = computed(() =>
    this.offline.activeId() === MEANING_RECORDING_ID ? this.offline.saved().length : 0,
  );
  readonly allSaved = computed(
    () =>
      !!this.content.meanings()?.parts.length &&
      this.savedCount() === this.content.meanings()!.parts.length,
  );
  readonly megabytes = computed(() =>
    (
      (this.content.meanings()?.parts.reduce((sum, part) => sum + part.bytes, 0) ?? 0) / 1e6
    ).toFixed(1),
  );

  constructor() {
    effect(() => this.navigation.listeningView.set(this.selectedId()));
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const explicit = params.get('id');
      const state = this.study.state();
      const saved =
        state.listening.recordingId === MEANING_RECORDING_ID
          ? state.listening
          : state.listeningHistory?.[MEANING_RECORDING_ID];
      const savedPart = saved ? this.content.meanings()?.parts[saved.part] : null;
      const unavailable = !!saved && !savedPart;
      this.followsPlayer.set(
        !explicit && !unavailable && this.player.selectedId() === MEANING_RECORDING_ID,
      );
      this.requestedId.set(
        explicit ?? (unavailable ? 'unavailable:saved-audio' : (savedPart?.id ?? FIRST_SUTRA_ID)),
      );
      const current = this.content.catalog()?.find(this.requestedId());
      if (current) this.navigation.remember(current);
    });
  }

  ngOnDestroy(): void {
    this.navigation.listeningView.set(null);
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
    void this.run(async () => {
      const current = this.sutra();
      if (!current) return;
      if (this.activeHere() && !this.player.referenceUnavailable()) await this.player.toggle();
      else await this.navigation.play(current);
      this.followsPlayer.set(true);
    });
  }

  replay(): void {
    void this.run(async () => {
      const current = this.sutra();
      if (!current) return;
      await this.navigation.play(current);
      await this.player.seek(0);
      this.followsPlayer.set(true);
    });
  }

  seek(delta: number): void {
    void this.run(() => this.seekCurrent(this.position() + delta));
  }

  seekTo(event: Event): void {
    const seconds = Number((event.target as HTMLInputElement).value);
    void this.run(() => this.seekCurrent(seconds));
  }

  private async seekCurrent(seconds: number): Promise<void> {
    if (!this.audioAvailable()) return;
    await this.player.useRecording(MEANING_RECORDING_ID);
    if (this.player.part() !== this.audioIndex()) await this.player.changePart(this.audioIndex());
    await this.player.seek(seconds);
    this.followsPlayer.set(true);
  }

  go(sutra: Sutra | null): void {
    if (!sutra) return;
    void this.run(async () => {
      const wasRunning = this.player.running() && this.player.selectedId() === MEANING_RECORDING_ID;
      await this.player.suspend();
      this.followsPlayer.set(false);
      await this.router.navigate(['/listen', sutra.id]);
      const index = this.content.catalog()?.audioIndex(this.content.meanings(), sutra.id) ?? -1;
      if (index < 0) return;
      await this.player.useRecording(MEANING_RECORDING_ID);
      await this.player.changePart(index);
      if (wasRunning) await this.player.toggle();
    });
  }

  async speed(): Promise<void> {
    const rates = [0.75, 1, 1.25, 1.5];
    await this.run(() =>
      this.study.setPreferences({
        speed: rates[(rates.indexOf(this.study.state().preferences.speed) + 1) % rates.length],
      }),
    );
  }

  async bookmark(): Promise<void> {
    const sutra = this.sutra();
    if (!sutra) return;
    await this.run(() =>
      this.study.toggleBookmark(
        sutra.id,
        `Sutra ${sutra.reference}`,
        this.content.catalog()!.document.revision,
      ),
    );
  }

  download(): void {
    void this.run(async () => {
      if (this.offline.activeId() !== MEANING_RECORDING_ID) {
        await this.offline.cancel();
        this.offline.activeId.set(MEANING_RECORDING_ID);
      }
      await this.offline.saveAudio();
    });
  }
}
