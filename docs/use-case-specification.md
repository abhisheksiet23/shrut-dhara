# ShrutDhara — use-case specification

Version: draft 0.4 · Date: 2026-11-21 · Platform decision: Angular web app/PWA, Android phones first

Change 2026-11-21: owner authorized implementation of the design-review recommendations. Selected v1 behavior now includes backup before daily use, replace-after-preview restore, one active study window, explicit update preparation/close/reopen, and bounded media retention. App design draft 0.4 owns the mechanisms; [web validation plan](web-validation-plan.md) owns planned fixtures/engineering targets. None of these changes establishes executed proof. Reading gestures, exact source/reviewer selection, and browser/device validation remain open.

Change 2026-11-20: owner confirmed web delivery without an APK or store-publishing dependency (D-02). Android remains the primary device target, rather than a native implementation commitment. Technical proposals and validation gates: [app design](app-design.md). Existing prototype evidence does not establish production readiness.

Change 2026-11-20: owner selected Angular (D-03). Framework-specific architecture and build changes are recorded in app design draft 0.2; use-case behavior and acceptance gates are unchanged.

Depth: Standard for the proposed first increment, with lifecycle/environment gaps retained. Long-term capabilities receive sketches only. Source and rationale: [analysis findings](analysis-findings.md). No software or content has been verified by this specification.

Outcome: a learner can read and hear a reviewed chapter offline, independently resume either journey, and inspect its provenance. “Within seconds,” “exact position,” supported Android versions, and comprehension success have no agreed measurable thresholds yet; see G-01, G-04, G-11.

## Product baseline

Actors: reader/listener; content preparer; qualified reviewer (qualification and assignment unknown). External events: app reopen/process termination, loss of network, audio interruption, media-control input, content replacement, backup restoration.

Entities: collection/Agama/chapter/sutra with authentic references; separately attributable original text, Hindi translation, written explanation, narration script and recording; editorial evidence; local content availability; separate journey positions; bookmarks; chapter completion indicators; prepared listening queue; exported personal state. These are behavioral concepts, not a database schema.

### Shared authoritative rules

| Rule | Required behavior and applicability |
| --- | --- |
| R-01 Authenticity and rights | Published material has identifiable sources, reference/numbering evidence, attribution, redistribution evidence, and applicable review. Unverified material is never authoritative; uncertain rights remain unpublished. Original, translation, interpretation, and illustrative examples remain distinguishable. Source code is open source; original Hindi content should use suitable copyleft terms. Specific licenses and verification authority: G-03. Applies to UC-01/02/06. |
| R-02 Availability | Expose complete, partial, and unavailable content; distinguish original text, translation, explanation, reviewed narration, and locally available audio. A missing component is not fabricated or silently substituted. Online availability and offline availability are separate. Applies to UC-01–06. Exact partial-content entry rules: G-09. |
| R-03 Narration | Explain the chapter in coherent conversational Hindi without reciting original sutras. Cover major teachings and distinctions, acknowledge significant uncertainty, distinguish modern examples, and do not attribute invented events/dialogue to scripture. Duration follows content; long chapters may have consecutive parts. Include source references and clear Hindi pronunciation. Applies to UC-01/04. |
| R-04 Private offline use | No account, registration, ads, subscription, mandatory cloud database, or paid API dependency. Installed reading and audio work offline. Personal state is stored privately. Optional online features cannot prevent offline use. Distribution and privacy details: G-06/G-12. Applies throughout. |
| R-05 Independent preservation | Reading and listening positions remain separate; switching modes does not overwrite the other position. Bookmarks and both journeys survive compatible content expansion. Corrections are traceable. Incompatible reference/recording changes require an explicit preservation policy (G-05). Applies to UC-03/04/06/07. |
| R-06 Safe listening interaction | Prepare listening before driving; no reading content or interactive notifications encouraging visual attention in Driving Mode. No screen interaction is required to continue a valid prepared local queue on supported devices. Handle supported external controls and audio interruptions under a declared policy; unsupported capabilities must be disclosed. Applies to UC-04/05; G-01/G-07 define unresolved boundaries. |
| R-07 Personal backup and restore | Required before first daily-use release. Export both journeys, bookmarks, preferences and selected chapter/part references in supported JSON v1, without content/audio bytes or transient locks/jobs. Restore previews replacement of current personal state and requires explicit confirmation. Cancel/invalid input/failed transaction applies no imported data; preserve current records and legitimate ordinary progress commits. Success replaces the selected personal stores together and remains paused. Preserve unresolved content references without automatic download. Merge and unsupported future versions are not accepted. Applies to UC-07; app design owns schema/protocol. |
| R-08 Single active study window | V1 allows one study owner per origin/browser storage context. Secondary windows may browse the catalog but cannot advance personal journeys, mutate bookmarks/preferences, play, restore, or install/remove content until actual ownership succeeds. Use this window requests cooperative pause/save/handoff. An unresponsive owner leaves the requester read-only with Retry/Cancel/close-other-window recovery; no forced takeover. Applies to UC-03/04/07/09 and content management. |
| R-09 Download retention/removal | Personal references survive removal of downloaded audio. A bookmark does not require retaining old media bytes. Removing playing/prepared media offers Stop and remove or Cancel; do not delete the active source underneath playback. Failed replacement preserves usable old media unless the user explicitly removed it first. Show current saved revision/size and unavailable state after removal. Applies to UC-02/04/06; app design owns cache reconciliation. |
| R-10 User-directed app updates | Updates do not force reload or interrupt active study/driving. Update later leaves current use intact. Prepare update pauses/saves and settles work before safe-close instructions. User closes all ShrutDhara tabs/installed windows and reopens; another open window can leave the new worker waiting. Failed save/Busy offers recovery and never reports safe preparation. Reopen preserves personal state and remains paused. Applies to UC-10; incompatible DB/content versions cannot write until compatible. |

