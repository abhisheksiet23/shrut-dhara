import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { Icon } from '../shared/icon';
import { Art } from '../shared/art';

@Component({
  imports: [FormsModule, RouterLink, Icon, Art],
  template: `
    <header class="page-title">
      <span class="eyebrow">Read and listen</span>
      <h1>Library</h1>
      <p>
        Choose a study, then a sutra. Text, meaning and audio availability are shown separately.
      </p>
    </header>
    <label class="search-box"
      ><app-icon name="search" /><input
        type="search"
        aria-label="Search the library"
        placeholder="Search the library"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
    /></label>
    @if (matches()) {
      <article class="scripture-card">
        <div class="scripture-art">
          <app-art /><span lang="hi">आचारांग<br /><small>सूत्र</small></span>
        </div>
        <div class="scripture-details">
          <span class="pill amber">Draft study material</span>
          <h2 lang="hi">आचारांग सूत्र</h2>
          <p>Ācārāṅga Sūtra</p>
          <p>
            Begin with Shastra-parijnā. The other studies currently have short introductions, not
            full sutra meanings.
          </p>
          <a class="text-button" routerLink="/acharanga"
            >Browse the two books and 24 introductions<app-icon name="arrow"
          /></a>
        </div>
      </article>
      <article class="chapter-row">
        <span class="chapter-index">1</span>
        <div>
          <h2 lang="hi">शस्त्रपरिज्ञा</h2>
          <p>Book 1 · Study 1 · seven uddeshakas</p>
          <p>
            {{ meaningCount() }} Hindi meaning drafts ·
            {{ content.meanings()?.parts?.length ?? 0 }} audio samples · original Prakrit pending
          </p>
        </div>
        <a class="button" routerLink="/study">Choose a sutra<app-icon name="arrow" /></a>
      </article>
      <div class="content-note">
        <app-icon name="info" />
        <p>
          Meanings follow numbered units in Jacobi’s 1884 English translation. Source and editorial
          limits are available inside the study.
        </p>
      </div>
    } @else {
      <section class="empty">
        <h2>Nothing found for “{{ query().trim() }}”</h2>
        <p>Search currently covers the Ācārāṅga and Shastra-parijnā.</p>
        <button class="button secondary" (click)="query.set('')">Clear search</button>
      </section>
    }
  `,
})
export class Library {
  readonly content = inject(ContentService);
  readonly query = signal('');
  readonly meaningCount = computed(
    () => this.content.catalog()?.sutras.filter((sutra) => sutra.meaning).length ?? 0,
  );
  readonly matches = computed(
    () =>
      !this.query().trim() ||
      'आचारांग acharanga ācārāṅga sutra sūtra shastraparijna शस्त्रपरिज्ञा hindi meaning'.includes(
        this.query().trim().toLowerCase(),
      ),
  );
}
