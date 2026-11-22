import { Injectable, inject, signal } from '@angular/core';
import { ContentService } from './content.service';
import { MEANING_RECORDING_ID, Sutra } from './study-catalog';
import { PlaybackService } from './playback.service';

/** UI context is separate from durable learning progress. Browsing never seeks the player. */
@Injectable({ providedIn: 'root' })
export class StudyNavigationService {
  private readonly content = inject(ContentService);
  private readonly playback = inject(PlaybackService);
  readonly contentsChapter = signal(1);
  readonly contentsSection = signal(1);
  readonly listeningView = signal<string | null>(null);
  readonly contentsScroll = signal(0);
  readonly catalogueScroll = signal(0);
  readonly catalogueOpen = new Set<string>();

  remember(sutra: Sutra): void {
    this.contentsChapter.set(sutra.chapter);
    this.contentsSection.set(sutra.section);
  }

  async play(sutra: Sutra): Promise<void> {
    const index = this.content.catalog()?.audioIndex(this.content.meanings(), sutra.id) ?? -1;
    if (index < 0)
      throw new Error(
        'Audio for this sutra is not available yet. No other sutra has been selected.',
      );

    await this.playback.useRecording(MEANING_RECORDING_ID);
    if (this.playback.part() !== index || this.playback.referenceUnavailable()) {
      await this.playback.changePart(index);
    }
    if (!this.playback.running()) await this.playback.toggle();
  }
}
