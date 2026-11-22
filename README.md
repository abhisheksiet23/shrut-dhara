# ShrutDhara web app

From the repository root with Node 24.15+ and npm:

```sh
npm --prefix web ci
npm run build
npm start
```

Open [the Angular preview](http://127.0.0.1:4174/). Use this build for service-worker and offline checks. `npm run dev` starts Angular's development server. `npm test` runs the prototype and Angular state tests. `npm --prefix web run e2e` runs real-browser checks of the listening journey against a production build (needs Chrome; set `E2E_CHROME` to a Chrome/Chromium path if the default channel is missing).

The current study journey opens `/study`: all seven uddeshakas and 48 numbered units of *Śastraparijñā* in Jacobi's 1884 order. Read and Listen use the same source identity, with exact-unit links, replay, previous/next sutra and bookmarks from either mode. The first uddeshaka has seven Hindi meaning drafts and individual AI audio samples; the other 41 meanings/audio are pending. Original Prakrit and qualified editorial/pronunciation review remain open. These drafts use the historical English translation as an intermediary.

The app saves independent reading/listening progress, retained positions per recording, bookmarks and preferences in IndexedDB schema 2. Listen → Save audio sample verifies full files for offline playback. Earlier chapter commentary remains at `/listen/commentary`; old fixture reading is accessible through preserved progress/bookmark links. Old timestamps are never inherited by the new recording. Settings exports backup v2 and can restore v1 or v2. Older app writers are fenced by the database version to protect retained positions.

See the [implementation design](docs/sutra-journey-design.md), [journey map](docs/user-journey-review-2026-11-22.md) and [verification report](docs/implementation-checks.md). Approved chapter content and physical Android checks in Firefox and Chrome are still required for daily use. The Vercel configuration remains the deployment target; local implementation does not imply a new deployment.

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
