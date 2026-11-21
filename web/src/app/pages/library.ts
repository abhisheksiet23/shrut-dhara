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
      <div class="eyebrow">पठन और श्रवण</div>
      <h1>आगम संग्रह</h1>
      <p>जो उपलब्ध है, उसे जानकर अपनी यात्रा चुनें।</p>
      <a class="button" routerLink="/acharanga">आचारांग के २४ अध्ययन देखें</a>
    </div>
    <label class="search-box"
      ><app-icon name="search" /><input
        type="search"
        aria-label="संग्रह में खोजें"
        placeholder="आगम या नमूना अंश खोजें"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
    /></label>
    <div class="library-tabs">
      <span class="selected">आचारांग से शुरुआत</span><span>दीर्घकालीन लक्ष्य · ३२ आगम</span>
    </div>
    @if (content.error()) {
      <div class="empty">
        <h2>सामग्री load नहीं हुई</h2>
        <p>{{ content.error() }}</p>
        <button class="button secondary" (click)="content.load()">फिर कोशिश करें</button>
      </div>
    } @else if (!matches()) {
      <div class="empty">
        <app-icon name="search" />
        <h2>कोई परिणाम नहीं मिला</h2>
        <p>यह खोज केवल इस build की उपलब्ध नमूना सामग्री में है।</p>
        <button class="button secondary" (click)="query.set('')">खोज साफ़ करें</button>
      </div>
    } @else {
      <article class="scripture-card">
        <div class="scripture-art">
          <app-art /><span>आचारांग<br /><small>सूत्र</small></span>
        </div>
        <div class="scripture-details">
          <span class="pill amber">स्रोत और समीक्षा चयन शेष</span>
          <h2>आचारांग सूत्र</h2>
          <p>प्रस्तावित पहला आगम। मूल पाठ और प्रामाणिक अनुवाद अभी प्रकाशित नहीं हैं।</p>
          <div class="availability">
            <span><app-icon name="book" />३ interface samples</span
            ><span><app-icon name="headphones" />शस्त्रपरिज्ञा श्रवण</span>
          </div>
        </div>
      </article>
      <div class="section-heading">
        <h2>अनुभव का नमूना</h2>
        <span>शास्त्रीय अध्याय-संरचना नहीं</span>
      </div>
      <article class="chapter-row">
        <span class="chapter-index">01</span>
        <div>
          <h3>ठहरें, पढ़ें, मनन करें।</h3>
          <p>स्थानीय नमूना लेखन · कोई मूल सूत्र नहीं</p>
          <div class="availability">
            <span class="status-dot">Reader fixture</span
            ><span>{{
              offline.assets().length && offline.saved().length === offline.assets().length ? 'श्रवण ऑफ़लाइन सहेजा हुआ' : 'श्रवण ऑफ़लाइन सहेजना शेष'
            }}</span>
          </div>
        </div>
        <div class="chapter-actions">
          <a class="button secondary" routerLink="/read"><app-icon name="book" />पढ़ें</a
          ><a class="button" routerLink="/listen"
            ><app-icon name="headphones" />शस्त्रपरिज्ञा सुनें</a
          >
        </div>
      </article>
      @for (passage of passages(); track passage.id) {
        <article class="chapter-row">
          <span class="chapter-index">{{ passage.reference }}</span>
          <div>
            <h3>{{ passage.title }}</h3>
            <p>इंटरफ़ेस नमूना · प्रामाणिक सूत्र-संदर्भ नहीं</p>
          </div>
          <a class="text-button" [routerLink]="['/read', passage.id]"
            >पढ़ें <app-icon name="arrow"
          /></a>
        </article>
      }
      <article class="chapter-row unavailable">
        <span class="chapter-index">—</span>
        <div>
          <h3>सत्यापित अध्याय</h3>
          <p>स्रोत, पुनर्वितरण अधिकार और योग्य समीक्षा के बाद उपलब्ध होगा।</p>
        </div>
        <span class="pill amber">अभी उपलब्ध नहीं</span>
      </article>
    }
    <div class="content-note">
      <app-icon name="info" />
      <p>
        प्रामाणिक canonical क्रम और स्रोत-संस्करण का सत्यापन शेष है। अनुपलब्ध सामग्री अपने आप नहीं छोड़ी जाएगी।
      </p>
    </div>`,
})
export class Library {
  readonly content = inject(ContentService);
  readonly offline = inject(OfflineService);
  readonly query = signal('');
  readonly matches = computed(
    () =>
      !this.query().trim() ||
      'आचारांग acharanga नमूना ठहरकर देखना ध्यान सुनना व्यवहार चिंतन'.includes(
        this.query().trim().toLowerCase(),
      ),
  );
  readonly passages = computed(() => this.content.chapter()?.passages ?? []);
}
