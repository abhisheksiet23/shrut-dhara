import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyService } from '../core/study.service';
import { UiService } from '../core/ui.service';
import { Bookmark } from '../core/models';
import { Icon } from '../shared/icon';

@Component({
  imports: [RouterLink, Icon],
  template: ` <div class="page-title">
      <div class="eyebrow">फिर लौटकर पढ़ने के लिए</div>
      <h1 lang="en">Bookmarks</h1>
      <p>सहेजे हुए अंश, यहीं मिलेंगे।</p>
    </div>
    @for (bookmark of study.state().bookmarks; track bookmark.sutraId) {
      <article class="chapter-row">
        <span class="square-icon"><app-icon name="bookmark" /></span>
        <div>
          <h3>{{ bookmark.title }}</h3>
          <p>{{ bookmark.sutraId }} · {{ bookmark.revision }}</p>
        </div>
        <div class="chapter-actions">
          <a class="button secondary" [routerLink]="['/read', bookmark.sutraId]"
            >पढ़ें <app-icon name="arrow" /></a
          ><button
            class="icon-button"
            [attr.aria-label]="bookmark.title + ' का बुकमार्क हटाएँ'"
            (click)="remove(bookmark)"
          >
            <app-icon name="close" />
          </button>
        </div>
      </article>
    } @empty {
      <div class="empty">
        <app-icon name="bookmark" />
        <h2>एक विचार के पास लौटें।</h2>
        <p>पढ़ते समय बुकमार्क चिह्न चुनें। सहेजे हुए अंश यहाँ दिखाई देंगे।</p>
        <a class="button" routerLink="/read">पठन यात्रा खोलें <app-icon name="arrow" /></a>
      </div>
    }`,
})
export class Bookmarks {
  readonly study = inject(StudyService);
  private ui = inject(UiService);
  async remove(bookmark: Bookmark): Promise<void> {
    try {
      await this.study.toggleBookmark(bookmark.sutraId, bookmark.title, bookmark.revision);
      this.ui.notify('बुकमार्क हटाया गया।');
    } catch (error) {
      this.ui.error(error);
    }
  }
}
