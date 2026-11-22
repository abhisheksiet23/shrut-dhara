import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sutra } from '../core/study-catalog';

@Component({
  selector: 'app-study-context',
  imports: [RouterLink],
  template: `
    <nav class="study-breadcrumbs" aria-label="Study location">
      <a routerLink="/library">Library</a><span aria-hidden="true">/</span>
      <a routerLink="/acharanga"><span lang="hi">आचारांग</span></a
      ><span aria-hidden="true">/</span>
      <a routerLink="/study"><span lang="hi">शस्त्रपरिज्ञा</span></a>
    </nav>
    @if (sutra(); as current) {
      <div class="sutra-location">
        <span
          >Uddeshaka {{ current.section }} · <span lang="hi">{{ current.sectionTitle }}</span></span
        >
        <strong>Sutra {{ current.reference }}</strong>
      </div>
    }
  `,
})
export class StudyContext {
  readonly sutra = input<Sutra | null>(null);
}
