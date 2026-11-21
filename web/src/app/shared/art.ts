import { Component } from '@angular/core';

@Component({
  selector: 'app-art',
  template: `
    <svg class="line-art" viewBox="0 0 360 270" fill="none" aria-hidden="true">
      <path d="M51 254V130a129 129 0 0 1 258 0v124M71 254V131a109 109 0 0 1 218 0v123M91 254V132a89 89 0 0 1 178 0v122" stroke="currentColor" opacity=".3" />
      <path d="M180 220v-80m0 57c-45 0-66-24-63-51 30-1 57 13 63 39m0 0c6-26 33-40 63-39 3 27-18 51-63 51m0-28c-23-17-30-41 0-72 30 31 23 55 0 72Z" stroke="currentColor" stroke-width="1.4" />
      <path d="M132 229h96M117 238h126M104 247h152" stroke="currentColor" />
      <circle cx="180" cy="78" r="3" fill="currentColor" />
    </svg>`,
})
export class Art {}
