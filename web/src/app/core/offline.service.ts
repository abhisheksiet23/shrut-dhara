import { Injectable, inject, signal } from '@angular/core';
import { AudioAsset } from './models';
import { ContentService } from './content.service';
import { SessionService } from './session.service';
import { UiService } from './ui.service';

export const MEDIA_CACHE = 'shrutdhara-media-v1';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private content = inject(ContentService);
  private session = inject(SessionService);
  private ui = inject(UiService);
  readonly saved = signal<string[]>([]);
  readonly downloading = signal(false);
  readonly progress = signal('');
  readonly shellReady = signal(false);
  readonly updateWaiting = signal(false);
  readonly storageStatus = signal('Browser-managed storage');
  private controller?: AbortController;
  private task: Promise<void> = Promise.resolve();

  async registerWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.shellReady.set(!!registration.active);
      this.updateWaiting.set(!!registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'activated') this.shellReady.set(true);
          if (installing.state === 'installed' && registration.waiting)
            this.updateWaiting.set(true);
        });
      });
    } catch {
      this.ui.notify('Offline shell तैयार नहीं हुआ। ऑनलाइन उपयोग जारी रख सकते हैं; build/serve जाँचें।');
    }
  }

  async reconcile(): Promise<void> {
    if (!('caches' in window)) return;
    const cache = await caches.open(MEDIA_CACHE);
    const ready: string[] = [];
    for (const asset of this.content.chapter()?.audio ?? []) {
      const cached = await cache.match(asset.url);
      if (
        cached?.status === 200 &&
        cached.headers.get('x-content-sha256') === asset.sha256 &&
        Number(cached.headers.get('content-length')) === asset.bytes
      )
        ready.push(asset.id);
    }
    this.saved.set(ready);
  }

  async assertSaved(asset: AudioAsset): Promise<void> {
    await this.reconcile();
    if (!this.saved().includes(asset.id))
      throw new Error('यह पूरा audio part offline नहीं है। पहले Save audio चुनें।');
  }

  async saveAudio(): Promise<void> {
    this.session.assertOwner();
    if (this.downloading()) return;
    if (!('caches' in window)) throw new Error('इस browser में offline media storage उपलब्ध नहीं है।');
    this.controller = new AbortController();
    this.downloading.set(true);
    this.task = this.download(this.controller.signal);
    try {
      await this.task;
      this.ui.notify('दोनों audio parts इस browser में सहेजे गए।');
    } finally {
      this.downloading.set(false);
      this.progress.set('');
      await this.reconcile();
    }
  }

  private async download(signal: AbortSignal): Promise<void> {
    const assets = this.content.chapter()?.audio;
    if (!assets) throw new Error('पहले सामग्री load होने दें।');
    const cache = await caches.open(MEDIA_CACHE);
    for (const [index, asset] of assets.entries()) {
      this.progress.set(`Part ${index + 1} / ${assets.length} · verifying complete file`);
      await this.reconcile();
      if (this.saved().includes(asset.id)) continue;
      const response = await fetch(asset.url, { signal, cache: 'no-store' });
      if (response.status !== 200) throw new Error('पूरा audio download नहीं हुआ। Retry करें।');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== asset.bytes)
        throw new Error('Audio अधूरा है। पुरानी उपलब्ध सामग्री सुरक्षित है।');
      const digest = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
        (item) => item.toString(16).padStart(2, '0'),
      ).join('');
      if (digest !== asset.sha256) throw new Error('Audio की integrity जाँच विफल हुई। Retry करें।');
      signal.throwIfAborted();
      this.session.assertOwner(true);
      await cache.put(
        asset.url,
        new Response(bytes, {
          headers: {
            'content-type': 'audio/wav',
            'content-length': String(asset.bytes),
            'x-content-sha256': asset.sha256,
            'accept-ranges': 'bytes',
          },
        }),
      );
    }
  }

  async cancel(): Promise<void> {
    this.controller?.abort();
    await this.task.catch(() => {});
    await this.reconcile();
  }

  async removeAudio(): Promise<void> {
    this.session.assertOwner();
    await this.cancel();
    const cache = await caches.open(MEDIA_CACHE);
    for (const asset of this.content.chapter()?.audio ?? []) await cache.delete(asset.url);
    await this.reconcile();
  }

  async requestPersistence(): Promise<void> {
    this.session.assertOwner();
    const persistent = await navigator.storage?.persist?.();
    this.storageStatus.set(
      persistent ? 'Persistent storage granted' : 'Best effort · keep a backup',
    );
    this.ui.notify(
      persistent
        ? 'Persistent storage मिला। Site data हटाने पर यह भी मिट सकता है।'
        : 'Browser ने persistence नहीं दिया। Backup निर्यात करके रखें।',
    );
  }
}
