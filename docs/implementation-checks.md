# ShrutDhara local verification

21 November 2026. Angular 22.3, database schema 1, backup version 1, localhost port 4174. Browser observations use the desktop in-app browser, including a 390 × 844 viewport for mobile layout. The final build uses `main-XWCW7JMF.js`.

| Check | Observed result |
| --- | --- |
| Build and automated tests | Production build passed with a 317 KB initial bundle before compression. All 12 tests passed, including seven Angular state and backup tests. npm reported zero vulnerabilities after the build dependency removal. |
| Reader and listening | Navigation from listening to Home and the reader preserved active playback. The reader saved a bookmark, a move to passage 2, Hind, and size 27. The listening timestamp remained independent and reappeared after reopening. |
| Backup | Export wrote a real JSON file containing both positions, bookmark, and preferences. Selecting that same file opened a replacement preview. Confirming restored the data and left playback paused. Transaction tests cover invalid data and stale writes. |
| Local offline replay | On the preceding build, both complete calibration files were saved. After stopping the local server, a fresh reload opened Settings, navigated to Listen, played from the saved timestamp, sought forward 15 seconds, and paused at roughly 1:15. |
| Window handoff and update | A second tab opened read-only, took ownership on request, and returned the original tab to read-only. Rechecked on the final build. The final worker build loaded after closing the prior client and reopening. |

The checks above cover parts of VP-01, VP-03, VP-09, VP-10, and VP-11. The full release matrix remains open. Use an HTTPS candidate and the physical phone to check Firefox and Chrome tab and available home-screen modes, screen-off audio, part transitions, calls and accessory controls, storage pressure, and update or restore failure recovery. The generated 30-minute PCM fixture is calibration audio. Approved chapter text and narration are still needed for editorial and sustained listening checks. This build reconciles saved media from verified Cache Storage entries and targets one fixture revision. Replacement across real chapter revisions remains untested.
