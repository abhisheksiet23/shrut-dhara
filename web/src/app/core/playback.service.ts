import { Injectable, effect, inject, signal } from '@angular/core';
import { ContentService } from './content.service';
import { OfflineService } from './offline.service';
import { SessionService } from './session.service';
import { StudyService } from './study.service';
import { UiService } from './ui.service';
import { ListeningPosition, RECORDING_ID } from './models';

@Injectable({ providedIn: 'root' })
export class PlaybackService {
  private content = inject(ContentService);
  private offline = inject(OfflineService);
  private session = inject(SessionService);
  private study = inject(StudyService);
  private ui = inject(UiService);
  private audio = new Audio();
  readonly running = signal(false);
  readonly status = signal('Ready when you are');
  readonly part = signal(0);
  readonly position = signal(0);
  readonly duration = signal(900);
  readonly prepared = signal(false);
  readonly referenceUnavailable = signal(false);
  private generation = 0;
  private lastCheckpoint = 0;
  private pendingCheckpoint: Promise<void> = Promise.resolve();

  constructor() {
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'metadata';
    this.audio.addEventListener('play', () => {
      this.running.set(true);
      this.status.set('Loading audio…');
    });
    this.audio.addEventListener('playing', () => this.status.set('Playing · calibration audio'));
    this.audio.addEventListener('waiting', () => this.status.set('Waiting for audio…'));
    this.audio.addEventListener('pause', () => {
      this.running.set(false);
      this.status.set('Paused');
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
      this.status.set('Audio could not play');
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

  restorePosition(): void {
    if (this.prepared()) return;
    const saved = this.study.state().listening;
    this.referenceUnavailable.set(
      saved.recordingId !== RECORDING_ID ||
        saved.part >= (this.content.chapter()?.audio.length ?? 0),
    );
    if (this.referenceUnavailable()) {
      this.status.set('Saved recording unavailable · choose Restart for calibration');
      return;
    }
    if (
      saved.recordingId === RECORDING_ID &&
      saved.part < (this.content.chapter()?.audio.length ?? 0)
    ) {
      this.part.set(saved.part);
      this.position.set(saved.seconds);
    }
  }

  async toggle(): Promise<void> {
    this.session.assertOwner();
    if (this.referenceUnavailable())
      throw new Error('Saved recording उपलब्ध नहीं है। परीक्षण audio के लिए Restart चुनें।');
    if (this.running()) {
      this.audio.pause();
      await this.checkpoint();
    } else {
      if (!this.prepared()) await this.prepare(this.part(), this.position());
      if (this.audio.ended) await this.seek(0);
      try {
        await this.audio.play();
      } catch {
        this.running.set(false);
        this.status.set('Press Play to retry');
        throw new Error('Browser ने playback शुरू नहीं किया। Play फिर चुनें।');
      }
    }
  }

  private async prepare(part: number, seconds: number): Promise<void> {
    this.session.assertOwner();
    const assets = this.content.chapter()?.audio ?? [];
    if (!assets[part]) throw new Error('यह recording revision उपलब्ध नहीं है।');
    const generation = ++this.generation;
    // Preflight the full prepared sequence, not just its first streamed bytes.
    for (const asset of assets) await this.offline.assertSaved(asset);
    if (generation !== this.generation) throw new Error('पुरानी playback तैयारी रद्द की गई।');
    this.session.assertOwner();
    this.audio.pause();
    this.prepared.set(false);
    this.part.set(part);
    this.status.set('Preparing saved audio…');
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
        reject(new Error('Saved audio load नहीं हुआ।'));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Audio load का समय समाप्त। Retry करें।'));
      }, 15000);
      this.audio.addEventListener('loadedmetadata', loaded);
      this.audio.addEventListener('error', failed);
      this.audio.load();
    });
    if (generation !== this.generation) throw new Error('पुरानी playback तैयारी रद्द की गई।');
    if (!Number.isFinite(this.audio.duration) || seconds > this.audio.duration + 2) {
      throw new Error('Saved timestamp इस recording से मेल नहीं खाता। Restart चुनें।');
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
      throw new Error('Saved recording उपलब्ध नहीं है। पहले Restart चुनें।');
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
    if (resume) await this.audio.play();
  }

  private async nextPart(): Promise<void> {
    this.running.set(false);
    await this.checkpoint();
    const next = this.part() + 1;
    if (next >= (this.content.chapter()?.audio.length ?? 0)) {
      this.status.set('Prepared sequence finished');
      this.ui.notify('परीक्षण के दोनों parts पूरे हुए। आगे की सामग्री नहीं छोड़ी गई।');
      return;
    }
    try {
      this.session.assertOwner();
      await this.prepare(next, 0);
      await this.audio.play();
    } catch (error) {
      this.audio.pause();
      this.status.set('Paused at missing or unavailable part');
      throw error;
    }
  }

  checkpoint(internal = false): Promise<void> {
    if (!this.prepared() || !this.session.owned()) return Promise.resolve();
    const saved: ListeningPosition = {
      recordingId: RECORDING_ID,
      part: this.part(),
      seconds: this.audio.currentTime,
    };
    this.pendingCheckpoint = this.study.saveListening(saved, internal);
    return this.pendingCheckpoint;
  }

  async suspend(): Promise<void> {
    this.audio.pause();
    this.running.set(false);
    ++this.generation;
    await this.pendingCheckpoint.catch(() => {});
    await this.study.coordinator.drain();
    await this.checkpoint(true);
  }

  detach(): void {
    this.prepared.set(false);
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.running.set(false);
    this.status.set('Paused');
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
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* Unsupported action keeps in-app controls. */
      }
    }
  }

  private updateMediaSession(): void {
    if (!('mediaSession' in navigator) || !this.prepared() || !this.session.owned()) return;
    if (typeof MediaMetadata !== 'undefined')
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Calibration · Part ${this.part() + 1}`,
        artist: 'ShrutDhara · Generated test tones, not scripture',
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
