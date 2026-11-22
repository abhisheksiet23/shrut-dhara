import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import chapters from '../core/acharanga-chapters.json';
import { PlaybackService } from '../core/playback.service';
import { SessionService } from '../core/session.service';
import { StudyNavigationService } from '../core/study-navigation.service';

type Study = (typeof chapters)[number];

@Component({
  imports: [RouterLink],
  styles: `
    .book {
      margin: 2rem 0;
    }
    .chapter {
      border: 1px solid var(--line);
      border-radius: 6px;
      margin: 0.6rem 0;
      background: var(--surface);
    }
    summary {
      cursor: pointer;
      padding: 0.9rem 1rem;
      font-weight: 600;
    }
    .chapter-content {
      padding: 0 1rem 1rem;
    }
    .chapter-content p {
      margin-block: 0.65rem;
    }
    .chapter-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .chapter audio {
      width: 100%;
      margin-top: 0.7rem;
    }
    .catalog-sources a {
      text-decoration: underline;
    }
  `,
  template: `
    <div class="page-title">
      <a class="text-button" routerLink="/library">← Library</a>
      <h1><span lang="hi">आचारांग सूत्र</span></h1>
      <p class="gloss">Ācārāṅga Sūtra · two books · 24 studies</p>
      <p>
        Each study has a short Hindi introduction, an AI-voiced recording and a link to a published
        source.
      </p>
    </div>

    @for (book of books; track book.number) {
      <section class="book" [attr.aria-labelledby]="'book-' + book.number">
        <h2 [id]="'book-' + book.number">
          <span lang="hi">{{ book.title }}</span> <small>Book {{ book.number }}</small>
        </h2>
        <p class="catalog-sources small-note">
          <a [href]="book.hindiSource">Prakrit original with Hindi meaning (external site)</a>
        </p>

        @for (chapter of book.chapters; track chapter.id) {
          @if (book.number === 1 && chapter.study === 8) {
            <p class="small-note">Study 7, Mahāparijñā, has no surviving text, so it is skipped.</p>
          }
          <details
            #panel
            class="chapter"
            [open]="navigation.catalogueOpen.has(chapter.id)"
            (toggle)="rememberChapter(chapter.id, panel); onChapterToggle(chapter, panel)"
          >
            <summary>
              {{ chapter.study }}. <span lang="hi">{{ chapter.title }}</span>
            </summary>
            <div class="chapter-content">
              @for (
                paragraph of chapter.text.split(
                  '

'
                );
                track $index
              ) {
                <p lang="hi">{{ paragraph }}</p>
              }
              <p class="catalog-sources small-note">
                <a [href]="scanUrl(chapter)"
                  >Jacobi’s English translation, page {{ chapter.page }}</a
                >
              </p>
              @if (chapter.id === 'shastraparijna') {
                <a class="button" routerLink="/study">Open sutra meanings</a>
              } @else {
                <button
                  class="button secondary"
                  [attr.aria-expanded]="selected() === chapter.id"
                  (click)="toggleAudio(chapter)"
                >
                  {{
                    selected() === chapter.id
                      ? 'Hide audio introduction'
                      : 'Play audio introduction'
                  }}
                </button>
                @if (selected() === chapter.id) {
                  <audio
                    #player
                    controls
                    preload="none"
                    [src]="audioUrl(chapter)"
                    [attr.aria-label]="'Hindi audio introduction: ' + chapter.title"
                    (play)="onPlay(player, panel)"
                    (error)="error.set(true)"
                  ></audio>
                  @if (error()) {
                    <p role="alert">
                      Couldn’t play this audio. Check your connection, or download the MP3.
                    </p>
                  }
                  @if (!session.owned()) {
                    <p class="small-note">To play here, choose “Use this window” at the top.</p>
                  }
                  <a class="text-button" [href]="audioUrl(chapter)" download>Download MP3</a>
                }
              }
            </div>
          </details>
        }
      </section>
    }
    <p class="catalog-sources small-note">
      <a href="/narration/acharanga/credits.txt">Sources, voice and terms of use</a>
    </p>
  `,
})
export class Acharanga implements OnDestroy, AfterViewInit {
  readonly navigation = inject(StudyNavigationService);

  rememberChapter(id: string, panel: HTMLDetailsElement): void {
    if (panel.open) this.navigation.catalogueOpen.add(id);
    else this.navigation.catalogueOpen.delete(id);
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo(0, this.navigation.catalogueScroll())),
    );
  }
  readonly books = [
    {
      number: 1,
      title: 'प्रथम श्रुतस्कन्ध',
      hindiSource: 'https://jainqq.org/booktext/Agam_01_Ang_01_Acharanga_Sutra_Stahanakvasi/003469',
      chapters: chapters.filter((item) => item.book === 1),
    },
    {
      number: 2,
      title: 'द्वितीय श्रुतस्कन्ध',
      hindiSource:
        'https://jainqq.org/booktext/Agam_01_Ang_01_Acharanga_Sutra_Part_02_Stahanakvasi/003437',
      chapters: chapters.filter((item) => item.book === 2),
    },
  ];
  readonly selected = signal<string | null>(null);
  readonly error = signal(false);
  readonly session = inject(SessionService);
  private readonly playback = inject(PlaybackService);
  private readonly player = viewChild<ElementRef<HTMLAudioElement>>('player');

  constructor() {
    effect(() => {
      if (!this.session.owned() || this.session.maintenance()) this.pause();
    });
  }

  scanUrl(chapter: Study): string {
    return `https://archive.org/details/gainastras01aco/page/${chapter.page}/mode/2up`;
  }

  audioUrl(chapter: Study): string {
    return `/narration/acharanga/${chapter.id}-v1.mp3`;
  }

  toggleAudio(chapter: Study): void {
    this.pause();
    this.error.set(false);
    this.selected.set(this.selected() === chapter.id ? null : chapter.id);
  }

  onChapterToggle(chapter: Study, panel: HTMLDetailsElement): void {
    if (!panel.open && this.selected() === chapter.id) this.pause();
  }

  onPlay(player: HTMLAudioElement, panel: HTMLDetailsElement): void {
    if (!panel.open) {
      player.pause();
      return;
    }
    this.playback.playChapter(player);
  }

  private pause(): void {
    this.playback.pauseChapter(this.player()?.nativeElement);
  }

  ngOnDestroy(): void {
    this.navigation.catalogueScroll.set(window.scrollY);
    this.pause();
  }
}