## Coverage index

This is a sparse index, not an implied CRUD baseline. No cloud accounts or in-app editorial CRUD are required.

| Domain | Required operations / coverage |
| --- | --- |
| Collection and references | Browse/direct access UC-02; sequence validation UC-01; source differences UC-01/06; search UC-08 |
| Text and explanations | Publish evidence UC-01; read UC-03; correct UC-06; uncertainty G-03/G-09 |
| Script and audio | Review UC-01; inspect sources UC-02; local playback UC-04; driving UC-05; replacement UC-06 |
| Personal positions and bookmarks | Save/resume UC-03/04; bookmark/revisit UC-03; export/restore UC-07; bookmark removal G-08 |
| Completion, queue, preferences | Status meaning G-08; prepared session UC-05; extended behavior UC-08 |
| Content installation and backup | Local availability UC-02/04; delivery failure G-06; state restore UC-07 |
| Window ownership and app updates | Handoff/read-only secondary state UC-09; safe update preparation and recovery UC-10; R-08/R-10 |

## Selected use cases

Priorities marked Must below follow the BRD initial release unless described as a proposed addition. Draft flows express intended behavior; linked gaps limit readiness. Acceptance statements define future checks, not executed results.

### UC-01 Establish a publishable chapter · Actor: preparer/reviewer · Must prerequisite

Goal: make one authentic, redistributable chapter available for both journeys. Precondition: chapter, edition, and reviewer are selected (G-02/G-03).

**UC-01.M Main:** Preparer identifies original text, reference structure, translation/explanation sources, and rights evidence. Reviewer checks original/reference fidelity and written meaning. Reviewer checks narration against the chapter's major teachings and R-03, then checks the recording against the reviewed script and pronunciation. The released chapter exposes component availability and source/review/correction information under R-01/R-02. This process need not be an app screen.

Done when: the selected chapter's components can each be traced to source, redistribution evidence, and applicable review, and the audio coverage can be assessed against the chapter. The review method and release authority remain blocked by G-03.

**UC-01.A1 Rights uncertain:** the affected material remains unpublished; preparation of other components may continue.

**UC-01.A2 Review finds omissions, uncertainty, or misleading examples:** the affected component is corrected or remains unverified; uncertainty is acknowledged rather than disguised as settled doctrine. Whether unverified components may be visible at all is G-09.

### UC-02 Find available learning material · Actor: learner · Must

Precondition: installed catalog/content exists; catalog scope is G-02/G-06.

**UC-02.M Main:** Learner opens the collection or directly selects an available Agama/chapter. App shows chapter identity, references, component availability, and local audio availability. Learner inspects source information or enters an available journey.

Done when: the selected journey opens the requested content and the learner can distinguish unavailable components from material ready offline.

**UC-02.A1 Requested content missing or partial:** disclose the missing experience before entry; never replace it with fabricated material. Exact permitted partial combinations: G-09.

**UC-02.A2 Selection while offline:** installed components remain accessible; absent local content is clearly identified. Installation/retry behavior: G-06.

