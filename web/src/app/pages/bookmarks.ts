import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyService } from '../core/study.service';
import { UiService } from '../core/ui.service';
import { Bookmark } from '../core/models';
import { Icon } from '../shared/icon';
import { ContentService } from '../core/content.service';

@Component({
  imports: [RouterLink, Icon],
  template: ` <div class="page-title">
      <div class="eyebrow">Come back to these</div>
      <h1>Bookmarks</h1>
      <p>Sutras saved from reading or listening appear here.</p>
    </div>
    @for (bookmark of study.state().bookmarks; track bookmark.sutraId) {
      <article class="chapter-row">
        <span class="square-icon"><app-icon name="bookmark" /></span>
        <div>
          <h3 lang="hi">{{ bookmark.title }}</h3>
          @if (content.catalog()?.find(bookmark.sutraId); as sutra) {
            <p>Book 1 · Study 1 · Uddeshaka {{ sutra.section }} · Sutra {{ sutra.reference }}</p>
          } @else {
            <p>
              {{
                bookmark.sutraId.startsWith('fixture:')
                  ? 'Earlier reading preview'
                  : 'Saved reference unavailable'
              }}
            </p>
          }
        </div>
        <div class="chapter-actions">
          <a
            class="button secondary"
            [routerLink]="[
              bookmark.sutraId.startsWith('fixture:') ? '/preview/read' : '/read',
              bookmark.sutraId,
            ]"
            >Read <app-icon name="arrow"
          /></a>
          @if (hasAudio(bookmark.sutraId)) {
            <a class="button secondary" [routerLink]="['/listen', bookmark.sutraId]"
              >Listen<app-icon name="headphones"
            /></a>
          }
          <button
            class="icon-button"
            [attr.aria-label]="'Remove bookmark: ' + bookmark.title"
            (click)="remove(bookmark)"
          >
            <app-icon name="close" />
          </button>
        </div>
      </article>
    } @empty {
      <div class="empty">
        <app-icon name="bookmark" />
        <h2>Nothing saved yet.</h2>
        <p>Save a sutra while reading or listening, then return to either mode.</p>
        <a class="button" routerLink="/study">Choose a sutra <app-icon name="arrow" /></a>
      </div>
    }`,
})
export class Bookmarks {
  readonly study = inject(StudyService);
  readonly content = inject(ContentService);
  private ui = inject(UiService);

  hasAudio(id: string): boolean {
    return (this.content.catalog()?.audioIndex(this.content.meanings(), id) ?? -1) >= 0;
  }
  async remove(bookmark: Bookmark): Promise<void> {
    try {
      await this.study.toggleBookmark(bookmark.sutraId, bookmark.title, bookmark.revision);
      this.ui.notify('Bookmark removed.');
    } catch (error) {
      this.ui.error(error);
    }
  }
}
