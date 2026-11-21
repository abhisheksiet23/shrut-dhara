import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { OfflineService } from '../core/offline.service';
import { Icon } from '../shared/icon';
import { Art } from '../shared/art';

@Component({
  imports: [FormsModule, RouterLink, Icon, Art],
  template: ` <div class="page-title">
      <div class="eyebrow">Read and listen</div>
      <h1>Library</h1>
      <p>Here’s what’s available today. More will arrive as sources are reviewed.</p>
      <a class="button" routerLink="/acharanga">See all 24 studies of the Ācārāṅga</a>
    </div>
    <label class="search-box"
      ><app-icon name="search" /><input
        type="search"
        aria-label="Search the library"
        placeholder="Search the library"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
    /></label>
    <div class="library-tabs">
      <span class="selected">Starting with the Ācārāṅga</span><span>Goal: all 32 Āgamas</span>
    </div>
    @if (content.error()) {
      <div class="empty">
        <h2>Couldn’t load the library</h2>
        <p>{{ content.error() }}</p>
        <button class="button secondary" (click)="content.load()">Try again</button>
      </div>
    } @else if (!matches()) {
      <div class="empty">
        <app-icon name="search" />
        <h2>Nothing found for “{{ query().trim() }}”</h2>
        <p>For now the library holds only the Ācārāṅga Sūtra and a reading preview.</p>
        <button class="button secondary" (click)="query.set('')">Clear search</button>
      </div>
    } @else {
      <article class="scripture-card">
        <div class="scripture-art">
          <app-art /><span lang="hi">आचारांग<br /><small>सूत्र</small></span>
        </div>
        <div class="scripture-details">
          <span class="pill amber">Awaiting source and review</span>
          <h2><span lang="hi">आचारांग सूत्र</span></h2>
          <p class="gloss">Ācārāṅga Sūtra · the proposed first Āgama</p>
          <p>The original text and a reviewed translation aren’t published here yet.</p>
          <div class="availability">
            <span><app-icon name="book" />3 reading passages</span
            ><span><app-icon name="headphones" />Study 1 narration</span>
          </div>
        </div>
      </article>
      <div class="section-heading">
        <h2>What you can try</h2>
      </div>
      <article class="chapter-row">
        <span class="chapter-index">1</span>
        <div>
          <h3><span lang="hi">शस्त्रपरिज्ञा</span> · Listen</h3>
          <p>Seven sections of Hindi explanation in an AI voice.</p>
          <div class="availability">
            <span>{{
              offline.assets().length && offline.saved().length === offline.assets().length
                ? 'Saved for offline'
                : 'Not saved for offline yet'
            }}</span>
          </div>
        </div>
        <div class="chapter-actions">
          <a class="button" routerLink="/listen"><app-icon name="headphones" />Listen</a>
        </div>
      </article>
      <article class="chapter-row">
        <span class="chapter-index">2</span>
        <div>
          <h3>Reading preview</h3>
          <p>Placeholder text for testing the reading layout. Not scripture.</p>
        </div>
        <div class="chapter-actions">
          <a class="button secondary" routerLink="/read"><app-icon name="book" />Read</a>
        </div>
      </article>
      <article class="chapter-row unavailable">
        <span class="chapter-index">—</span>
        <div>
          <h3>Verified chapters</h3>
          <p>Coming once the source, redistribution rights and a qualified review are in place.</p>
        </div>
        <span class="pill amber">Not available yet</span>
      </article>
    }
    <div class="content-note">
      <app-icon name="info" />
      <p>We haven’t yet verified the source edition or chapter order. Nothing is skipped silently.</p>
    </div>`,
})
export class Library {
  readonly content = inject(ContentService);
  readonly offline = inject(OfflineService);
  readonly query = signal('');
  readonly matches = computed(
    () =>
      !this.query().trim() ||
      'आचारांग acharanga ācārāṅga sutra sūtra shastraparijna शस्त्रपरिज्ञा reading preview listen read library'.includes(
        this.query().trim().toLowerCase(),
      ),
  );
}
