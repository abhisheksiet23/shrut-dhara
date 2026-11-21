import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ContentService } from './content.service';
import { OfflineService } from './offline.service';
import { SessionService } from './session.service';
import { StudyService } from './study.service';
import { UiService } from './ui.service';
import { ListeningPosition, NARRATION_ID, resolveListeningStart } from './models';

@Injectable({ providedIn: 'root' })
export class PlaybackService {
  private content = inject(ContentService);
  private offline = inject(OfflineService);
  private session = inject(SessionService);
  private study = inject(StudyService);
  private ui = inject(UiService);
  private audio = new Audio();
  private chapterAudio?: HTMLAudioElement;
  readonly running = signal(false);
  readonly status = signal('Ready when you are');
  readonly part = signal(0);
  readonly position = signal(0);
  readonly duration = signal(0);
  readonly selectedId = signal(NARRATION_ID);
  readonly recording = computed(() => this.content.recording(this.selectedId()));
  readonly parts = computed(() => this.recording()?.parts ?? []);
  readonly streaming = signal(false);
  readonly prepared = signal(false);
  readonly referenceUnavailable = signal(false);
  private generation = 0;
  private lastCheckpoint = 0;
  private pendingCheckpoint: Promise<void> = Promise.resolve();

  constructor() {
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'metadata';
    this.audio.addEventListener('play', () => {
      if (this.audio.paused) return;
      this.running.set(true);
      this.status.set('लोड हो रहा है…');
    });
    this.audio.addEventListener('playing', () => this.status.set(this.streaming() ? 'चल रहा है · इंटरनेट से' : 'चल रहा है'));
    this.audio.addEventListener('waiting', () => this.status.set('इंतज़ार…'));
    this.audio.addEventListener('pause', () => {
      this.running.set(false);
      this.status.set('रुका हुआ');
      if (!this.session.maintenance())
        void this.checkpoint().catch((error) => this.ui.error(error));
      this.updateMediaSession();
    });
    this.audio.addEventListener('timeupdate', () => {
      this.position.set(this.audio.currentTime);
      this.updateMediaSession();
      if (performance.now() - this.lastCheckpoint >= 2000 && !this.session.maintenance()) {
        this.lastCheckpoint = performance.now();
        void this.checkpoint().catch((error) => this.ui.error(error));
      }
    });
    this.audio.addEventListener('seeked', () => {
      this.position.set(this.audio.currentTime);
      if (!this.session.maintenance())
        void this.checkpoint().catch((error) => this.ui.error(error));
    });
    this.audio.addEventListener('ended', () => {
      void this.nextPart().catch((error) => this.ui.error(error));
    });
    this.audio.addEventListener('error', () => {
      this.running.set(false);
      this.status.set('Audio चल नहीं सका');
      this.ui.notify('Audio नहीं चल सका। Offline availability जाँचकर Retry करें।');
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.prepared() && !this.session.maintenance()) {
        void this.checkpoint().catch((error) => this.ui.error(error));
      }
    });
    effect(() => {
      this.audio.playbackRate = this.study.state().preferences.speed;
    });
    this.configureMediaSession();
  }

  /** Open the active recording at its saved position, or at its start if the save belongs to another recording. */
  restorePosition(): void {
    if (this.prepared()) return;
    const recording = this.recording();
    this.referenceUnavailable.set(false);
    if (!recording) {
      this.status.set('श्रवण सूची उपलब्ध नहीं');
      return;
    }
    const start = resolveListeningStart(this.study.state().listening, recording);
    if (start.kind === 'unavailable') {
      this.referenceUnavailable.set(true);
      this.status.set('सहेजी हुई जगह अब उपलब्ध नहीं · “शुरू से” चुनें');
      return;
    }
    this.part.set(start.part);
    this.position.set(start.seconds);
    this.duration.set(recording.parts[start.part].duration);
    this.status.set(start.kind === 'resume' ? 'रुका हुआ · सहेजी जगह से' : 'तैयार');
  }

  /** Switch which recording the player runs. Pauses and unloads the current one first. */
  async useRecording(id: string): Promise<void> {
    this.session.assertOwner();
    if (this.selectedId() === id) return;
    this.audio.pause();
    await this.checkpoint();
    this.detach();
    this.selectedId.set(id);
    this.offline.activeId.set(id);
    this.restorePosition();
  }

  playChapter(player: HTMLAudioElement): void {
    if (player.paused) return;
    if (!this.session.owned() || this.session.maintenance()) {
      player.pause();
      return;
    }
    if (this.chapterAudio === player) return;
    this.chapterAudio?.pause();
    this.chapterAudio = player;
    this.audio.pause();
    // Let the browser's native media controls target the chapter player.
    this.configureMediaSession();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setPositionState?.();
    }
  }

  pauseChapter(player: HTMLAudioElement | undefined): void {
    if (!player) return;
    player.pause();
    if (this.chapterAudio !== player) return;
    this.chapterAudio = undefined;
    this.configureMediaSession();
    this.updateMediaSession();
  }

  private playAudio(): Promise<void> {
    this.session.assertOwner();
    this.pauseChapter(this.chapterAudio);
    return this.audio.play();
  }

  async toggle(): Promise<void> {
    this.session.assertOwner();
    if (this.referenceUnavailable())
      throw new Error('सहेजी हुई जगह उपलब्ध नहीं है। “शुरू से” चुनें।');
    if (!this.audio.paused) {
      this.audio.pause();
      await this.checkpoint();
    } else {
      if (!this.prepared()) await this.prepare(this.part(), this.position());
      if (this.audio.ended) await this.seek(0);
      try {
        await this.playAudio();
      } catch {
        this.running.set(false);
        this.status.set('फिर Play दबाएँ');
        throw new Error('Browser ने playback शुरू नहीं किया। Play फिर चुनें।');
      }
    }
  }

  private async prepare(part: number, seconds: number): Promise<void> {
    this.session.assertOwner();
    const assets = this.parts();
    if (!assets[part]) throw new Error('यह recording उपलब्ध नहीं है।');
    const generation = ++this.generation;
    // Tone fixture keeps the strict rule (every part saved before it runs). The real narration
    // may also stream online; Driving mode still requires every part to be saved offline.
    await this.offline.reconcile();
    this.streaming.set(this.offline.saved().length !== assets.length);
    if (this.recording()?.kind === 'calibration')
      for (const asset of assets) await this.offline.assertSaved(asset);
    if (generation !== this.generation) throw new Error('पुरानी playback तैयारी रद्द की गई।');
    this.session.assertOwner();
    this.audio.pause();
    this.prepared.set(false);
    this.part.set(part);
    this.status.set('तैयार हो रहा है…');
    this.audio.src = assets[part].url;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        this.audio.removeEventListener('loadedmetadata', loaded);
        this.audio.removeEventListener('error', failed);
        clearTimeout(timeout);
      };
      const loaded = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        reject(new Error('Audio load नहीं हुआ। इंटरनेट या सहेजी फ़ाइल जाँचें।'));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Audio load का समय समाप्त। फिर कोशिश करें।'));
      }, 15000);
      this.audio.addEventListener('loadedmetadata', loaded);
      this.audio.addEventListener('error', failed);
      this.audio.load();
    });
    if (generation !== this.generation) throw new Error('पुरानी playback तैयारी रद्द की गई।');
    if (!Number.isFinite(this.audio.duration) || seconds > this.audio.duration + 2) {
      throw new Error('सहेजी हुई जगह इस recording से मेल नहीं खाती। “शुरू से” चुनें।');
    }
    this.duration.set(this.audio.duration);
    this.audio.currentTime = Math.min(seconds, this.audio.duration);
    this.audio.playbackRate = this.study.state().preferences.speed;
    this.position.set(this.audio.currentTime);
    this.prepared.set(true);
    this.referenceUnavailable.set(false);
    this.updateMediaSession();
  }

  async seek(seconds: number): Promise<void> {
    this.session.assertOwner();
    if (this.referenceUnavailable())
      throw new Error('सहेजी हुई जगह उपलब्ध नहीं है। पहले “शुरू से” चुनें।');
    if (!this.prepared()) await this.prepare(this.part(), this.position());
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, seconds));
    this.position.set(this.audio.currentTime);
    await this.checkpoint();
  }

  async restart(): Promise<void> {
    this.session.assertOwner();
    this.audio.pause();
    await this.prepare(0, 0);
    await this.checkpoint();
  }

  async changePart(index: number): Promise<void> {
    this.session.assertOwner();
    const resume = this.running();
    this.audio.pause();
    await this.checkpoint();
    await this.prepare(index, 0);
    await this.checkpoint();
    if (resume && !this.chapterAudio) await this.playAudio();
  }

  private async nextPart(): Promise<void> {
    this.running.set(false);
    await this.checkpoint();
    const next = this.part() + 1;
    if (next >= this.parts().length) {
      this.status.set('सभी भाग पूरे हुए');
      this.ui.notify('सभी भाग पूरे हुए। आगे कुछ अपने आप नहीं चलेगा।');
      return;
    }
    try {
      this.session.assertOwner();
      await this.prepare(next, 0);
      if (!this.chapterAudio) await this.playAudio();
    } catch (error) {
      this.audio.pause();
      this.status.set('अगला भाग उपलब्ध नहीं · रुका हुआ');
      throw error;
    }
  }

  checkpoint(internal = false): Promise<void> {
    if (!this.prepared() || !this.session.owned()) return Promise.resolve();
    const saved: ListeningPosition = {
      recordingId: this.selectedId(),
      part: this.part(),
      seconds: this.audio.currentTime,
    };
    this.pendingCheckpoint = this.study.saveListening(saved, internal);
    return this.pendingCheckpoint;
  }

  async suspend(): Promise<void> {
    this.pauseChapter(this.chapterAudio);
    this.audio.pause();
    this.running.set(false);
    ++this.generation;
    await this.pendingCheckpoint.catch(() => {});
    await this.study.coordinator.drain();
    await this.checkpoint(true);
  }

  detach(): void {
    this.prepared.set(false);
    this.pauseChapter(this.chapterAudio);
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.running.set(false);
    this.status.set('रुका हुआ');
    ++this.generation;
  }

  private configureMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      [
        'play',
        () => {
          if (!this.running()) void this.toggle().catch((error) => this.ui.error(error));
        },
      ],
      ['pause', () => this.audio.pause()],
      [
        'seekbackward',
        (event) => {
          void this.seek(this.position() - (event.seekOffset ?? 15)).catch((error) =>
            this.ui.error(error),
          );
        },
      ],
      [
        'seekforward',
        (event) => {
          void this.seek(this.position() + (event.seekOffset ?? 15)).catch((error) =>
            this.ui.error(error),
          );
        },
      ],
      [
        'seekto',
        (event) => {
          if (event.seekTime !== undefined)
            void this.seek(event.seekTime).catch((error) => this.ui.error(error));
        },
      ],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, this.chapterAudio ? null : handler);
      } catch {
        /* Unsupported action keeps in-app controls. */
      }
    }
  }

  private updateMediaSession(): void {
    if (
      this.chapterAudio ||
      !('mediaSession' in navigator) ||
      !this.prepared() ||
      !this.session.owned()
    )
      return;
    if (typeof MediaMetadata !== 'undefined')
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.recording()?.parts[this.part()]?.title
          ? `${this.recording()!.title} · ${this.recording()!.parts[this.part()].title}`
          : `${this.recording()?.title ?? 'ShrutDhara'} · भाग ${this.part() + 1}`,
        artist: `श्रुतधारा · ${this.recording()?.label ?? ''}`,
      });
    navigator.mediaSession.playbackState = this.running() ? 'playing' : 'paused';
    try {
      navigator.mediaSession.setPositionState({
        duration: this.duration(),
        playbackRate: this.audio.playbackRate,
        position: Math.min(this.position(), this.duration()),
      });
    } catch {
      /* Firefox/browser versions may expose only some session APIs. */
    }
  }
}
