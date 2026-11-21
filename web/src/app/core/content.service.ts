import { Injectable, computed, inject, signal } from '@angular/core';
import { CALIBRATION_ID, Chapter, FIXTURE_IDS, Recording, parseNarrationManifest } from './models';
import { UiService } from './ui.service';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly chapter = signal<Chapter | null>(null);
  readonly narration = signal<Recording | null>(null);
  readonly narrationError = signal('');
  /** Developer-only tone fixture for phone/browser audio checks. Never presented as study content. */
  readonly calibration = computed<Recording | null>(() => {
    const audio = this.chapter()?.audio;
    return audio
      ? { id: CALIBRATION_ID, kind: 'calibration', title: 'Audio calibration', label: 'Generated test tones · not speech or scripture', parts: audio }
      : null;
  });
  recording(id: string): Recording | null {
    return id === CALIBRATION_ID ? this.calibration() : this.narration();
  }
  readonly loading = signal(false);
  readonly error = signal('');
  private ui = inject(UiService);

  async loadNarration(): Promise<void> {
    this.narrationError.set('');
    try {
      const response = await fetch('/narration/shastraparijna/manifest.json');
      if (!response.ok) throw new Error('श्रवण सूची उपलब्ध नहीं है। ऑनलाइन होकर फिर कोशिश करें।');
      this.narration.set(parseNarrationManifest(await response.json()));
    } catch (error) {
      this.narrationError.set(
        error instanceof Error ? error.message : 'श्रवण सूची load नहीं हुई। फिर कोशिश करें।',
      );
    }
  }

  async load(): Promise<void> {
    await this.loadNarration();
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch('/content/fixture-v1/chapter.json');
      if (!response.ok) throw new Error('नमूना सामग्री उपलब्ध नहीं है। ऑनलाइन होकर Retry करें।');
      const value: Chapter = await response.json();
      if (
        value.status !== 'interface-fixture' ||
        value.revision !== 'fixture-v1' ||
        value.passages.length !== FIXTURE_IDS.length ||
        value.passages.some((passage, index) => passage.id !== FIXTURE_IDS[index]) ||
        !Array.isArray(value.audio)
      ) {
        throw new Error('Content manifest का version मान्य नहीं है।');
      }
      for (const asset of value.audio) {
        if (
          !/^\/audio\/fixture-v1\/[a-z0-9-]+\.wav$/.test(asset.url) ||
          !/^[a-f0-9]{64}$/.test(asset.sha256) ||
          !Number.isSafeInteger(asset.bytes) ||
          asset.bytes <= 0 ||
          asset.duration <= 0
        ) {
          throw new Error('Audio manifest मान्य नहीं है।');
        }
      }
      this.chapter.set(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Content load नहीं हुआ। Retry करें।';
      this.error.set(message);
      this.ui.notify(message);
    } finally {
      this.loading.set(false);
    }
  }
}
