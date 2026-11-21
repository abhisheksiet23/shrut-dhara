import { Component, input } from '@angular/core';

const paths: Record<string, string> = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
  book: 'M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15',
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 13h4v8H4a1 1 0 0 1-1-1Zm18 0h-4v8h3a1 1 0 0 0 1-1Z',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  arrow: 'M4 12h16m-6-6 6 6-6 6', back: 'M20 12H4m6-6-6 6 6 6',
  play: 'm9 5 11 7-11 7Z', pause: 'M8 5v14m8-14v14', close: 'm6 6 12 12M6 18 18 6',
  leaf: 'M20 3C8 2 2 8 5 15c6 8 16 0 15-12ZM3 22 16 9',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v6m0-10v1',
  down: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  search: 'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm5 11 6 6',
  lock: 'M5 10h14v11H5Zm3 0V6a4 4 0 0 1 8 0v4',
  car: 'm5 5-3 8v6h3v-3h14v3h3v-6l-3-8Zm-3 8h20M6 13V9h12v4M6 16h1m10 0h1',
  check: 'm5 12 4 4L19 6',
};

@Component({
  selector: 'app-icon',
  template: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>`,
  styles: `:host { display:inline-flex; flex-shrink:0; align-items:center; vertical-align:middle; }`,
})
export class Icon {
  readonly name = input('book');
  path(): string { return paths[this.name()] ?? paths['book']; }
}
