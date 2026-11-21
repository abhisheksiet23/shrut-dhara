import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
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
import { Icon } from '../shared/icon';
import { Preferences } from '../shared/preferences';

@Component({
  imports: [RouterLink, Icon, Preferences],
  template: ` @if (passage(); as current) {
      <div class="reader-top">
        <a routerLink="/library" class="text-button"><app-icon name="back" />Library</a>
        <div class="reader-tools">
          <button
            class="icon-button"
            aria-label="Reading preferences"
            (click)="preferences.showModal()"
          >
            Aa</button
          ><button
            class="icon-button"
            [class.is-saved]="bookmarked()"
            [attr.aria-label]="bookmarked() ? 'Remove bookmark' : 'Bookmark this passage'"
            [attr.aria-pressed]="bookmarked()"
            (click)="bookmark()"
          >
            <app-icon name="bookmark" />
          </button>
        </div>
      </div>
      <div class="reader-heading">
        <span class="eyebrow">Placeholder text · not scripture</span>
        <h1>Reading preview</h1>
        <p>Passage {{ index() + 1 }} of {{ passages().length }} · {{ current.reference }}</p>
      </div>
      <div class="reading-layout">
        <aside class="reading-outline">
          <span class="eyebrow">In this preview</span>
          @for (item of passages(); track item.id; let i = $index) {
            <button (click)="go(i)" [class.current]="i === index()">
              <span>0{{ i + 1 }}</span
              ><span lang="hi">{{ item.title }}</span>
            </button>
          }
          <div class="outline-note">The original sūtras and their proper order aren’t included yet.</div>
        </aside>
        <article
          class="reading-paper"
          [style.--reading-size]="study.state().preferences.size + 'px'"
        >
          <div class="sample-banner">Layout preview · this is not the original sūtra or a translation</div>
          <span class="passage-number">0{{ index() + 1 }}</span>
          <h2 lang="hi">{{ current.title }}</h2>
          <section class="original-placeholder" data-block="original">
            <span class="eyebrow">Original text</span>
            <p>The verified original will appear here.</p>
            <p class="small-note">We still need to choose a source and have it reviewed.</p>
          </section>
          @if (study.state().preferences.meaning) {
            <section class="passage-section" data-block="meaning">
              <h3>Meaning <small>placeholder</small></h3>
              <p lang="hi">{{ current.meaning }}</p>
            </section>
          }
          @if (study.state().preferences.explanation) {
            <section class="passage-section explanation" data-block="explanation">
              <h3><app-icon name="leaf" /> Simple explanation <small>placeholder</small></h3>
              @for (paragraph of current.paragraphs; track $index) {
                <p lang="hi">{{ paragraph }}</p>
              }
            </section>
          }
          @if (!study.state().preferences.meaning && !study.state().preferences.explanation) {
            <p class="muted">Meaning and explanation are hidden. Turn them back on with the Aa button.</p>
          }
          <div class="reading-end">
            <span>Pause for a moment, then carry on.</span><app-icon name="leaf" />
          </div>
          <div class="passage-navigation">
            <button class="button secondary" (click)="go(index() - 1)" [disabled]="index() === 0">
              <app-icon name="back" />Previous</button
            ><button class="button" (click)="next()">
              {{ index() + 1 === passages().length ? 'What’s next' : 'Next'
              }}<app-icon name="arrow" />
            </button>
          </div>
        </article>
      </div>
    } @else {
      <div class="empty">
        <app-icon name="book" />
        <h1>We couldn’t find your saved place</h1>
        <p>Your saved place hasn’t been changed, and we haven’t opened a different passage for you.</p>
        <a class="button secondary" routerLink="/library">Go to the library</a>
      </div>
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
    <dialog #boundary aria-labelledby="boundary-title">
      <div class="dialog-heading">
        <h2 id="boundary-title">That’s the end of the preview</h2>
        <button class="icon-button" aria-label="Close" (click)="boundary.close()">
          <app-icon name="close" />
        </button>
      </div>
      <p>There’s no verified content after this yet. This isn’t the end of a real chapter.</p>
      <p>Take a moment. Which thought is staying with you?</p>
      <button class="button" (click)="boundary.close()">Back to reading</button>
    </dialog>`,
})
export class Reader implements AfterViewInit, OnDestroy {
  readonly content = inject(ContentService);
  readonly study = inject(StudyService);
  private session = inject(SessionService);
  private ui = inject(UiService);
  private application = inject(ApplicationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly selectedId = signal(this.study.state().reading.sutraId);
  readonly passages = computed(() => this.content.chapter()?.passages ?? []);
  readonly index = computed(() =>
    this.passages().findIndex((item) => item.id === this.selectedId()),
  );
  readonly passage = computed(() => this.passages()[this.index()]);
  readonly bookmarked = computed(() =>
    this.study.state().bookmarks.some((item) => item.sutraId === this.selectedId()),
  );
  @ViewChild('boundary') private boundary?: ElementRef<HTMLDialogElement>;
  private timer?: ReturnType<typeof setTimeout>;
  private restoring = true;
  private restoreRevision = 0;
  private initialized = false;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) =>
        this.selectedId.set(params.get('id') ?? this.study.state().reading.sutraId),
      );
    this.application.readingFlusher = () => this.capture(true);
    effect(() => {
      this.selectedId();
      if (this.initialized) void this.restoreAnchor();
    });
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    void this.restoreAnchor();
  }

  private async restoreAnchor(): Promise<void> {
    const revision = ++this.restoreRevision;
    this.restoring = true;
    await document.fonts.ready;
    requestAnimationFrame(() => {
      if (revision !== this.restoreRevision) return;
      const saved = this.study.state().reading;
      const block = saved.sutraId === this.selectedId() ? saved.blockId : 'original';
      const element = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>('[data-block]'),
      ).find((item) => item.dataset['block'] === block);
      if (element && saved.sutraId === this.selectedId()) {
        window.scrollTo({
          top: Math.max(
            0,
            window.scrollY +
              element.getBoundingClientRect().top +
              Math.min(saved.offset, element.offsetHeight) -
              100,
          ),
          behavior: 'instant',
        });
      } else window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        if (revision === this.restoreRevision) this.restoring = false;
      });
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.restoring || !this.session.owned() || this.session.maintenance()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.capture().catch((error) => this.ui.error(error));
    }, 200);
  }

  async capture(internal = false): Promise<void> {
    clearTimeout(this.timer);
    if (!this.passage() || !this.session.owned()) return;
    const blocks = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('[data-block]'),
    );
    const block = blocks.find((item) => item.getBoundingClientRect().bottom > 100) ?? blocks.at(-1);
    if (!block) return;
    await this.study.saveReading(
      {
        sutraId: this.selectedId(),
        blockId: block.dataset['block']!,
        offset: Math.max(0, 100 - block.getBoundingClientRect().top),
        revision: 'fixture-v1',
      },
      internal,
    );
  }

  async go(index: number): Promise<void> {
    const next = this.passages()[index];
    if (!next) return;
    try {
      await this.capture();
      await this.study.saveReading({
        sutraId: next.id,
        blockId: 'original',
        offset: 0,
        revision: 'fixture-v1',
      });
      await this.router.navigate(['/read', next.id]);
    } catch (error) {
      this.ui.error(error);
    }
  }

  next(): void {
    if (this.index() + 1 === this.passages().length) this.boundary?.nativeElement.showModal();
    else void this.go(this.index() + 1);
  }

  async bookmark(): Promise<void> {
    const current = this.passage();
    if (!current) return;
    try {
      await this.study.toggleBookmark(current.id, current.title, 'fixture-v1');
      this.ui.notify(this.bookmarked() ? 'Bookmark saved.' : 'Bookmark removed.');
    } catch (error) {
      this.ui.error(error);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    ++this.restoreRevision;
    this.application.readingFlusher = async () => {};
    if (this.session.owned() && !this.session.maintenance())
      void this.capture().catch((error) => this.ui.error(error));
  }
}
