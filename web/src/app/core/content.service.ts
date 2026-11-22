import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CALIBRATION_ID,
  Chapter,
  FIXTURE_IDS,
  NARRATION_ID,
  Recording,
  parseNarrationManifest,
} from './models';
import { UiService } from './ui.service';
import { MEANING_RECORDING_ID, StudyCatalog, parseMeaningRecording } from './study-catalog';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly catalog = signal<StudyCatalog | null>(null);
  readonly catalogError = signal('');
  readonly meanings = signal<Recording | null>(null);
  readonly meaningAudioError = signal('');
  readonly chapter = signal<Chapter | null>(null);
  readonly narration = signal<Recording | null>(null);
  readonly narrationError = signal('');
  /** Developer-only tone fixture for phone/browser audio checks. Never presented as study content. */
  readonly calibration = computed<Recording | null>(() => {
    const audio = this.chapter()?.audio;
    return audio
      ? {
          id: CALIBRATION_ID,
          kind: 'calibration',
          title: 'Audio calibration',
          label: 'Generated test tones · not speech or scripture',
          parts: audio,
        }
      : null;
  });
  recording(id: string): Recording | null {
    if (id === MEANING_RECORDING_ID) return this.meanings();
    if (id === CALIBRATION_ID) return this.calibration();
    return id === NARRATION_ID ? this.narration() : null;
  }
  readonly loading = signal(false);
  readonly error = signal('');
  private ui = inject(UiService);

  async loadStudy(): Promise<void> {
    this.catalogError.set('');
    this.meaningAudioError.set('');
    try {
      const response = await fetch('/content/shastraparijna-v2/study.json');
      if (!response.ok) throw new Error('The study contents are unavailable. Please try again.');
      const catalog = StudyCatalog.parse(await response.json());
      this.catalog.set(catalog);

      const audio = await fetch('/narration/meaning-v1/manifest.json');
      if (!audio.ok)
        throw new Error(
          'The sutra audio sample is not available yet. Your saved listening place is unchanged.',
        );
      this.meanings.set(parseMeaningRecording(await audio.json(), catalog));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load the study.';
      if (this.catalog()) this.meaningAudioError.set(message);
      else this.catalogError.set(message);
    }
  }

  async loadNarration(): Promise<void> {
    this.narrationError.set('');
    try {
      const response = await fetch('/narration/shastraparijna/manifest.json');
      if (!response.ok)
        throw new Error(
          'The listening list isn’t available right now. Connect to the internet and try again.',
        );
      this.narration.set(parseNarrationManifest(await response.json()));
    } catch (error) {
      this.narrationError.set(
        error instanceof Error
          ? error.message
          : 'Couldn’t load the listening list. Please try again.',
      );
    }
  }

  async load(): Promise<void> {
    await this.loadStudy();
    await this.loadNarration();
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch('/content/fixture-v1/chapter.json');
      if (!response.ok)
        throw new Error(
          'The sample content isn’t available right now. Connect to the internet and try again.',
        );
      const value: Chapter = await response.json();
      if (
        value.status !== 'interface-fixture' ||
        value.revision !== 'fixture-v1' ||
        value.passages.length !== FIXTURE_IDS.length ||
        value.passages.some((passage, index) => passage.id !== FIXTURE_IDS[index]) ||
        !Array.isArray(value.audio)
      ) {
        throw new Error(
          'This content was made for a different version of the app. Please reload to update.',
        );
      }
      for (const asset of value.audio) {
        if (
          !/^\/audio\/fixture-v1\/[a-z0-9-]+\.wav$/.test(asset.url) ||
          !/^[a-f0-9]{64}$/.test(asset.sha256) ||
          !Number.isSafeInteger(asset.bytes) ||
          asset.bytes <= 0 ||
          asset.duration <= 0
        ) {
          throw new Error('The audio list couldn’t be read. Please reload and try again.');
        }
      }
      this.chapter.set(value);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Couldn’t load the content. Please try again.';
      this.error.set(message);
      this.ui.notify(message);
    } finally {
      this.loading.set(false);
    }
  }
}
