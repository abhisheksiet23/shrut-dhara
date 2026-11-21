import { Component, computed, input } from '@angular/core';

// One family: 24px grid, 1.75 stroke, round caps and joins, optical weight matched.
// Filled glyphs (play, pause) are the only solid shapes so the primary action reads first.
const paths: Record<string, string> = {
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  book: 'M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5ZM12 6.5v13',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 14.5h3.5v5H6a2 2 0 0 1-2-2ZM20 14.5h-3.5v5H18a2 2 0 0 0 2-2Z',
  bookmark: 'M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  play: 'M8 5.5v13l11-6.5Z',
  pause: 'M7.5 5h3.2v14H7.5ZM13.3 5h3.2v14h-3.2Z',
  close: 'M6 6l12 12M18 6 6 18',
  leaf: 'M19 5C9 4.5 5 9 5.5 14.5 6 17 8 18.5 10.5 18.5 16 18 19.5 13 19 5ZM5 20c2-4 5-7 9-9',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 11v5M12 8v.01',
  down: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  search: 'M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM15 15l5 5',
  lock: 'M6 11h12v9H6ZM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  car: 'M5 12l1.6-4.6A2 2 0 0 1 8.5 6h7a2 2 0 0 1 1.9 1.4L19 12M4 12h16v5H4ZM7 17v2M17 17v2M7.5 14.5h.01M16.5 14.5h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back15: 'M4 13a8 8 0 1 0 8-8M15 2.2 12 5l3 2.8',
  fwd15: 'M20 13a8 8 0 1 1-8-8M9 2.2 12 5 9 7.8',
  restart: 'M6 5v14M18 6.5v11L9 12Z',
  saved: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM8 12.3l3 3 5-6',
  stream: 'M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17 18Z',
  text: 'M5 6h14M5 11h14M5 16h9',
};
const filled = new Set(['play', 'pause']);
const labelled = new Set(['back15', 'fwd15']);

@Component({
  selector: 'app-icon',
  template: `<svg
    class="icon"
    viewBox="0 0 24 24"
    [attr.fill]="solid() ? 'currentColor' : 'none'"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="path()" />
    @if (labelled()) {
      <text
        x="12"
        y="16.4"
        text-anchor="middle"
        font-size="8.5"
        font-weight="700"
        font-family="system-ui, sans-serif"
        fill="currentColor"
        stroke="none"
      >
        15
      </text>
    }
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      vertical-align: middle;
    }
  `,
})
export class Icon {
  readonly name = input('book');
  readonly solid = computed(() => filled.has(this.name()));
  readonly labelled = computed(() => labelled.has(this.name()));
  readonly path = computed(() => paths[this.name()] ?? paths['book']);
}
