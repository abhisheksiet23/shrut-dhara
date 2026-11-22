import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { StudyService } from '../core/study.service';
import { StudyNavigationService } from '../core/study-navigation.service';
import { StudyContext } from '../shared/study-context';

@Component({
  imports: [RouterLink, StudyContext],
  template: `
    <app-study-context />
    <header class="study-heading">
      <span class="eyebrow">Book 1 · Study 1</span>
      <h1 lang="hi">शस्त्रपरिज्ञा</h1>
      <p>Hindi meaning, one sutra at a time.</p>
      <p class="small-note">
        References follow Jacobi’s numbered units. Hindi drafts for the first uddeshaka are ready to
        review; the original Prakrit and scholarly review are still pending.
      </p>
    </header>

    @if (content.catalog(); as catalog) {
      <div class="study-readiness">
        <span>{{ readyMeanings() }} of {{ catalog.sutras.length }} Hindi drafts</span>
        <span>{{ content.meanings()?.parts?.length ?? 0 }} audio samples</span>
        <a href="#study-source">Source and review</a>
      </div>
      <div class="study-contents">
        @for (section of catalog.sections; track section.number) {
          <details
            [open]="navigation.contentsSection() === section.number"
            (toggle)="rememberSection(section.number, $event)"
          >
            <summary>
              <span
                >Uddeshaka {{ section.number }} · <span lang="hi">{{ section.title }}</span></span
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
                  <p>
                    {{ sutra.meaning ? 'Hindi meaning · draft' : 'Hindi meaning pending' }}
                    @if (hasAudio(sutra.id)) {
                      <span> · AI audio sample</span>
                    }
                  </p>
                  @if (study.state().reading.sutraId === sutra.id) {
                    <small>Your reading place</small>
                  }
                </div>
                <div class="sutra-actions">
                  <a class="button secondary" [routerLink]="['/read', sutra.id]">{{
                    sutra.meaning ? 'Read' : 'View reference'
                  }}</a>
                  @if (hasAudio(sutra.id)) {
                    <a class="button" [routerLink]="['/listen', sutra.id]">Listen</a>
                  }
                </div>
              </article>
            }
          </details>
        }
      </div>
      <section class="study-source" id="study-source">
        <h2>Source and review</h2>
        <p>{{ catalog.document.source.note }}</p>
        <a [href]="catalog.document.source.url">{{ catalog.document.source.label }}</a>
        <a href="/narration/meaning-v1/credits.txt">Audio credits and noncommercial terms</a>
        <a href="/narration/meaning-v1/transcript.txt">Exact spoken sample transcript</a>
        <p>
          The earlier chapter commentary is separate from these meanings. Its saved position is
          retained.
        </p>
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

  readyMeanings(): number {
    return this.content.catalog()?.sutras.filter((sutra) => sutra.meaning).length ?? 0;
  }

  hasAudio(id: string): boolean {
    return (this.content.catalog()?.audioIndex(this.content.meanings(), id) ?? -1) >= 0;
  }

  rememberSection(section: number, event: Event): void {
    if ((event.target as HTMLDetailsElement).open) this.navigation.contentsSection.set(section);
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
