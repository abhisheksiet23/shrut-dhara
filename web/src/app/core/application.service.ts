import { Injectable, inject, signal } from '@angular/core';
import { Backup } from './models';
import { ContentService } from './content.service';
import { OfflineService } from './offline.service';
import { PlaybackService } from './playback.service';
import { SessionService } from './session.service';
import { StudyService } from './study.service';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  readonly updatePrepared = signal(false);
  readonly content = inject(ContentService);
  readonly offline = inject(OfflineService);
  readonly playback = inject(PlaybackService);
  readonly session = inject(SessionService);
  readonly study = inject(StudyService);
  readingFlusher: () => Promise<void> = async () => {};

  async initialize(): Promise<void> {
    this.session.setPrepareRelease(() => this.prepareRelease());
    await this.session.tryAcquire();
    await this.study.load();
    await this.content.load();
    this.playback.restorePosition();
    await this.offline.reconcile().catch(() => {});
    void this.offline.registerWorker();
  }

  async useThisWindow(): Promise<boolean> {
    if (!(await this.session.requestControl())) return false;
    await this.study.load();
    this.playback.restorePosition();
    this.updatePrepared.set(false);
    return this.study.ready();
  }

  private async settle(): Promise<void> {
    await this.readingFlusher();
    await this.playback.suspend();
    await this.offline.cancel();
    await this.study.coordinator.drain();
  }

  private async prepareRelease(): Promise<void> {
    await this.settle();
    this.playback.detach();
    await this.study.close();
  }

  async restore(backup: Backup): Promise<void> {
    this.session.assertOwner();
    this.session.maintenance.set(true);
    try {
      await this.settle();
      this.playback.detach();
      await this.study.restore(backup.data);
      this.playback.restorePosition();
    } finally {
      this.session.maintenance.set(false);
    }
  }

  async prepareUpdate(): Promise<void> {
    await this.session.release();
    this.updatePrepared.set(true);
  }

  async removeAudio(): Promise<void> {
    this.session.assertOwner();
    this.session.maintenance.set(true);
    try {
      await this.playback.suspend();
      this.playback.detach();
      await this.offline.cancel();
    } finally {
      this.session.maintenance.set(false);
    }
    await this.offline.removeAudio();
  }
}
