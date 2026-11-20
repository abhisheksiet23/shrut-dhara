# ShrutDhara — use-case specification

Version: draft 0.3 · Date: 2026-11-20 · Platform decision: Angular web app/PWA, Android phones first

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

**UC-04.A3 Complete playback:** read/listened/both status follows G-08; end-of-queue/autoplay behavior follows UC-05.

### UC-05 Prepare and use hands-free listening · Actor: listener · Must, support-dependent

Precondition: stopped/pre-drive preparation; supported Android/device route; chosen content is local.

**UC-05.M Main:** Listener chooses the chapter or prepared queue before travel and enters Driving Mode. App presents audio-first controls and resumes the saved listening position. With the screen off/backgrounded, supported Bluetooth/headset/operating-system/steering controls operate playback. The prepared consecutive queue continues without screen selection when enabled.

Done when: the declared supported-device scenarios allow the prepared session to run and respond to supported controls without requiring screen attention. This does not promise every vehicle integration; G-01/G-07 define the testable support boundary.

**UC-05.A1 Call, audio interruption, or route disconnect:** respect the agreed interruption/resumption policy while preserving position. Auto-resume versus remaining paused is unresolved G-07; never infer that all interruptions allow automatic resume.

**UC-05.A2 Missing next chapter or exhausted queue:** no fabricated content or silent gap crossing; stopping/announcing/skipping rules require G-07. The user must not need screen interaction while driving.

**UC-05.A3 Unsupported control/background capability:** limitation is disclosed before relying on that session; fallback behavior must be settled in G-01.

### UC-06 Receive corrected or expanded content · Actor: learner; event: content release · Required product obligation

Precondition: existing reading/listening state and bookmarks.

**UC-06.M Main:** Learner receives available corrected/expanded content through the agreed delivery method. App exposes updated availability and traceable corrections while preserving both journey positions and bookmarks under R-05.

Done when: a previously saved position and bookmark still resolve to their intended content after an additive compatible update, and the correction can be traced to its source/review evidence. Delivery mechanics and failure behavior remain G-06.

**UC-06.A1 References or audio timing changed incompatibly:** do not claim exact preservation without a valid mapping. Migration/notice/restart policy is G-05; this blocks such updates, not preparation of the original chapter.

**UC-06.A2 Update fails partway:** installed usable content and personal state must not be silently replaced by incomplete material. Recovery contract requires G-06.

### UC-07 Export and restore personal state · Actor: learner · Required; first-release inclusion proposed

Precondition: local progress/bookmarks exist; no account required.

**UC-07.M Main:** Learner requests export of reading/listening state and bookmarks, retains the export, then selects it for restoration. App validates it and reports the outcome. Restored references resolve independently in both journeys.

Done when: a supported export restores both positions and bookmarks to the intended references. Format compatibility, privacy, conflict policy, and missing-content treatment remain G-05/G-12.

**UC-07.A1 Invalid/incompatible backup:** report inability to restore; do not claim success. Whether any state may be changed during failure must be decided in G-12.

**UC-07.A2 Existing local state or absent content:** merge/replace behavior and unresolved-reference recovery are G-12; no default is accepted here.

### UC-08 Deferred learning conveniences · Actor: learner · Long-term scope sketch

