import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyService } from '../core/study.service';
import { UiService } from '../core/ui.service';
import { Bookmark } from '../core/models';
import { Icon } from '../shared/icon';

@Component({
  imports: [RouterLink, Icon],
  template: ` <div class="page-title">
      <div class="eyebrow">Come back to these</div>
      <h1>Bookmarks</h1>
      <p>Passages you’ve saved appear here.</p>
    </div>
    @for (bookmark of study.state().bookmarks; track bookmark.sutraId) {
      <article class="chapter-row">
        <span class="square-icon"><app-icon name="bookmark" /></span>
        <div>
          <h3 lang="hi">{{ bookmark.title }}</h3>
          <p>Reading preview · {{ bookmark.sutraId }}</p>
        </div>
        <div class="chapter-actions">
          <a class="button secondary" [routerLink]="['/read', bookmark.sutraId]"
            >Read <app-icon name="arrow" /></a
          ><button
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
        <p>While reading, tap the bookmark icon to keep a passage here.</p>
        <a class="button" routerLink="/read">Start reading <app-icon name="arrow" /></a>
      </div>
    }`,
})
export class Bookmarks {
  readonly study = inject(StudyService);
  private ui = inject(UiService);
  async remove(bookmark: Bookmark): Promise<void> {
    try {
      await this.study.toggleBookmark(bookmark.sutraId, bookmark.title, bookmark.revision);
      this.ui.notify('Bookmark removed.');
    } catch (error) {
      this.ui.error(error);
    }
  }
}
