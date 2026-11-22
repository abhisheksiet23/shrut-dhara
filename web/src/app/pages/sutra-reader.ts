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
        <div class="eyebrow">
          Hindi meaning · {{ current.meaning ? 'Draft for review' : 'Not available yet' }}
        </div>
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
        } @else {
          <section class="meaning-unavailable" data-block="meaning">
            <h2>This meaning is still being prepared</h2>
            <p>
              This reference is kept in source order. No summary or different sutra has been
              substituted.
            </p>
          </section>
        }
        <div class="read-listen-bridge">
          @if (hasAudio()) {
            <a class="button" [routerLink]="['/listen', current.id]"
              ><app-icon name="headphones" />Listen to this sutra</a
            >
          } @else {
            <span class="small-note">Audio for this sutra is not available yet.</span>
          }
          <span class="small-note">Reading and listening keep their own places.</span>
        </div>
        <details class="source-disclosure" data-block="source">
          <summary>Source, original text and review</summary>
          <p>{{ content.catalog()?.document?.source?.note }}</p>
          <p>The original Prakrit is not included yet.</p>
          @if (current.reviewNote) {
            <p>{{ current.reviewNote }}</p>
          }
          <a [href]="content.catalog()?.document?.source?.url"
            >Read the historical English source</a
          >
        </details>
      </article>
      <nav class="sutra-navigation" aria-label="Sutra navigation">
        <button
          class="button secondary"
          [disabled]="!previous() || navigating()"
          (click)="go(previous())"
        >
          <app-icon name="back" />Previous sutra
        </button>
        <a class="text-button" routerLink="/study">Contents</a>
        <button class="button" [disabled]="!next() || navigating()" (click)="go(next())">
          Next sutra<app-icon name="arrow" />
        </button>
      </nav>
      @if (!next()) {
        <p class="boundary-note" role="status">
          End of this study. No other chapter opens automatically.
        </p>
      }
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
  readonly selectedId = signal(FIRST_SUTRA_ID);
  readonly navigating = signal(false);
  readonly sutra = computed(() => this.content.catalog()?.find(this.selectedId()) ?? null);
  readonly previous = computed(
    () => this.content.catalog()?.adjacent(this.selectedId(), -1) ?? null,
  );
  readonly next = computed(() => this.content.catalog()?.adjacent(this.selectedId(), 1) ?? null);
  readonly hasAudio = computed(
    () =>
      (this.content.catalog()?.audioIndex(this.content.meanings(), this.selectedId()) ?? -1) >= 0,
  );
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