### UC-03 Read, resume, and bookmark · Actor: reader · Must

Precondition: selected sutra has publishable reading content under R-01/R-02; device is offline-capable.

**UC-03.M Main:** App opens the saved reading location, or the selected starting reference when no location exists. It displays Agama, chapter/section, authentic reference, original, Hindi meaning, explanation, and attribution. Reader reads the full content, moves forward/backward in canonical order, and bookmarks a sutra. App preserves the reading position. Reader later reopens or revisits the bookmark.

Done when: full content is readable, navigation resolves to the correct adjacent verified reference, the bookmark returns to its sutra, and reopening recovers the agreed reading position without changing listening position. Resume precision and gesture behavior: G-04.

**UC-03.A1 Long sutra or enlarged font:** the entire sutra and explanation remain reachable; scrolling within it must not skip text or unintentionally change sutras. Interaction unresolved in G-04.

**UC-03.A2 Chapter boundary:** continue to the next chapter/Agama when available. A missing or unverified next section is disclosed; it is never silently crossed.

**UC-03.A3 App terminated/reopened:** restore independently saved reading state; persistence timing/loss tolerance requires G-04.

### UC-04 Listen offline and resume · Actor: listener · Must

Precondition: reviewed chapter audio is installed and playable; R-03 evidence exists.

**UC-04.M Main:** Listener selects the chapter and starts narration. App displays title, progress, and approximate remaining duration. Listener pauses, resumes, and seeks forward/backward. App saves listening position. Listener puts the phone away, then returns/reopens and resumes independently of reading state.

Done when: the local narration plays without network or paid service access, controls operate on that narration, and reopening recovers the agreed listening position without changing reading state. Android background coverage is G-01; position tolerance is G-04.

**UC-04.A1 Audio absent locally:** identify unavailable offline playback without pretending playback began; acquisition/recovery belongs to G-06.

**UC-04.A2 Audio corrupted or playback fails:** show that playback cannot continue and do not mark the chapter completed. Repair/redownload and saved-position behavior require G-06/G-08.

**UC-04.A3 Complete playback:** v1 stops at the prepared chapter's end under UC-05 and does not infer chapter-understood/completed status. Later read/listened/both labels remain G-08.

### UC-05 Prepare and use hands-free listening · Actor: listener · Must, support-dependent

Precondition: stopped/pre-drive preparation; supported Android/device route; chosen content is local.

**UC-05.M Main:** Listener chooses the chapter or prepared queue before travel and enters Driving Mode. App presents audio-first controls and resumes the saved listening position. With the screen off/backgrounded, supported Bluetooth/headset/operating-system/steering controls operate playback. The prepared consecutive queue continues without screen selection when enabled.

Done when: the declared supported-device scenarios allow the prepared session to run and respond to supported controls without requiring screen attention. This does not promise every vehicle integration; G-01/G-07 define the testable support boundary.

**UC-05.A1 Call, audio interruption, or route disconnect:** preserve position and remain paused until the user explicitly resumes. Browser enforcement on actual interruptions must pass G-01/G-14; a simulated call button is not sufficient proof.

**UC-05.A2 Missing next part or exhausted chapter:** stop without silent skipping. V1 prepares consecutive parts of one chapter only; there is no cross-chapter autoplay. The user must not need screen interaction to continue between successfully prepared parts. Editable multi-chapter queues remain later scope in G-07/G-10.

**UC-05.A3 Unsupported control/background capability:** limitation is disclosed before relying on that session; fallback behavior must be settled in G-01.

### UC-06 Receive corrected or expanded content · Actor: learner; event: content release · Required product obligation

Precondition: existing reading/listening state and bookmarks.

**UC-06.M Main:** Learner receives available corrected/expanded content through the agreed delivery method. App exposes updated availability and traceable corrections while preserving both journey positions and bookmarks under R-05.

Done when: a previously saved position and bookmark still resolve to their intended content after an additive compatible update, and the correction can be traced to its source/review evidence. Delivery mechanics and failure behavior remain G-06.

**UC-06.A1 References or audio timing changed incompatibly:** do not claim exact preservation without a valid mapping. Migration/notice/restart policy is G-05; this blocks such updates, not preparation of the original chapter.

**UC-06.A2 Update fails partway:** installed usable content and personal state must not be silently replaced by incomplete material. Recovery contract requires G-06.

### UC-07 Export and restore personal state · Actor: learner · Must before first daily-use release

Precondition: local progress/bookmarks exist; no account required.

