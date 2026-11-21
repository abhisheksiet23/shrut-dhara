# ShrutDhara QA · 21 November 2026

## Fix verification

All three defects below passed regression checks on local build `main-PIMGLHBM.js` in the Windows in-app browser at 360 × 800 CSS px. The Angular production build and all 12 existing tests passed.

- Playing Lokavijaya paused calibration, and restarting calibration from the mini-player paused Lokavijaya. The dedicated Shastraparijna recording also paused calibration, which could be resumed from Listen after leaving the narration.
- Closing the Lokavijaya study by pointer or keyboard paused its audio. Reopening the study showed the same paused position.
- Enter left focus on the expanded audio button. Tab moved to the native audio player within the same study.

Android Firefox and Chrome hardware media controls were outside this desktop run. The chapter reading, offline listening, and content acceptance gaps below remain open.

## Original QA run

The catalogue was usable for desktop review. The original run found a playback conflict and gaps in full chapter reading and listening verification.

Candidate: workspace at Git `ba7e27e` plus the local changes, including the 24-study catalogue. Tested built entry `main-2TQCIDRM.js`. `index.html` SHA-256 `686a704e0491643ce029b46f71c43c53ee24b8b3cafe35b66b6261444906a6c5`. `sw.js` SHA-256 `2903bf56b7b819ac167403414113e47b89b975c9c771b81a9b67c1362ea88a93`. HTTP asset checks used port 4175. Browser tests used a fresh origin on port 4176 in the Windows in-app browser, including a 360 × 800 viewport. The QA server was stopped for the offline run. This assessment made no app changes or deployment.

## Reproduced defects

| Priority | Reproduction and observation | Correction to verify |
| --- | --- | --- |
| P1 · Two audio sources play together | Save and play calibration in Listen. Open the 24-study catalogue, expand Lokavijaya and play its audio. That pauses calibration. Press the mini-player's Play audio button. Lokavijaya stays unpaused while calibration's control changes to Pause. The guard is one-way in [the catalogue player](../web/src/app/pages/acharanga.ts#L158), and [the app shell](../web/src/app/app.html#L95) displays the calibration control on this route. | Arbitrate chapter and calibration starts through a shared playback owner. Test both directions, including the mini-player and any browser media actions. |
| P2 · Collapsing a study hides a playing track | Play Lokavijaya and collapse its [study panel](../web/src/app/pages/acharanga.ts#L64). Playback remains unpaused even though the controls are inside the closed panel. | Pause on collapse or expose a persistent control that stays visible and accessible. Test pointer and keyboard. |
| P2 · Opening a chapter player drops keyboard focus | At 360 px, enter the Lokavijaya heading and activate **ऑडियो परिचय खोलें** with Enter. The button is replaced and `document.activeElement` returns to `BODY`. The user must find the controls again. [Catalogue control](../web/src/app/pages/acharanga.ts#L83) | Keep focus on a stable control or move it explicitly to the new player. Verify that the next tab stop remains within the expanded study. |

## Executed checks and acceptance gaps

| Scope | Result and limit |
| --- | --- |
| Automated checks and serving | 12 tests passed under `npm test`. `git diff --check` passed. Eight direct routes returned the exact local shell with CSP. All 24 MP3s matched local bytes and returned correct 206 data for a middle range. An invalid range returned 416 and missing assets returned 404. This proves delivery rather than chapter coverage or pronunciation. |
| UC-02 / VP-08 catalogue | Both books and 24 entries rendered. Expanded Lokavijaya had no horizontal overflow at 360 CSS px. Keyboard expansion worked. Player focus and collapse defects are above. Touch and screen-reader use on a physical phone were not tested. |
| UC-03 and VP-05 / reader and listening | A fixture bookmark appeared in Bookmarks after moving to the next reading passage. Calibration audio saved, sought, and reopened paused with a retained position. The new chapter audio has no saved-position integration. After reload the Lokavijaya player was gone and had to be opened again. Full UC-03 and UC-04 acceptance remains open for actual chapters. |
| VP-01 / VP-03 desktop subset | With the QA server stopped, reload opened the cached app. Saved calibration played and sought from 123 to about 138 seconds. The catalogue opened offline, but uncached Vimukti audio failed with the displayed error. Offline download inside ShrutDhara applies to calibration audio only in this build. |
| VP-09 desktop subset | Malformed JSON was rejected. Cancelling a valid replacement preserved Paper. Confirming applied Night and the distinct 123-second listening position, with playback paused. Existing database tests cover stale epochs and invalid writes. Oversized, future-version and injected transaction failure were not repeated in the browser. |
| VP-10 desktop subset | Second tab began read-only. Cooperative handoff transferred ownership and the previous owner became read-only. This does not clear installed-window, suspended-owner, or failure injection cases. |
| Release blockers outside this run | Full original Prakrit and Hindi reading text remains external. Twenty-three tracks are introductions, with detailed and reviewed chapter coverage pending. Physical CMF Phone 1 Firefox and Chrome screen lock, calls, headset control, and installation are untested. VP-06 abrupt termination, VP-07 storage failure, VP-11 version upgrade and VP-12 retention fault injection were not executed in this pass. |
