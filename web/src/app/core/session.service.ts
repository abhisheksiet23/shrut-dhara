import { Injectable, inject, signal } from '@angular/core';
import { UiService } from './ui.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly owned = signal(false);
  readonly maintenance = signal(false);
  readonly acquiring = signal(false);
  readonly supported = signal('locks' in navigator && 'BroadcastChannel' in window);
  private ui = inject(UiService);
  private channel = this.supported() ? new BroadcastChannel('shrutdhara:session-v1') : null;
  private releaseLock?: () => void;
  private lockFinished?: Promise<void>;
  private prepareRelease: () => Promise<void> = async () => {};
  private pendingRequest?: {
    finish: (success: boolean) => void;
    timer: ReturnType<typeof setTimeout>;
  };

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'handoff' && this.owned() && !this.maintenance()) {
          void this.release().catch((error) => this.ui.error(error));
        }
        if (event.data?.type === 'released' && this.pendingRequest) {
          void this.tryAcquire().then((acquired) => {
            if (acquired) this.finishRequest(true);
          });
        }
      };
    }
  }

  setPrepareRelease(callback: () => Promise<void>): void {
    this.prepareRelease = callback;
  }

  async tryAcquire(): Promise<boolean> {
    if (this.owned()) return true;
    if (!this.supported()) return false;
    return new Promise<boolean>((resolve, reject) => {
      this.lockFinished = navigator.locks
        .request('shrutdhara:study-session', { ifAvailable: true }, async (lock) => {
          if (!lock) {
            resolve(false);
            return;
          }
          this.owned.set(true);
          resolve(true);
          await new Promise<void>((release) => {
            this.releaseLock = release;
          });
          this.releaseLock = undefined;
          this.owned.set(false);
        })
        .catch(reject);
    });
  }

  async requestControl(): Promise<boolean> {
    if (this.acquiring()) return false;
    if (await this.tryAcquire()) return true;
    if (!this.supported())
      throw new Error(
        'This browser can’t keep your progress safe. Please use the latest Firefox or Chrome.',
      );
    this.acquiring.set(true);
    this.channel?.postMessage({ type: 'handoff' });
    return new Promise<boolean>((resolve) => {
      this.pendingRequest = {
        finish: resolve,
        timer: setTimeout(() => {
          this.ui.notify(
            'ShrutDhara is open in another window. Close it and try again. Nothing was changed here.',
          );
          this.finishRequest(false);
        }, 10000),
      };
    });
  }

  cancelRequest(): void {
    this.finishRequest(false);
  }

  private finishRequest(success: boolean): void {
    if (this.pendingRequest) {
      clearTimeout(this.pendingRequest.timer);
      this.pendingRequest.finish(success);
      this.pendingRequest = undefined;
    }
    this.acquiring.set(false);
  }

  assertOwner(internal = false): void {
    if (!this.owned()) throw new Error('Choose “Use this window” first.');
    if (this.maintenance() && !internal)
      throw new Error('A backup or update is in progress. Please wait a moment.');
  }

  async release(): Promise<void> {
    this.assertOwner();
    this.maintenance.set(true);
    try {
      await this.prepareRelease();
      this.owned.set(false);
      this.releaseLock?.();
      await this.lockFinished;
      this.channel?.postMessage({ type: 'released' });
    } finally {
      this.maintenance.set(false);
    }
  }
}