**UC-07.M Main:** Learner requests export under R-07 and retains the prepared file. Later the learner selects a supported backup. App validates it and previews incoming/existing positions, bookmark counts and unresolved references. Learner confirms replacement or cancels. On confirmation the app pauses/settles current work and replaces the personal state atomically, then reports the committed outcome and stays paused.

Done when: a supported export restores both positions, bookmarks, preferences and selected chapter/part references together, following R-07. Missing/incompatible content follows A2 rather than dropping references or inventing a timestamp mapping. The app reports export prepared, not that the user necessarily retained the file successfully.

**UC-07.A1 Invalid/unsupported backup or failed restore transaction:** report the failure and allow another file/retry; no imported state is applied. Preserve current personal records, including legitimate checkpoints committed during pause/drain before the restore transaction. A pre-restore pause may already have occurred, and the app does not automatically restart playback.

**UC-07.A2 Existing local state or absent/incompatible content:** require replace confirmation; Cancel applies no backup data or maintenance pause. Normal ongoing study may still save its own progress while the preview is open. Preserve unresolved IDs/revision/display snapshots, label the missing content, and do not download automatically. A replaced recording never inherits an old timestamp without an accepted mapping (G-05). Merge is deferred.

**UC-07.A3 Another active study window owns the session:** follow UC-09 before restoration. Busy/failed handoff changes no personal records.

### UC-08 Deferred learning conveniences · Actor: learner · Long-term scope sketch

Learner searches by text/topic/Agama/chapter/reference, adjusts fonts/themes/component visibility, reflects after a chapter, changes speed, chooses previous/next chapters, manages a queue/autoplay, and sets a sleep timer. Outcomes: relevant installed material is findable; presentation remains readable; listening follows explicit user choices. Detailed behavior, offline search boundaries, completion semantics, and release allocation are G-08/G-10. Reflection does not imply private notes. Optional reliable voice commands remain optional.

### UC-09 Continue in another window · Actor: learner · Must web recovery behavior

Precondition: another tab/installed window owns the study session; this window can only browse the catalog (R-08).

**UC-09.M Main:** Learner chooses Use this window. Existing owner pauses, saves and settles work, then releases ownership. Requester acquires ownership and loads the committed state. It enables study controls and remains paused until explicit Play.

Done when: only the new window can write/play, both journeys/bookmarks reflect committed state, and no simultaneous player or stale writer remains.

**UC-09.A1 Owner unresponsive or preparation fails:** requester remains read-only and offers Retry/Cancel plus close-other-window guidance. It does not force the old player to stop or steal ownership. After actual owner termination, a new acquisition attempt may succeed.

**UC-09.A2 Restore/update preparation is in progress:** return Busy with Retry/Cancel, preserving the current operation and all personal records.

### UC-10 Prepare an application update · Actor: learner · Must before daily-use release

Precondition: a compatible new app version is waiting; current content and personal state are usable.

**UC-10.M Main:** App indicates an update without interrupting study. Learner selects Prepare update in the owning window. App pauses/saves and settles work under R-10, then instructs the learner to close all ShrutDhara tabs/installed windows and reopen. Reopened compatible version loads preserved state and remains paused.

Done when: the new compatible version loads with retained journeys/bookmarks/preferences after safe preparation and browser-controlled activation.

**UC-10.A1 Update later:** current version and playback remain usable; no reload is forced.

**UC-10.A2 Other window remains open/suspended:** update may remain waiting. Show close-other-windows instructions; the user may cancel preparation and explicitly resume the old version after ownership is reacquired.

**UC-10.A3 Save/upgrade failure or another maintenance operation:** do not report safe preparation/success. Offer Retry/Cancel or compatible-version recovery without deleting personal records. Never reload a committing restore transaction.

## Quality and constraint verification obligations

| Item | Applicability and future evidence required |
| --- | --- |
| Q-01 Readability/accessibility | UC-02/03/05: check full Hindi/Prakrit rendering, increased font sizes, navigation, and screen-reader behavior on selected devices. Formal target and supported text forms are G-01/G-04/G-11. |
| Q-02 Offline/privacy | UC-02–07: exercise installed journeys with network unavailable; inspect required network dependencies and personal-state handling. Backup is user-requested export, not implicit cloud sync. Privacy contract G-12. |
| Q-03 Audio continuity | UC-04/05: real-device screen-off/background, reopen, calls, routing changes, and supported media controls. Expected results require G-01/G-04/G-07 before claiming success. |
| Q-04 Preservation/recovery | UC-03/04/06/07: use known saved references/timestamps/bookmarks across termination, additive update, incompatible update, and restore. Exact oracle depends on G-04/G-05/G-12. |
| C-01 Publication integrity | UC-01/06: inspect component provenance, documented rights, review, source differences, corrections, and redistributed notices. G-02/G-03 are publication gates. |
| Q-05 Meaningful understanding | UC-01/03/04: proposed beginner evaluation of explanation clarity and major-teaching comprehension; participant definition and acceptance method G-11. No arbitrary duration or engagement target is accepted. |

