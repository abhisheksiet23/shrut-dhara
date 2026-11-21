import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApplicationService } from './core/application.service';
import { StudyService } from './core/study.service';
import { SessionService } from './core/session.service';
import { PlaybackService } from './core/playback.service';
import { UiService } from './core/ui.service';
import { formatTime } from './core/models';
import { Icon } from './shared/icon';

@Component({ selector: 'app-root', imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon], templateUrl: './app.html' })
export class App {
  readonly app = inject(ApplicationService);
  readonly study = inject(StudyService);
  readonly session = inject(SessionService);
  readonly playback = inject(PlaybackService);
  readonly ui = inject(UiService);
  private router = inject(Router);
  readonly url = signal('/');
  readonly isListening = computed(() => this.url().startsWith('/listen'));
  readonly title = computed(() => {
    if (this.url().startsWith('/read')) return 'पठन यात्रा';
    if (this.url().startsWith('/listen')) return 'श्रवण यात्रा';
    return this.links.find(link => link.path === this.url())?.label ?? 'Settings';
  });
  readonly time = formatTime;
  readonly links = [
    { path: '/', label: 'My journey', icon: 'home' }, { path: '/library', label: 'आगम संग्रह', icon: 'book' },
    { path: '/listen', label: 'श्रवण यात्रा', icon: 'headphones' }, { path: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' },
  ];
  readonly mobileLinks = [
    { path: '/', label: 'Home', icon: 'home' }, { path: '/library', label: 'Collection', icon: 'book' },
    { path: '/listen', label: 'Listen', icon: 'headphones' }, { path: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
  @ViewChild('sources') private sources?: ElementRef<HTMLDialogElement>;

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.url.set(event.urlAfterRedirects);
        requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
        if (!event.urlAfterRedirects.startsWith('/read')) window.scrollTo(0, 0);
      }
    });
  }

  skip(event: Event): void { event.preventDefault(); document.getElementById('main')?.focus(); }
  showSources(): void { this.sources?.nativeElement.showModal(); }

  backdrop(event: MouseEvent, dialog: HTMLDialogElement): void {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  }

  async takeControl(): Promise<void> {
    try { if (await this.app.useThisWindow()) this.ui.notify('Study session इस window में तैयार है।'); }
    catch (error) { this.ui.error(error); }
  }

  async retryStorage(): Promise<void> { await this.study.load(); }
  async togglePlayback(): Promise<void> {
    try { await this.playback.toggle(); } catch (error) { this.ui.error(error); }
  }
}
