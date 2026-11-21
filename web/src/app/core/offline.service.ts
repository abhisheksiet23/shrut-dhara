import { Injectable, computed, inject, signal } from '@angular/core';
import { AudioAsset, NARRATION_ID } from './models';
import { ContentService } from './content.service';
import { SessionService } from './session.service';
import { UiService } from './ui.service';

export const MEDIA_CACHE = 'shrutdhara-media-v1';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private content = inject(ContentService);
  private session = inject(SessionService);
  private ui = inject(UiService);
  /** Which recording the Save / Remove controls act on. The playback service keeps this in step. */
  readonly activeId = signal(NARRATION_ID);
  readonly assets = computed<AudioAsset[]>(() => this.content.recording(this.activeId())?.parts ?? []);
  readonly totalBytes = computed(() => this.assets().reduce((sum, asset) => sum + asset.bytes, 0));
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
      this.ui.notify('Offline mode isn’t ready yet. You can keep using the app while online.');
    }
  }

  async reconcile(): Promise<void> {
    if (!('caches' in window)) return;
    const cache = await caches.open(MEDIA_CACHE);
    const ready: string[] = [];
    for (const asset of this.assets()) {
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
      throw new Error('This section isn’t saved for offline yet. Choose “Save for offline” first.');
  }

  async saveAudio(): Promise<void> {
    this.session.assertOwner();
    if (this.downloading()) return;
    if (!('caches' in window)) throw new Error('This browser can’t save audio for offline use.');
    this.controller = new AbortController();
    this.downloading.set(true);
    this.task = this.download(this.controller.signal);
    try {
      await this.task;
      this.ui.notify('All sections are saved on this device.');
    } finally {
      this.downloading.set(false);
      this.progress.set('');
      await this.reconcile();
    }
  }

  private async download(signal: AbortSignal): Promise<void> {
    const assets = this.assets();
    if (!assets.length) throw new Error('Wait for the content to finish loading first.');
    const cache = await caches.open(MEDIA_CACHE);
    for (const [index, asset] of assets.entries()) {
      this.progress.set(`Saving section ${index + 1} of ${assets.length}…`);
      await this.reconcile();
      if (this.saved().includes(asset.id)) continue;
      const response = await fetch(asset.url, { signal, cache: 'no-store' });
      if (response.status !== 200) throw new Error('Couldn’t download the full section. Please try again.');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== asset.bytes)
        throw new Error('The download was incomplete. Sections you already saved are safe.');
      const digest = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
        (item) => item.toString(16).padStart(2, '0'),
      ).join('');
      if (digest !== asset.sha256) throw new Error('The downloaded audio didn’t match what was expected, so it wasn’t saved. Please try again.');
      signal.throwIfAborted();
      this.session.assertOwner(true);
      await cache.put(
        asset.url,
        new Response(bytes, {
          headers: {
            'content-type': response.headers.get('content-type') ?? 'audio/mpeg',
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
    for (const asset of this.assets()) await cache.delete(asset.url);
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
        ? 'Storage is protected. Clearing this site’s data in browser settings will still remove it.'
        : 'Your browser may clear saved data when space runs low. Keep a backup.',
    );
  }
}
