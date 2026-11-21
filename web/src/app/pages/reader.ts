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
        <a routerLink="/library" class="text-button"><app-icon name="back" />संग्रह</a>
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
            [attr.aria-label]="bookmarked() ? 'बुकमार्क हटाएँ' : 'बुकमार्क जोड़ें'"
            [attr.aria-pressed]="bookmarked()"
            (click)="bookmark()"
          >
            <app-icon name="bookmark" />
          </button>
        </div>
      </div>
      <div class="reader-heading">
        <span class="eyebrow">नमूना लेखन · शास्त्रीय अध्याय नहीं</span>
        <h1>पठन यात्रा</h1>
        <p>अंश {{ index() + 1 }} / {{ passages().length }} · {{ current.reference }}</p>
      </div>
      <div class="reading-layout">
        <aside class="reading-outline">
          <span class="eyebrow">इस नमूने में</span>
          @for (item of passages(); track item.id; let i = $index) {
            <button (click)="go(i)" [class.current]="i === index()">
              <span>0{{ i + 1 }}</span
              >{{ item.title }}
            </button>
          }
          <div class="outline-note">मूल सूत्र और प्रामाणिक क्रम अभी शामिल नहीं हैं।</div>
        </aside>
        <article
          class="reading-paper"
          [style.--reading-size]="study.state().preferences.size + 'px'"
        >
          <div class="sample-banner">इंटरफ़ेस नमूना · यह मूल सूत्र या उसका अनुवाद नहीं है</div>
          <span class="passage-number">0{{ index() + 1 }}</span>
          <h2>{{ current.title }}</h2>
          <section class="original-placeholder" data-block="original">
            <span class="eyebrow">मूल पाठ</span>
            <p>सत्यापित मूल सूत्र यहाँ प्रस्तुत होगा।</p>
            <p class="small-note">स्रोत चयन और समीक्षा शेष है।</p>
          </section>
          @if (study.state().preferences.meaning) {
            <section class="passage-section" data-block="meaning">
              <h3>अर्थ का स्थान <small>नमूना लेखन</small></h3>
              <p>{{ current.meaning }}</p>
            </section>
          }
          @if (study.state().preferences.explanation) {
            <section class="passage-section explanation" data-block="explanation">
              <h3><app-icon name="leaf" /> सरल व्याख्या का स्थान</h3>
              @for (paragraph of current.paragraphs; track $index) {
                <p>{{ paragraph }}</p>
              }
            </section>
          }
          @if (!study.state().preferences.meaning && !study.state().preferences.explanation) {
            <p class="muted">अर्थ और व्याख्या छिपे हैं। Aa विकल्प से फिर दिखाएँ।</p>
          }
          <div class="reading-end">
            <span>एक पल ठहरें। फिर अपनी गति से आगे बढ़ें।</span><app-icon name="leaf" />
          </div>
          <div class="passage-navigation">
            <button class="button secondary" (click)="go(index() - 1)" [disabled]="index() === 0">
              <app-icon name="back" />पिछला अंश</button
            ><button class="button" (click)="next()">
              {{ index() + 1 === passages().length ? 'आगे की उपलब्धता' : 'अगला अंश'
              }}<app-icon name="arrow" />
            </button>
          </div>
        </article>
      </div>
    } @else {
      <div class="empty">
        <app-icon name="book" />
        <h1>यह saved reference उपलब्ध नहीं है</h1>
        <p>आपकी मूल reference सुरक्षित है। कोई दूसरा अंश अपने आप नहीं खोला गया।</p>
        <a class="button secondary" routerLink="/library">संग्रह में जाएँ</a>
      </div>
    }
    <dialog #preferences aria-labelledby="preferences-title">
      <div class="dialog-heading">
        <h2 id="preferences-title" lang="en">Reading preferences</h2>
        <button class="icon-button" aria-label="Close preferences" (click)="preferences.close()">
          <app-icon name="close" />
        </button>
      </div>
      <app-preferences />
    </dialog>
    <dialog #boundary aria-labelledby="boundary-title">
      <div class="dialog-heading">
        <h2 id="boundary-title">नमूने का अंत</h2>
        <button class="icon-button" aria-label="Close" (click)="boundary.close()">
          <app-icon name="close" />
        </button>
      </div>
      <p>आगे की सत्यापित सामग्री उपलब्ध नहीं है। यह वास्तविक अध्याय की पूर्णता का संकेत नहीं है।</p>
      <p>एक पल ठहरें। कौन-सा विचार आपके साथ रहा?</p>
      <button class="button" (click)="boundary.close()">पठन में लौटें</button>
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
      this.ui.notify(this.bookmarked() ? 'बुकमार्क सहेजा गया।' : 'बुकमार्क हटाया गया।');
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
