# ShrutDhara prototype

Run `npm start` from this folder, then open http://127.0.0.1:4173.
Requires Node.js; no package installation is needed. Run `npm test` for state/backup checks.

The prototype is plain HTML/CSS/JavaScript, separate from any production Android implementation.
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
