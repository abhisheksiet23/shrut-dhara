# ShrutDhara web app

From the repository root with Node 24.15+ and npm:

```sh
npm --prefix web ci
npm run build
npm start
```

Open [the Angular preview](http://127.0.0.1:4174/). Use this build for service-worker and offline checks. `npm run dev` starts Angular's development server. `npm test` runs the prototype and Angular state tests.

The app keeps reading and listening progress, bookmarks, and preferences in IndexedDB. The offline worker caches the app and bundled reader content. **Listen → Save audio** verifies and saves two 15-minute calibration files for offline playback. **Settings → Export backup / Restore backup** transfers personal progress between browser profiles. The Vercel configuration builds a static site.

The development candidate uses Hindi sample text and generated audio tones. Approved chapter text and narration, and physical Android checks in Firefox and Chrome, are required for daily use. See the [web validation plan](docs/web-validation-plan.md).

## Earlier prototype

Run `npm run prototype` to open [the original prototype](http://127.0.0.1:4173/).
The prototype is plain HTML/CSS/JavaScript.
It includes home, collection/search, reader, bookmarks, listening controls, driving preview,
reading options, local progress, and JSON export/restore.

All text is interface sample material, not scripture or a verified translation. Audio playback is
a simulated timeline with no recording. Android background playback and vehicle integration are
not implemented or verified. No offline app installation/service worker is supplied.

Design proposals: warm paper, olive controls, Hindi-first typography, chapter/component availability,
explicit passage navigation after scrolling, and a paused state after a simulated call interruption.
These proposals do not close the open decisions in docs/use-case-specification.md.

Polish and review, 2026-11-20: bilingual utility labels, locally bundled Hindi fonts, reading-font
selection, focus/resume corrections, and cross-journey mini-player controls are included.
Five Node state tests pass. Six screens passed reflow checks at 360, 768, and 1440px;
representative screens and important recovery flows were inspected in the browser.
See [the review report](docs/prototype-review.md) for exact coverage and remaining limitations.
Compare the three fonts at http://127.0.0.1:4173/fonts.html.
