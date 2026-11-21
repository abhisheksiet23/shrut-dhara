import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyService } from '../core/study.service';
import { ContentService } from '../core/content.service';
import { formatTime } from '../core/models';
import { Icon } from '../shared/icon';
import { Art } from '../shared/art';

@Component({
  imports: [RouterLink, Icon, Art],
  template: ` <section class="welcome">
      <div>
        <div class="eyebrow">ज्ञान की एक शांत यात्रा</div>
        <h1>हर दिन, थोड़ा आत्मचिंतन।</h1>
        <p>पढ़ें, सुनें और समझें। अपनी गति से, अपने लिए।</p>
      </div>
      <div class="date-note">
        <app-icon name="leaf" /><span>आज का समय<br /><b>कुछ पल अपने लिए</b></span>
      </div>
    </section>
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">श्रुतधारा · श्रवण और मनन</span>
        <h2>ज्ञान से जुड़ें।<br />जीवन में उतरने दें।</h2>
        <p>जैन आगमों की पठन और श्रवण यात्रा—<br />सरल हिन्दी में, एक अध्याय के साथ।</p>
        <a class="button light" routerLink="/library" lang="en"
          >Explore the collection <app-icon name="arrow" /></a
        ><span class="hero-foot">शांत अनुभव। कोई दौड़ नहीं।</span>
      </div>
      <app-art /><span class="hero-number">01 / एक नई शुरुआत</span>
    </section>
    <div class="section-heading">
      <h2>जहाँ छोड़ा था, वहीं से</h2>
      <span lang="en">TWO JOURNEYS, YOUR PACE</span>
    </div>
    <section class="journey-grid">
      <article class="journey reading-card">
        <div class="card-top">
          <span class="square-icon"><app-icon name="book" /></span
          ><span class="pill">पठन यात्रा</span>
        </div>
        <h3>एक सूत्र, एक ठहराव।</h3>
        <p>मूल पाठ, अर्थ और सरल व्याख्या के लिए<br />एक सहज पढ़ने का स्थान।</p>
        <div class="journey-position">
          <span>नमूना लेखन · शास्त्रीय सामग्री नहीं</span><b>{{ passageLabel() }}</b>
        </div>
        <div class="progress-track"><i [style.width.%]="readingPercent()"></i></div>
        <a class="text-button" routerLink="/read" lang="en"
          >Continue reading <app-icon name="arrow"
        /></a>
      </article>
      <article class="journey listening-card">
        <div class="card-top">
          <span class="square-icon"><app-icon name="headphones" /></span
          ><span class="pill">श्रवण यात्रा</span>
        </div>
        <h3>सुनें। समझें। मनन करें।</h3>
        <p>शस्त्रपरिज्ञा की हिन्दी समीक्षा प्रति सुनें<br />या ऑफ़लाइन प्लेयर की जाँच करें।</p>
        <div class="journey-position">
          <span lang="en">Audio calibration · generated tones</span
          ><b
            >Part {{ study.state().listening.part + 1 }} ·
            {{ time(study.state().listening.seconds) }}</b
          >
        </div>
        <div class="progress-track">
          <i [style.width.%]="(study.state().listening.seconds / 900) * 100"></i>
        </div>
        <a class="text-button" routerLink="/listen" lang="en"
          >Explore listening <app-icon name="arrow"
        /></a>
      </article>
    </section>
    <section class="collection-preview">
      <div>
        <div class="eyebrow">आपका आगम संग्रह</div>
        <h2>एक अध्याय से शुरुआत।</h2>
        <p>दीर्घकालीन लक्ष्य: ३२ आगम। पहले अध्याय का स्रोत और समीक्षा चयन शेष।</p>
        <a class="text-button" routerLink="/library" lang="en"
          >View collection <app-icon name="arrow"
        /></a>
      </div>
      <div class="book-spine">
        <span>आचारांग सूत्र</span><small>प्रस्तावित शुरुआत</small><app-icon name="leaf" />
      </div>
    </section>
    <div class="content-note">
      <app-icon name="info" />
      <p>
        यह development build है। नमूना लेखन और calibration audio सत्यापित आगम की जगह नहीं लेते। आपकी दोनों
        यात्राएँ इस browser में अलग सहेजी जाती हैं।
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
    this.readingIndex() >= 0 ? `अंश ${this.readingIndex() + 1} / 3` : 'Saved reference unavailable',
  );
  readonly readingPercent = computed(() =>
    this.readingIndex() >= 0 ? ((this.readingIndex() + 1) / 3) * 100 : 0,
  );
}
