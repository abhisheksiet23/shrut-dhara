import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly message = signal('');
  readonly sourcesOpen = signal(false);
  private timeout?: ReturnType<typeof setTimeout>;

  notify(message: string): void {
    this.message.set(message);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.message.set(''), 6500);
  }

  error(error: unknown): void {
    this.notify(error instanceof Error ? error.message : 'यह काम पूरा नहीं हुआ। फिर प्रयास करें।');
  }
}
