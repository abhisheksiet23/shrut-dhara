import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { StudyService } from '../core/study.service';
import { StudyNavigationService } from '../core/study-navigation.service';
import { Sutra } from '../core/study-catalog';
import { StudyContext } from '../shared/study-context';

@Component({
  imports: [RouterLink, StudyContext],
  template: `
    <app-study-context />
    <header class="study-heading">
      <span class="eyebrow">Book 1</span>
      <h1 lang="hi">आचारांग सूत्र</h1>
      <p>First book, in Hindi, one sutra at a time.</p>
      <p class="small-note">
        Each sutra has its Hindi meaning and, where available, the original Prakrit. References
        follow Jacobi’s numbered units.
      </p>
    </header>

    @if (content.catalog(); as catalog) {
      <div class="study-readiness">
        <span>{{ chapterCount() }} chapters</span>
        <span>{{ catalog.sutras.length }} sutras</span>
        <a href="#study-source">Source</a>
      </div>
      <div class="study-contents">
        @for (chapter of catalog.chapters; track chapter.number) {
          <details
            class="chapter-group"
            [open]="navigation.contentsChapter() === chapter.number"
            (toggle)="rememberChapter(chapter.number, $event)"
          >
            <summary>
              <span
                >Chapter {{ chapter.number }} · <span lang="hi">{{ chapter.title }}</span></span
              >
              <small>{{
                chapter.sections.length ? chapter.sections.length + ' uddeshakas' : 'Lost'
              }}</small>
            </summary>
            @if (chapter.note) {
              <p class="small-note">{{ chapter.note }}</p>
            }
            @for (section of chapter.sections; track section.number) {
              <details
                [open]="
                  navigation.contentsChapter() === chapter.number &&
                  navigation.contentsSection() === section.number
                "
                (toggle)="rememberSection(chapter.number, section.number, $event)"
              >
                <summary>
                  <span
                    >Uddeshaka {{ section.number }} ·
                    <span lang="hi">{{ section.title }}</span></span
                  >
                  <small>{{ section.sutras.length }} sutras</small>
                </summary>
                @for (sutra of section.sutras; track sutra.id) {
                  <article
                    class="sutra-row"
                    [class.saved-place]="study.state().reading.sutraId === sutra.id"
                  >
                    <div>
                      <strong>Sutra {{ sutra.reference }}</strong>
                      <p lang="hi">{{ excerpt(sutra) }}</p>
                      @if (study.state().reading.sutraId === sutra.id) {
                        <small>Your reading place</small>
                      }
                    </div>
                    <div class="sutra-actions">
                      <a class="button secondary" [routerLink]="['/read', sutra.id]">Read</a>
                      @if (hasAudio(sutra.id)) {
                        <a class="button" [routerLink]="['/listen', sutra.id]">Listen</a>
                      }
                    </div>
                  </article>
                }
              </details>
            }
          </details>
        }
      </div>
      <section class="study-source" id="study-source">
        <h2>Source</h2>
        <p>{{ catalog.document.source.note }}</p>
        <a [href]="catalog.document.source.url">{{ catalog.document.source.label }}</a>
        <a class="text-button" routerLink="/listen/commentary">Open earlier commentary</a>
      </section>
    } @else {
      <section class="empty">
        <h2>Study contents unavailable</h2>
        <p role="alert">{{ content.catalogError() }}</p>
        <button class="button" (click)="content.loadStudy()">Try again</button>
      </section>
    }
  `,
})
export class Study implements AfterViewInit, OnDestroy {
  readonly content = inject(ContentService);
  readonly study = inject(StudyService);
  readonly navigation = inject(StudyNavigationService);

  chapterCount(): number {
    return this.content.catalog()?.chapters.filter((chapter) => chapter.sections.length).length ?? 0;
  }

  excerpt(sutra: Sutra): string {
    const text = sutra.meaning ?? '';
    return text.length > 90 ? text.slice(0, 90).trimEnd() + '…' : text;
  }

  hasAudio(id: string): boolean {
    return (this.content.catalog()?.audioIndex(this.content.meanings(), id) ?? -1) >= 0;
  }

  rememberChapter(chapter: number, event: Event): void {
    if ((event.target as HTMLDetailsElement).open) this.navigation.contentsChapter.set(chapter);
  }

  rememberSection(chapter: number, section: number, event: Event): void {
    if (!(event.target as HTMLDetailsElement).open) return;
    this.navigation.contentsChapter.set(chapter);
    this.navigation.contentsSection.set(section);
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo(0, this.navigation.contentsScroll())),
    );
  }

  ngOnDestroy(): void {
    this.navigation.contentsScroll.set(window.scrollY);
  }
}