Learner searches by text/topic/Agama/chapter/reference, adjusts fonts/themes/component visibility, reflects after a chapter, changes speed, chooses previous/next chapters, manages a queue/autoplay, and sets a sleep timer. Outcomes: relevant installed material is findable; presentation remains readable; listening follows explicit user choices. Detailed behavior, offline search boundaries, completion semantics, and release allocation are G-08/G-10. Reflection does not imply private notes. Optional reliable voice commands remain optional.

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
| G-01 / H | Which Android browsers/versions/devices must support offline installation, background listening, and external media controls? BRD §§4,8; environment/quality | UC-04/05, Q-01/03: declare a supported browser/device range and verify actual background behavior in tab and installed modes. Web delivery is settled by D-02; guarantees remain open | Open |
| G-02 / H | Which complete first chapter, edition, canonical ordering, and reference scheme? BRD §§2,11; data/rules | UC-01–03: recommend one complete chapter shared by both journeys; obtain authoritative sources and record textual differences. Confirm first-release scope separately | Proposed boundary; sources open |
| G-03 / H | Who verifies each component, using which review evidence, and what exact licenses/permissions apply? BRD §§6–7; rules/compliance | UC-01, C-01: name qualified review responsibility; establish source/rights and chapter-coverage review before publication. No license status assumed | Open publication gate |
| G-04 / H | What means exact reading/audio resume; how do within-sutra scrolling and swipe navigation coexist; when is progress saved? BRD §§3–5,12; UX/data/quality | UC-03/04: choose behavior for long text, reopen, seek, and termination with measurable tolerance; prototype the gesture interaction | Open |
| G-05 / H for incompatible update; M now | How are edition, numbering, split/merge, and revised-audio positions mapped? BRD §§2,5,8; data/lifecycle | UC-06/07: define identity/preservation guarantees and user-visible unresolved mapping behavior before incompatible releases | Open future dependency |
| G-06 / H for install/update | What ships installed; how are optional downloads distributed, retried, checked, removed, and recovered under low storage? BRD §§8–9; lifecycle | UC-02/04/06: preserve usable installed content and personal state; clarify ongoing production/distribution costs separately from runtime dependencies | Open |
| G-07 / H | What happens at content gaps, queue end, calls, disconnects, and resumable interruptions? BRD §§3–4; events/rules | UC-05: recommend prepared local sessions with missing items disclosed before travel; settle whether explicitly acknowledged gaps may be crossed and when audio resumes | Proposal, not accepted |
| G-08 / M | What marks read/listened/completed, and how do replay, seek, bookmark removal, and manual changes behave? BRD §§3,5; data/rules | UC-03/04/08: define labels without implying comprehension from a final position | Open |
| G-09 / H for partial entry | May reviewed original text be read without reviewed translation/explanation; may unverified drafts appear? BRD §§3,6,9,11; rules/access | UC-01/02/03: recommend publishing only reviewed experience components with explicit absent-component labels; determine valid entry combinations | Proposal, not accepted |
| G-10 / M | Which convenience capabilities belong in v1 and what do topic search/reflection mean? BRD §§3–4,11; scope | UC-08: defer detailed specification until release allocation is confirmed; retain all BRD obligations | Open |
| G-11 / M | What counts as fast opening, readable/accessible, and beginner understanding? BRD §§10,12; quality | Q-01/05: choose measurement context and acceptance method; avoid invented thresholds | Open |
| G-12 / H for restore; M otherwise | Export format, compatibility, merge/replace, missing content, failure preservation, privacy, and diagnostics? BRD §8; data/lifecycle | UC-07, Q-02/04: settle restore outcomes and private-state handling before implementing restore; no cloud sync assumed | Open |
| G-13 / M | How should simultaneous browser tabs and an installed PWA share playback, reading position, and restore ownership? Identified during web design; concurrency/data | UC-03/04/07: technical ownership and restore-epoch safeguards are proposed in app-design.md; explicit user-facing handoff policy needs confirmation | Open web-specific behavior |
| G-14 / H for web listening claim | What browser suspension/termination, storage eviction, offline preparation, and timer limitations are acceptable within the web-only boundary? D-02 versus BRD §§4,8,12; environment/lifecycle | UC-04/05/07: run the web capability gate in app-design.md. Web delivery does not accept a weaker listening guarantee by implication | Open validation/acceptance gate |

## Flow tracking and handoff

No flow is Built or Verified. “Draft” below means detailed intended behavior exists but consequential decisions remain; “Identified” means only an outline exists. Must priorities derive from the BRD's initial release; other release allocations are explicitly provisional.

| Flow | Priority | Status / blocking gaps |
| --- | --- | --- |
| UC-01.M, UC-01.A1, UC-01.A2 | Must prerequisite | Draft; G-02/G-03/G-09 |
| UC-02.M, UC-02.A1, UC-02.A2 | Must | Draft; G-02/G-06/G-09 |
| UC-03.M, UC-03.A1, UC-03.A2, UC-03.A3 | Must | Draft; G-02/G-04/G-09 |
| UC-04.M, UC-04.A1, UC-04.A2, UC-04.A3 | Must | Draft; G-01/G-04/G-06/G-08 |
| UC-05.M, UC-05.A1, UC-05.A2, UC-05.A3 | Must | Draft; G-01/G-07 |
| UC-06.M, UC-06.A1, UC-06.A2 | Required before applicable updates | Draft; G-05/G-06 |
| UC-07.M, UC-07.A1, UC-07.A2 | Required; v1 proposed | Draft; G-05/G-12 |
| UC-08 | Long-term; allocation open | Identified; G-08/G-10 |
| Q-01 | Required readability; accessibility target open | Draft; G-01/G-04/G-11 |
| Q-02 | Must offline/privacy | Draft; G-06/G-12 |
| Q-03 | Must on supported devices | Draft; G-01/G-04/G-07 |
| Q-04 | Required preservation/recovery | Draft; G-04/G-05/G-12 |
| C-01 | Must publication constraint | Draft; G-02/G-03 |
| Q-05 | Required clarity; evaluation proposed | Draft; G-11 |

Self-review covered actors/goals, events, data, and rules, plus known Android, publication, offline, update, and backup obligations. No independent review, device tests, rights verification, content validation, or comprehension study was executed. Ready now: targeted content investigation and UX exploration against these rules. Production handoff remains conditional on the named gaps; incompatible-update decisions do not block independent reader/audio exploration.
