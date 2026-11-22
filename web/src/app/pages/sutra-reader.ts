import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationService } from '../core/application.service';
import { ContentService } from '../core/content.service';
import { StudyService } from '../core/study.service';
import { SessionService } from '../core/session.service';
import { UiService } from '../core/ui.service';
import { FIRST_SUTRA_ID, Sutra } from '../core/study-catalog';
import { StudyNavigationService } from '../core/study-navigation.service';
import { StudyContext } from '../shared/study-context';
import { Icon } from '../shared/icon';
import { Preferences } from '../shared/preferences';

@Component({
  imports: [RouterLink, StudyContext, Icon, Preferences],
  template: `
    <app-study-context [sutra]="sutra()" />
    @if (sutra(); as current) {
      <div class="study-toolbar reader-context-bar">
        <a class="text-button" routerLink="/study">Contents</a>
        <strong>Sutra {{ current.reference }}</strong>
        <div class="reader-tools">
          <button
            class="icon-button"
            aria-label="Reading preferences"
            (click)="preferences.showModal()"
          >
            Aa
          </button>
          <button
            class="icon-button"
            [class.is-saved]="bookmarked()"
            [attr.aria-pressed]="bookmarked()"
            [attr.aria-label]="bookmarked() ? 'Remove bookmark' : 'Bookmark this sutra'"
            (click)="bookmark()"
          >
            <app-icon name="bookmark" />
          </button>
        </div>
      </div>
      <article class="sutra-paper" [style.--reading-size]="study.state().preferences.size + 'px'">
        <div class="eyebrow">Hindi meaning</div>
        <h1>Sutra {{ current.reference }}</h1>
        @if (current.meaning) {
          @if (study.state().preferences.meaning) {
            <section class="sutra-meaning" data-block="meaning">
              <h2 class="sr-only">Hindi meaning</h2>
              <p lang="hi">{{ current.meaning }}</p>
            </section>
          } @else {
            <p>Hindi meaning is hidden in your reading preferences.</p>
            <button class="button secondary" (click)="showMeaning()">Show Hindi meaning</button>
          }
        }
        @if (current.prakrit) {
          <section class="sutra-prakrit" data-block="prakrit">
            <h2>Original text · Prakrit</h2>
            <p lang="hi">{{ current.prakrit }}</p>
          </section>
        }
        <details class="source-disclosure" data-block="source">
          <summary>Source</summary>
          <p>{{ content.catalog()?.document?.source?.note }}</p>
          <a [href]="content.catalog()?.document?.source?.url">{{
            content.catalog()?.document?.source?.label
          }}</a>
        </details>
      </article>
      <nav class="sutra-navigation swipe-hint" aria-label="Sutra navigation">
        @if (next()) {
          <p class="small-note" role="status">
            {{ navigating() ? 'Loading…' : 'Swipe up for the next sutra' }}
          </p>
        } @else {
          <p class="boundary-note" role="status">End of the first book.</p>
        }
        <a class="text-button" routerLink="/study">Contents</a>
      </nav>
    } @else {
      <section class="empty">
        <h1>This saved reference is unavailable</h1>
        <p>Your saved place is unchanged. You can open the study contents to choose a reference.</p>
        @if (selectedId().startsWith('fixture:')) {
          <a class="button secondary" [routerLink]="['/preview/read', selectedId()]"
            >Open saved reading preview</a
          >
        }
        <a class="button" routerLink="/study">Study contents</a>
      </section>
    }
    <dialog #preferences aria-labelledby="preferences-title">
      <div class="dialog-heading">
        <h2 id="preferences-title">Reading settings</h2>
        <button class="icon-button" aria-label="Close" (click)="preferences.close()">
          <app-icon name="close" />
        </button>
      </div>
      <app-preferences />
    </dialog>
  `,
})
export class SutraReader implements AfterViewInit, OnDestroy {
  readonly content = inject(ContentService);
  readonly study = inject(StudyService);
  private readonly session = inject(SessionService);
  private readonly application = inject(ApplicationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly navigation = inject(StudyNavigationService);
  private readonly ui = inject(UiService);
  private readonly preferences = () => this.host.nativeElement.querySelector('dialog') as HTMLDialogElement;
  readonly selectedId = signal(FIRST_SUTRA_ID);
  readonly navigating = signal(false);
  readonly sutra = computed(() => this.content.catalog()?.find(this.selectedId()) ?? null);
  readonly previous = computed(
    () => this.content.catalog()?.adjacent(this.selectedId(), -1) ?? null,
  );
  readonly next = computed(() => this.content.catalog()?.adjacent(this.selectedId(), 1) ?? null);
  readonly bookmarked = computed(() =>
    this.study.state().bookmarks.some((item) => item.sutraId === this.selectedId()),
  );
  private timer?: ReturnType<typeof setTimeout>;
  private restoring = true;
  private restoreGeneration = 0;
  private initialized = false;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.selectedId.set(params.get('id') ?? this.study.state().reading.sutraId);
    });
    this.application.readingFlusher = () => this.capture(true);
    effect(() => {
      const current = this.sutra();
      if (current) this.navigation.remember(current);
      if (this.initialized) void this.restoreAnchor();
    });
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    void this.restoreAnchor();
  }

  private async restoreAnchor(): Promise<void> {
    const generation = ++this.restoreGeneration;
    const id = this.selectedId();
    this.restoring = true;
    await document.fonts.ready;
    requestAnimationFrame(() => {
      if (generation !== this.restoreGeneration) return;
      const saved = this.study.state().reading;
      const block = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>('[data-block]'),
      ).find((element) => element.dataset['block'] === saved.blockId);
      if (
        saved.sutraId === id &&
        saved.revision === this.content.catalog()?.document.revision &&
        block &&
        (saved.offset > 0 || saved.blockId === 'source')
      ) {
        window.scrollTo(
          0,
          Math.max(
            0,
            window.scrollY +
              block.getBoundingClientRect().top +
              Math.min(saved.offset, block.offsetHeight) -
              100,
          ),
        );
      } else {
        window.scrollTo(0, 0);
      }
      requestAnimationFrame(() => {
        if (generation !== this.restoreGeneration) return;
        this.restoring = false;
        void this.capture().catch((error) => this.ui.error(error));
      });
    });
  }

  private touchY = 0;
  private touchAtBottom = false;
  private touchAtTop = false;
  private wheelPull = 0;

  private atBottom(): boolean {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  }

  @HostListener('window:touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchY = event.touches[0].clientY;
    this.touchAtBottom = this.atBottom();
    this.touchAtTop = window.scrollY <= 0;
  }

  @HostListener('window:touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.preferences().open) return;
    const dy = event.changedTouches[0].clientY - this.touchY;
    if (dy < -70 && this.touchAtBottom) void this.go(this.next());
    else if (dy > 90 && this.touchAtTop) void this.go(this.previous());
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (event.deltaY > 0 && this.atBottom()) {
      this.wheelPull += event.deltaY;
      if (this.wheelPull > 250) {
        this.wheelPull = 0;
        void this.go(this.next());
      }
    } else {
      this.wheelPull = 0;
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.restoring || !this.session.owned() || this.session.maintenance()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.capture().catch((error) => this.ui.error(error)), 200);
  }

  async capture(internal = false): Promise<void> {
    clearTimeout(this.timer);
    const current = this.sutra();
    if (!current || !this.session.owned() || this.restoring) return;
    const blocks = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('[data-block]'),
    );
    const block =
      blocks.find((element) => element.getBoundingClientRect().bottom > 100) ?? blocks.at(-1);
    if (!block) return;

    await this.study.saveReading(
      {
        sutraId: current.id,
        blockId: block.dataset['block']!,
        offset: Math.max(0, 100 - block.getBoundingClientRect().top),
        revision: this.content.catalog()!.document.revision,
      },
      internal,
    );
  }

  async go(sutra: Sutra | null): Promise<void> {
    if (!sutra || this.navigating()) return;
    this.navigating.set(true);
    try {
      await this.capture();
      await this.router.navigate(['/read', sutra.id]);
    } catch (error) {
      this.ui.error(error);
    } finally {
      this.navigating.set(false);
    }
  }

  async bookmark(): Promise<void> {
    const current = this.sutra();
    if (!current) return;
    try {
      await this.study.toggleBookmark(
        current.id,
        `Sutra ${current.reference}`,
        this.content.catalog()!.document.revision,
      );
      this.ui.notify(this.bookmarked() ? 'Bookmark saved.' : 'Bookmark removed.');
    } catch (error) {
      this.ui.error(error);
    }
  }

  async showMeaning(): Promise<void> {
    try {
      await this.study.setPreferences({ meaning: true });
    } catch (error) {
      this.ui.error(error);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    ++this.restoreGeneration;
    this.application.readingFlusher = async () => {};
    if (this.session.owned() && !this.session.maintenance()) {
      void this.capture().catch((error) => this.ui.error(error));
    }
  }
}
