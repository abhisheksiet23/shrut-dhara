import { Injectable, inject, signal } from '@angular/core';
import { Chapter, FIXTURE_IDS } from './models';
import { UiService } from './ui.service';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly chapter = signal<Chapter | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  private ui = inject(UiService);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch('/content/fixture-v1/chapter.json');
      if (!response.ok) throw new Error('नमूना सामग्री उपलब्ध नहीं है। ऑनलाइन होकर Retry करें।');
      const value: Chapter = await response.json();
      if (value.status !== 'interface-fixture' || value.revision !== 'fixture-v1' || value.passages.length !== FIXTURE_IDS.length || value.passages.some((passage, index) => passage.id !== FIXTURE_IDS[index]) || !Array.isArray(value.audio)) {
        throw new Error('Content manifest का version मान्य नहीं है।');
      }
      for (const asset of value.audio) {
        if (!/^\/audio\/fixture-v1\/[a-z0-9-]+\.wav$/.test(asset.url) || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || asset.duration <= 0) {
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
