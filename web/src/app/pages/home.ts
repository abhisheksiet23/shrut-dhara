import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyService } from '../core/study.service';
import { ContentService } from '../core/content.service';
import { NARRATION_ID, formatTime, recordingProgress } from '../core/models';
import { Icon } from '../shared/icon';

@Component({
  imports: [RouterLink, Icon],
  template: ` <section class="welcome">
      <div>
        <div class="eyebrow">{{ listeningStarted() ? 'Welcome back' : 'Welcome' }}</div>
        <h1>{{ listeningStarted() ? 'Pick up where you left off.' : 'A quiet place to listen and read.' }}</h1>
        <p>Jain Āgamas in Hindi. Go at your own pace.</p>
      </div>
    </section>
    <section class="journey-grid home-first">
      <article class="journey listening-card featured">
        <div class="card-top">
          <span class="square-icon"><app-icon name="headphones" /></span
          ><span class="pill">Listen</span>
        </div>
        <h3 lang="hi">शस्त्रपरिज्ञा</h3>
        <p class="gloss">Ācārāṅga Sūtra · Study 1 · seven sections, about ten minutes in all</p>
        <div class="journey-position">
          <span>{{ listeningStarted() ? 'Up next' : 'Not started' }}</span
          ><b lang="hi">{{ listeningLabel() }}</b>
        </div>
        <div class="progress-track"><i [style.width.%]="listeningPercent()"></i></div>
        <a class="button" routerLink="/listen"
          ><app-icon name="play" />{{ listeningStarted() ? 'Resume listening' : 'Start listening' }}</a
        >
        <p class="small-note">AI voice, not yet reviewed by a scholar.</p>
      </article>
      <article class="journey reading-card">
        <div class="card-top">
          <span class="square-icon"><app-icon name="book" /></span
          ><span class="pill">Read</span>
        </div>
        <h3>Reading preview</h3>
        <p>Original text, meaning and a simple explanation, one passage at a time. Placeholder text for now.</p>
        <div class="journey-position">
          <span>Passage</span><b>{{ passageLabel() }}</b>
        </div>
        <div class="progress-track"><i [style.width.%]="readingPercent()"></i></div>
        <a class="text-button" routerLink="/read"
          >Continue reading <app-icon name="arrow"
        /></a>
      </article>
    </section>
    <section class="collection-preview">
      <div>
        <div class="eyebrow">Your library</div>
        <h2>One chapter to begin with.</h2>
        <p>
          We’re starting with the Ācārāṅga Sūtra. More Āgamas will be added once their sources are chosen and
          reviewed.
        </p>
        <a class="text-button" routerLink="/library"
          >Browse the library <app-icon name="arrow"
        /></a>
      </div>
      <div class="book-spine">
        <span lang="hi">आचारांग सूत्र</span><small>Ācārāṅga Sūtra</small><app-icon name="leaf" />
      </div>
    </section>
    <div class="content-note">
      <app-icon name="info" />
      <p>
        Your place in Read and Listen is saved separately, in this browser only. The reading text is a placeholder,
        and the narration is an AI voice awaiting review.
      </p>
    </div>`,
})
export class Home {
  readonly study = inject(StudyService);
  private content = inject(ContentService);
  readonly time = formatTime;
  readonly readingIndex = computed(
    () =>
      this.content
        .chapter()
        ?.passages.findIndex((item) => item.id === this.study.state().reading.sutraId) ?? -1,
  );
  readonly passageLabel = computed(() =>
    this.readingIndex() >= 0 ? `${this.readingIndex() + 1} of 3` : 'Saved place unavailable',
  );
  readonly narration = computed(() => this.content.narration());
  readonly listeningStarted = computed(() => {
    const saved = this.study.state().listening;
    return saved.recordingId === NARRATION_ID && (saved.part > 0 || saved.seconds > 0);
  });
  readonly listeningLabel = computed(() => {
    const saved = this.study.state().listening;
    const part = this.narration()?.parts[saved.part];
    if (!this.listeningStarted() || !part) return 'Section 1 of 7';
    return `${part.title} · ${formatTime(saved.seconds)}`;
  });
  readonly listeningPercent = computed(() => {
    const rec = this.narration();
    const saved = this.study.state().listening;
    return rec && this.listeningStarted()
      ? recordingProgress(rec, saved.part, saved.seconds) * 100
      : 0;
  });
  readonly readingPercent = computed(() =>
    this.readingIndex() >= 0 ? ((this.readingIndex() + 1) / 3) * 100 : 0,
  );
}