## Gap and decision register

Single authoritative register. Owner is the product owner unless a reviewer/specialist is named later. H blocks named Must behavior or publication; M changes scope/rules/acceptance. Open proposals are not permission to implement.

| ID / severity | Question and origin | Affected work / recommended resolution | Standing |
| --- | --- | --- | --- |
| D-01 | First platform, environment | Android phones first; owner reply 2026-11-20 | Confirmed |
| D-02 | Delivery platform, owner correction 2026-11-20 | Web app/PWA; no APK, unknown-source installation step, or app-store publication dependency. D-01 continues to identify the primary devices | Confirmed |
| D-03 | Frontend framework, owner instruction 2026-11-20 | Angular replaces the React proposal. See app-design.md for standalone components, signals, service ownership, and custom service-worker/build integration | Confirmed |
| D-04 | Review changes authorized, owner instruction 2026-11-21 | Implement review recommendations in the design. R-07–10 and app design 0.4 record selected v1 defaults; numeric validation targets are engineering baselines, not observed capability or a release guarantee | Authorized revision; implementation defaults selected |
| D-05 | Hosting arrangement, Vercel discussion and follow-up 2026-11-21 | Vercel static deployment target with versioned content JSON/initial audio; private progress stays browser-local. No server database or paid object store required for v1 | Selected target; no deployment executed |
| G-01 / H | Which exact Android phone/browser versions pass the selected candidate matrix? BRD §§4,8; environment/quality | UC-04/05, Q-01/03: Firefox Android is primary on the owner's CMF Phone 1. Chrome Android is also required. Record exact versions, available install modes, and results from the physical-device matrix before declaring support | Primary phone and browser targets selected; device evidence open |
| G-02 / H | Which complete first chapter, edition, canonical ordering, and reference scheme? BRD §§2,11; data/rules | Owner selected Ācārāṅga Sūtra, first श्रुतस्कन्ध, first अध्ययन **शस्त्रपरिज्ञा**, all seven उद्देशक in source order, for both journeys. Preserve the selected edition's numbering and map the audio to those sections. [Source review](analysis-findings.md#first-chapter-source-review--2026-11-21) | Chapter scope selected; exact edition and reference mapping open |
| G-03 / H | Who verifies each component, using which review evidence, and what exact licenses/permissions apply? BRD §§6–7; rules/compliance | UC-01, C-01: name qualified review responsibility; establish source/rights and chapter-coverage review before publication. No license status assumed | Open publication gate |
| G-04 / H | What means exact reading/audio resume; how do within-sutra scrolling and swipe navigation coexist; when is progress saved? BRD §§3–5,12; UX/data/quality | UC-03/04: choose behavior for long text, reopen, seek, and termination with measurable tolerance; prototype the gesture interaction | Open |
| G-05 / H for incompatible update; M now | How are edition, numbering, split/merge, and revised-audio positions mapped? BRD §§2,5,8; data/lifecycle | UC-06/07: define identity/preservation guarantees and user-visible unresolved mapping behavior before incompatible releases | Open future dependency |
| G-06 / H for installation proof | Are independent reading/audio acquisition, bounded retention, retry, quota and update recovery implemented correctly? BRD §§8–9; lifecycle | UC-02/04/06/10: app design 0.4 selects static releases, per-experience readiness, explicit media removal/replacement and simple worker updates. VP-01/07/11/12 must pass; incompatible releases remain G-05 | V1 contract selected; execution/size evidence open |
| G-07 / M for later queues | How should later editable multi-chapter queues cross acknowledged gaps? BRD §§3–4; events/rules | V1 UC-05 stops at missing parts/chapter end and remains paused after interruption/disconnect. No silent skip or cross-chapter autoplay. Browser enforcement is G-01/G-14; later queue behavior remains deferred | V1 selected; later queue policy open |
| G-08 / M | What marks read/listened/completed, and how do replay, seek, bookmark removal, and manual changes behave? BRD §§3,5; data/rules | UC-03/04/08: define labels without implying comprehension from a final position | Open |
| G-09 / H for partial entry | May reviewed original text be read without reviewed translation/explanation; may unverified drafts appear? BRD §§3,6,9,11; rules/access | UC-01/02/03: recommend publishing only reviewed experience components with explicit absent-component labels; determine valid entry combinations | Proposal, not accepted |
| G-10 / M | What do later topic search, completion labels and extended queue/reflection features mean? BRD §§3–4,11; scope | App design 0.4 fixes first-release scope. Fonts/themes/component visibility and rate controls are included; editable multi-chapter queues/topic search/completion judgments/sleep timer remain deferred without deleting long-term obligations | V1 scope selected; later detail open |
| G-11 / M | What counts as fast opening, readable/accessible, and beginner understanding? BRD §§10,12; quality | Q-01/05: choose measurement context and acceptance method; avoid invented thresholds | Open |
| G-12 / H for restore proof | Does selected JSON v1 replace-after-preview restore preserve state on every failure? BRD §8; data/lifecycle | R-07/UC-07 and app design 0.4 define included data, cancellation, unresolved references and atomicity. VP-09 validates them. Merge is deferred; no cloud sync assumed | V1 decision resolved; execution open |
| G-13 / H for ownership proof | Does the coarse single-study-owner protocol prevent stale writes/deadlock and provide recoverable handoff? Identified during web design; concurrency/data | R-08/UC-09 and app design 0.4 specify one owner, read-only secondary windows, no forced takeover, serialized maintenance and Retry/Cancel recovery. VP-10 must pass | V1 decision resolved; execution open |
| G-14 / H for web listening claim | What browser suspension/termination, storage eviction, offline preparation, and timer limitations are acceptable within the web-only boundary? D-02 versus BRD §§4,8,12; environment/lifecycle | UC-04/05/07: run the web capability gate in app-design.md. Web delivery does not accept a weaker listening guarantee by implication | Open validation/acceptance gate |

