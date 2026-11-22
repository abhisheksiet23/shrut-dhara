import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { StudyService } from '../core/study.service';
import { FIRST_SUTRA_ID, MEANING_RECORDING_ID } from '../core/study-catalog';
import { NARRATION_ID, formatTime } from '../core/models';
import { Icon } from '../shared/icon';

@Component({
  imports: [RouterLink, Icon],
  template: `
    <section class="welcome">
      <div>
        <span class="eyebrow">Your study, at your pace</span>
        <h1>A sutra. Its meaning.<br />A little more understanding.</h1>
        <p>Read and hear Hindi meaning in source order. Return to the exact place you chose.</p>
      </div>
    </section>
    <section class="journey-grid home-first">
      <article class="journey listening-card featured">
        <div class="card-top">
          <span class="square-icon"><app-icon name="headphones" /></span
          ><span class="pill">Listen</span>
        </div>
        <h2 lang="hi">शस्त्रपरिज्ञा</h2>
        <p>Hindi meaning, sutra by sutra, in source order.</p>
        <div class="journey-position">
          <span>{{ newAudioStarted() ? 'Your listening place' : 'Begin with' }}</span
          ><b>{{ listeningLabel() }}</b>
        </div>
        <a class="button" routerLink="/listen"
          ><app-icon name="play" />{{
            newAudioStarted() ? 'Resume listening' : 'Explore sutra audio'
          }}</a
        >
      </article>
      <article class="journey reading-card">
        <div class="card-top">
          <span class="square-icon"><app-icon name="book" /></span><span class="pill">Read</span>
        </div>
        <h2>One meaning at a time</h2>
        <p>
          Keep the sutra reference in view. Read the Hindi meaning and the original Prakrit where it is given.
        </p>
        <div class="journey-position">
          <span>{{ savedSutra() ? 'Your reading place' : 'Begin with' }}</span
          ><b>Sutra {{ savedSutra()?.reference ?? '1.1.1' }}</b>
        </div>
        <a class="button secondary" [routerLink]="['/read', savedSutra()?.id ?? firstId]"
          >{{ savedSutra() ? 'Continue reading' : 'Start reading' }}<app-icon name="arrow"
        /></a>
      </article>
    </section>
    <section class="collection-preview">
      <div>
        <span class="eyebrow">Ācārāṅga Sūtra · Book 1</span>
        <h2>See the whole path.</h2>
        <p>
          Eight chapters of the first book, each uddeshaka in source order. Choose where to begin.
        </p>
        <a class="button secondary" routerLink="/study"
          >Open study contents<app-icon name="arrow"
        /></a>
        <a class="text-button" routerLink="/acharanga">Browse all chapter introductions</a>
      </div>
      <div class="book-spine">
        <span lang="hi">आचारांग सूत्र</span><small>Hindi meaning · source by source</small
        ><app-icon name="leaf" />
      </div>
    </section>
    @if (hasEarlierProgress()) {
      <section class="earlier-progress">
        <h2>Your earlier places are kept</h2>
        <p>
          Sample reading and chapter commentary have not been mapped onto the new sutra meanings.
        </p>
        @if (hasCommentary()) {
          <a class="text-button" routerLink="/listen/commentary">Resume earlier commentary</a>
        }
        @if (study.state().reading.sutraId.startsWith('fixture:')) {
          <a class="text-button" [routerLink]="['/preview/read', study.state().reading.sutraId]"
            >Open earlier reading preview</a
          >
        }
      </section>
    }
    <div class="content-note">
      <app-icon name="info" />
      <p>
        Reading and listening are saved independently in this browser. Hindi meanings follow
        Jacobi’s 1884 English translation, numbered unit by unit.
      </p>
    </div>
  `,
})
export class Home {
  readonly content = inject(ContentService);
  readonly study = inject(StudyService);
  readonly firstId = FIRST_SUTRA_ID;
  readonly savedSutra = computed(() =>
    this.content.catalog()?.find(this.study.state().reading.sutraId),
  );
  readonly savedListening = computed(() => {
    const state = this.study.state();
    return state.listening.recordingId === MEANING_RECORDING_ID
      ? state.listening
      : state.listeningHistory?.[MEANING_RECORDING_ID];
  });
  readonly newAudioStarted = computed(
    () =>
      !!this.savedListening() &&
      (this.savedListening()!.part > 0 || this.savedListening()!.seconds > 0),
  );
  readonly listeningLabel = computed(() => {
    const saved = this.savedListening();
    const part = saved && this.content.meanings()?.parts[saved.part];
    return part ? `Sutra ${part.reference} · ${formatTime(saved!.seconds)}` : 'Sutra 1.1.1';
  });
  readonly hasCommentary = computed(() => {
    const state = this.study.state();
    const position =
      state.listening.recordingId === NARRATION_ID
        ? state.listening
        : state.listeningHistory?.[NARRATION_ID];
    return !!position && (position.part > 0 || position.seconds > 0);
  });
  readonly hasEarlierProgress = computed(
    () => this.hasCommentary() || this.study.state().reading.sutraId.startsWith('fixture:'),
  );
}
