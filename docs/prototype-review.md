# Prototype polish and verification

Date: 2026-11-20. Scope: local interactive prototype, not production Android behavior.
Candidate: working-tree snapshot identified by [SHA-256 manifest](evidence/candidate-sha256.json).
Requirements: [use-case specification](use-case-specification.md); owner's request to test, polish, preserve the palette, balance English/Hindi UI, and compare fonts.

## Result

The tested prototype flows below passed within the stated scope. Five Node tests passed and all 18 route/viewport combinations had no horizontal document overflow and exactly one primary heading. Browser console checks returned no captured warnings/errors. These checks do not establish full accessibility, doctrinal accuracy, real audio continuity, or native Android compatibility.

## Design direction

The warm paper, olive, and saffron palette remains. Secondary text was strengthened and several tiny status labels enlarged. Study text, explanations, reflective prompts, and journey names remain Hindi; familiar utility labels use English: Settings, Bookmarks, Continue reading, Sources & review, Playback speed, Sleep timer, Driving mode, Export/Restore backup. Important missing-content and recovery explanations remain Hindi. English-only UI labels carry English language metadata; the document and reading material remain Hindi.

Typography was visually compared at identical sizes using locally hosted Mukta, Hind, and Noto Serif Devanagari. [Open the comparison](http://127.0.0.1:4173/fonts.html) or inspect the [saved comparison](evidence/font-comparison.jpg).

| Font | Observation and chosen use |
| --- | --- |
| Mukta | Friendly, open letterforms; mixed Hindi/English labels form a consistent UI. Selected for controls and utility text. |
| Noto Serif Devanagari | More deliberate, book-like texture with clear differentiation from controls. Selected for headings and Hindi reading. |
| Hind | Compact, neutral sans alternative. Retained as a selectable reading option. |

This is an editorial/visual recommendation, not proof that one font improves comprehension. Settings offers all three reading fonts, four text sizes, and a live Hindi sample. Old backups receive the new default without invalidation. Font source URLs and original license notices are retained in [fonts/README.md](../prototype/fonts/README.md).

## Corrections and supporting evidence

| Area | Finding / change | Evidence limit |
| --- | --- | --- |
| Reading preferences | Full-page rerenders could lose focus. Preserve focus on the changed control; closing the dialog returns focus to the reading-options button. | Final browser checks confirmed checkbox focus, 27px button focus, content visibility, and close focus. Original focus failure was identified by source inspection, not a saved failing regression run. |
| Keyboard skip link | `#main` was interpreted as an application route. Intercept it and focus main without leaving the journey. | Final check returned active element `main`, hash `#reader`. Original failure follows the prior routing source; no original-candidate execution retained. |
| Position restoration | During exploration, a long-passage return produced a different offset. Bind delayed saves to their passage, await font/layout readiness, avoid smooth transition saves, and disable competing browser restoration. | Final unchanged-layout check: scroll 1388 → 1388 after journey return → 1388 after reload at 390×844. Not a guarantee across font/viewport/content changes. The exploratory pointer sequence and final keyboard sequence differed, so this is final smoke evidence rather than an isolated regression proof of a single cause. |
| Search | Trim whitespace before matching, while retaining no-results recovery. | `no-such-chapter` showed no results; Clear search recovered; padded uppercase `  ACHARANGA  ` found the chapter. |
| Modal dismissal | Only actual outside clicks dismiss; dialog padding is not a dismissal target. | Source-reviewed correction; Escape/outside-click permutations were not exhaustively exercised. |
| Cross-journey playback | Playing narration controls were only on the listening page. Added a compact player when leaving it during playback. | Start → Home → pause → dismiss was exercised; the position remains independently saved. Audio itself is simulated. |
| Main focus appearance | Removed the large default outline around the non-interactive main container. Retained visible focus rings for interactive controls. | Visually reviewed on final home and reader. |

## Executed flow coverage

| Requirement / path | Check and result |
| --- | --- |
| UC-02.M / A1 / A2 (partial) | Collection entry, sample availability, text search/no-results/recovery passed. Installed sample content was exercised locally; an actual device/network-off installation test was not run. |
| UC-03.M | Bookmark add → listing → revisit → remove → empty state → reader recovery passed. Reading position remained separate from listening. |
| UC-03.A1 | 27px long Hindi content inspected at 390×844; content continued vertically with no horizontal overflow. Default 21px reader also reviewed. |
| UC-03.A2 | Advancing through all three sample passages reached a missing-content dialog; reflection and return worked. No claim of actual chapter completion was made. |
| UC-03.A3 | Long-passage resume/reload check passed at the same font and viewport; see exact values above. |
| Reading settings | Meaning show/hide, font selection, text size, Paper/Night theme, focus retention, and dialog-close return passed. Night reader visually inspected. |
| UC-04.M | Play/pause preview, +15-second seek, speed change to 1.25×, and listening-position persistence after reload passed. A position of 0:22 remained 0:22 on reload. |
| UC-04.A3 / UC-05.A2 | Seeking near the end then playing reached 22:00, changed to Play preview, and announced that the next chapter is unavailable. No silent continuation occurred. |
| UC-05.M / A1 (simulation) | Pre-drive preview → large controls → play → simulated call interruption paused the preview; explicit play remains required. No Bluetooth/car integration was exercised. |
| Sleep timer | Set a five-minute timer and cancel it through UI passed. Actual timer expiration was not waited for or independently verified. |
| UC-07.M / A1 | Exported a real JSON backup via UI; incompatible backup showed an error/recovery message; the exported file then restored successfully. Bookmarks, reading passage, and listening position were checked through visible UI. Unit tests additionally cover rejection without partial state application. |
| Keyboard | Main skip link, dialog focus return, settings focus preservation, and passage advancement via Enter passed. Complete keyboard traversal and a real screen reader remain untested. |

Two offscreen pointer automation attempts during passage advancement returned browser-control errors. The workflow was completed using keyboard activation and visible state checks. This is an automation limitation, not evidence that Android touch/swipe navigation passed. Other controls were exercised using pointer/locator actions. The early native checkbox attempt was inconclusive; subsequent DOM-backed checkbox checks passed.

## Viewports and visual evidence

Six routes—home, library, reader, listen, bookmarks, settings—were checked at 360×800, 768×1024, and 1440×1000. All 18 reflow checks passed. [Raw reflow results](evidence/reflow-results.json).

Actual screenshots were inspected for hierarchy, wrapping, clipping, type, and controls:

- [Desktop home](evidence/home-desktop.jpg), 1440×1000.
- [Mobile reader](evidence/reader-mobile.jpg), 390×844, Noto Serif at 21px.
- [Large-text reader](evidence/reader-mobile-large.jpg), 390×844, 27px.
- [Driving preview](evidence/driving-mobile.jpg), 390×844.
- [Tablet listening](evidence/listening-tablet.jpg), 768×1024.
- [Font comparison](evidence/font-comparison.jpg), 1440×1000.

The 360px home, empty bookmarks, and Night reader were also visually inspected during the session. Reflow checks alone do not prove that every component/state is free of clipping or passes accessibility criteria.

## Repeatable checks and remaining boundary

Run `npm test` (five tests) and `node --check prototype/app.js`. The tests cover independent journeys/boundaries, backup round trip, malformed backup rejection, reversible bookmarks, and old/new reading-font backup compatibility. Both commands passed on the final code. The suite was rerun after the relevant changes; no unit failure occurred. Browser observations above were performed through the connected in-app browser; no standalone browser-test runner or CI integration was added.

Unverified: real narration, offline install/update/download recovery, native Android background/media/car controls, storage-denied behavior, actual sleep expiration, OS interruptions, browser/device matrix, formal contrast/accessibility conformance, font coverage for an eventual source edition's original text, and beginner comprehension. Editorial/rights decisions in the use-case specification remain open. No release or publication is implied.
