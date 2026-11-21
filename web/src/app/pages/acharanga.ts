import { Component, ElementRef, OnDestroy, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import chapters from '../core/acharanga-chapters.json';
import { PlaybackService } from '../core/playback.service';
import { SessionService } from '../core/session.service';

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
      <a class="text-button" routerLink="/library">← आगम संग्रह</a>
      <h1>आचारांग सूत्र</h1>
      <p>दो श्रुतस्कन्ध · २४ उपलब्ध अध्ययन</p>
      <p>हर अध्ययन का हिन्दी परिचय, उसकी एआई आवाज़ और प्रकाशित स्रोत का संदर्भ। ये परिचय संक्षिप्त हैं।</p>
    </div>

    @for (book of books; track book.number) {
      <section class="book" [attr.aria-labelledby]="'book-' + book.number">
        <h2 [id]="'book-' + book.number">{{ book.title }}</h2>
        <p class="catalog-sources small-note">
          <a [href]="book.hindiSource">प्राकृत मूल और हिन्दी अर्थ का ऑनलाइन संस्करण</a>
        </p>

        @for (chapter of book.chapters; track chapter.id) {
          @if (book.number === 1 && chapter.study === 8) {
            <p class="small-note">अध्ययन ७ · महापरिज्ञा का पाठ उपलब्ध नहीं है।</p>
          }
          <details #panel class="chapter" (toggle)="onChapterToggle(chapter, panel)">
            <summary>{{ chapter.study }}. {{ chapter.title }}</summary>
            <div class="chapter-content">
              @for (
                paragraph of chapter.text.split(
                  '

'
                );
                track $index
              ) {
                <p>{{ paragraph }}</p>
              }
              <p class="catalog-sources small-note">
                <a [href]="scanUrl(chapter)">जैकोबी का अंग्रेज़ी संस्करण · पृष्ठ {{ chapter.page }}</a>
              </p>
              @if (chapter.id === 'shastraparijna') {
                <a class="button" routerLink="/listen">विस्तृत हिन्दी व्याख्या सुनें</a>
              } @else {
                <button
                  class="button secondary"
                  [attr.aria-expanded]="selected() === chapter.id"
                  (click)="toggleAudio(chapter)"
                >
                  {{ selected() === chapter.id ? 'ऑडियो परिचय बंद करें' : 'ऑडियो परिचय खोलें' }}
                </button>
                @if (selected() === chapter.id) {
                  <audio
                    #player
                    controls
                    preload="none"
                    [src]="audioUrl(chapter)"
                    [attr.aria-label]="chapter.title + ' का हिन्दी ऑडियो परिचय'"
                    (play)="onPlay(player, panel)"
                    (error)="error.set(true)"
                  ></audio>
                  @if (error()) {
                    <p role="alert">ऑडियो नहीं खुला। इंटरनेट जाँचें या MP3 डाउनलोड करें।</p>
                  }
                  @if (!session.owned()) {
                    <p class="small-note">यहाँ चलाने के लिए ऊपर “इस विंडो में अध्ययन करें” चुनें।</p>
                  }
                  <a class="text-button" [href]="audioUrl(chapter)" download>MP3 डाउनलोड करें</a>
                }
              }
            </div>
          </details>
        }
      </section>
    }
    <p class="catalog-sources small-note">
      <a href="/narration/acharanga/credits.txt">स्रोत, आवाज़ और उपयोग की शर्तें</a>
    </p>
  `,
})
export class Acharanga implements OnDestroy {
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
    this.pause();
  }
}
