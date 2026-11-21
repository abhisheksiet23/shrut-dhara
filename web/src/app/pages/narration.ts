import { Component, ElementRef, OnDestroy, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlaybackService } from '../core/playback.service';
import { SessionService } from '../core/session.service';

@Component({
  imports: [RouterLink],
  styles: `
    .narration-audio {
      width: 100%;
      margin: 1rem 0 0.6rem;
    }
    .narration-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0.5rem 0;
    }
    .narration-credits {
      margin-top: 1.35rem;
    }
    .narration-credits a {
      text-decoration: underline;
    }
  `,
  template: `
    <div class="page-title">
      <a class="text-button" routerLink="/listen">← श्रवण यात्रा</a>
      <p>आचारांग सूत्र · प्रथम श्रुतस्कन्ध · प्रथम अध्ययन</p>
      <h1>शस्त्रपरिज्ञा</h1>
    </div>

    <section class="settings-panel" aria-labelledby="narration-heading">
      <span class="pill amber">एआई आवाज़ · समीक्षा प्रति</span>
      <h2 id="narration-heading">सात उद्देशकों की हिन्दी व्याख्या</h2>
      <p>10 मिनट 28 सेकंड · जीव और कर्म के प्रश्न से लेकर छह जीव-निकायों के प्रति संयम तक।</p>
      <audio
        #recording
        class="narration-audio"
        aria-label="शस्त्रपरिज्ञा की हिन्दी व्याख्या"
        controls
        preload="metadata"
        [src]="audioUrl"
        (play)="playback.playChapter(recording)"
        (error)="failed.set(true)"
        (loadedmetadata)="failed.set(false)"
      ></audio>
      @if (failed()) {
        <p role="alert">ऑडियो लोड नहीं हुआ। इंटरनेट की जाँच करके फिर कोशिश करें।</p>
        <button class="button secondary" (click)="recording.load()">फिर कोशिश करें</button>
      }
      <div class="narration-actions">
        <a class="button secondary" [href]="audioUrl" download>MP3 डाउनलोड करें</a>
        <a class="button secondary" href="/narration/shastraparijna-hi-v1.txt">लिखित व्याख्या पढ़ें</a>
      </div>
      <p class="small-note">यह अध्याय की व्याख्या है। मूल प्राकृत से अर्थ और उच्चारण का मिलान बाकी है।</p>

      <div class="narration-credits small-note">
        <p>
          पाठ का आधार: हरमन जैकोबी,
          <a
            href="https://en.wikisource.org/wiki/Sacred_Books_of_the_East/Volume_22/%C3%82k%C3%A2r%C3%A2%E1%B9%85ga_S%C3%BBtra/Book_1/Lecture_1"
            >प्रथम अध्ययन, 1884</a
          >।
        </p>
        <p>
          कृत्रिम हिन्दी वाचन:
          <a
            href="https://huggingface.co/rhasspy/piper-voices/blob/1af0d6b/hi/hi_IN/pratham/medium/MODEL_CARD"
            >Piper Pratham · PravalX</a
          >। <a href="/narration/credits.txt">श्रेय और उपयोग की शर्तें</a>।
        </p>
      </div>
    </section>
  `,
})
export class Narration implements OnDestroy {
  readonly audioUrl = '/narration/shastraparijna-hi-v1.mp3';
  readonly failed = signal(false);
  private readonly recording = viewChild<ElementRef<HTMLAudioElement>>('recording');
  private readonly session = inject(SessionService);
  protected readonly playback = inject(PlaybackService);

  constructor() {
    effect(() => {
      if (!this.session.owned() || this.session.maintenance())
        this.playback.pauseChapter(this.recording()?.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.playback.pauseChapter(this.recording()?.nativeElement);
  }
}