## Flow tracking and handoff

The table records release standing. The local Angular development build exercises several flows with fixtures. Release verification remains subject to the content and device gates. “Draft” indicates consequential decisions remain. “Identified” indicates only an outline exists.

| Flow | Priority | Status / blocking gaps |
| --- | --- | --- |
| UC-01.M, UC-01.A1, UC-01.A2 | Must prerequisite | Draft; G-02/G-03/G-09 |
| UC-02.M, UC-02.A1, UC-02.A2 | Must | Draft; G-02/G-06/G-09 |
| UC-03.M, UC-03.A1, UC-03.A2, UC-03.A3 | Must | Draft; G-02/G-04/G-09 |
| UC-04.M, UC-04.A1, UC-04.A2, UC-04.A3 | Must | Draft; G-01/G-04/G-06/G-08 |
| UC-05.M, UC-05.A1, UC-05.A2, UC-05.A3 | Must | Draft; G-01/G-07 |
| UC-06.M, UC-06.A1, UC-06.A2 | Required before applicable updates | Draft; G-05/G-06 |
| UC-07.M, UC-07.A1, UC-07.A2, UC-07.A3 | Must before daily use | Local export and restore implemented. Full G-05/G-12 execution pending. |
| UC-09.M, UC-09.A1, UC-09.A2 | Must web recovery | Local single-owner flow implemented. Full G-13 execution pending. |
| UC-10.M, UC-10.A1, UC-10.A2, UC-10.A3 | Must before daily use | Fixture saving, cache checks and removal implemented. Full G-06 execution pending. |
| UC-08 | Long-term; allocation open | Identified; G-08/G-10 |
| Q-01 | Required readability; accessibility target open | Draft; G-01/G-04/G-11 |
| Q-02 | Must offline/privacy | Draft; G-06/G-12 |
| Q-03 | Must on supported devices | Draft; G-01/G-04/G-07 |
| Q-04 | Required preservation/recovery | Draft; G-04/G-05/G-12 |
| C-01 | Must publication constraint | Draft; G-02/G-03 |
| Q-05 | Required clarity; evaluation proposed | Draft; G-11 |

Self-review covered actors/goals, events, data, and rules, plus known Android, publication, offline, update, and backup obligations. No independent review, device tests, rights verification, content validation, or comprehension study was executed. Ready now: targeted content investigation and UX exploration against these rules. Production handoff remains conditional on the named gaps; incompatible-update decisions do not block independent reader/audio exploration.
