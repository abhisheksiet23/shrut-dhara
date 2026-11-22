# Sutra-centred experience: proposed behaviour and next tasks

Implementation follow-up, 22 November 2026: owner subsequently authorized app changes and delegated detailed UX/object design. The initial software slice and first-uddeshaka review sample are implemented locally; [implementation design](sutra-journey-design.md) and [verification report](implementation-checks.md) own current status. Full-chapter editorial production, sample acceptance, real-phone checks and deployment remain outstanding. The original planning boundary below is historical.

22 November 2026 · Planning only · [Journey map and evidence](user-journey-review-2026-11-22.md)

## Outcome and authority

Accepted owner direction: Hindi meaning in audio, sutra by sutra; discontinue the storified treatment as the main learning content. Initial scope remains शस्त्रपरिज्ञा, all seven उद्देशक, with complete source-unit coverage. This plan refines UC-01–06 and UC-08; existing backup, ownership, update, offline and publication obligations continue. No application changes or deployment are authorized by this document.

Proposed target route:

```text
Home: Continue reading / Continue listening (each with its own saved reference)
  Library → Agama → study contents → uddeshaka → selected sutra
    Read: source text + Hindi meaning → Listen here
    Listen: current sutra + Hindi meaning → Read this sutra
    Previous sutra | Replay current | Next sutra
    Contents returns to the same study and list position
```

Reading and listening use the same source identifiers, but keep independent saved positions. A cross-mode action is deliberate navigation to the selected reference; merely browsing another mode does not overwrite its checkpoint.

## Proposed shared rules

- **SJ-R1 Fidelity:** each source sutra has a traceable original and Hindi meaning, in the chosen edition's order. No omission, duplication, invented linking story or thematic reorder. Preserve source distinctions and explain edition differences. UI sample reflections and chapter introductions are not substitutes.
- **SJ-R2 Audio:** speak an intelligible sutra reference and its reviewed Hindi meaning. Use natural pauses and consistent terminology. Do not generate the entire chapter until a small representative sample has passed meaning/pronunciation review. Original Prakrit recitation remains decision SJ-G2.
- **SJ-R3 Orientation:** chapter, uddeshaka and current sutra stay discoverable. Clearly distinguish replay current sutra, previous/next sutra, ±15-second seek, contents/parent and browser Back. Exact labels/layout require prototype validation.
- **SJ-R4 Progress:** preserve independent mode checkpoints. Explicit Play or Listen here may change the listening checkpoint; opening a transcript or browsing contents does not. Opening a reader destination explicitly changes reading location. Cross-mode navigation never implies comprehension/completion.
- **SJ-R5 Boundaries:** never skip missing meaning/audio silently. Explain the missing component and offer available actions. At the chapter end, stop; continuous per-sutra playback within prepared available content is proposed. Do not introduce cross-chapter autoplay.
- **SJ-R6 Versions:** do not apply old narration timestamps to a changed recording without a valid reviewed mapping. Keep unresolved old state recoverable; explain the available restart/mapped destination rather than inventing exact resume.
- **SJ-R7 Readiness:** distinguish introduction, draft meaning, reviewed meaning, audio availability and offline saved state. Source/review/rights information remains accessible without dominating every learning step.

## Selected use cases and observable acceptance

All flows below are **proposed**, not built or verified against this plan.

| Flow | Starting condition and actions | Done when / important alternatives |
| --- | --- | --- |
| SJ-01 Choose a sutra (UC-02) | Learner enters a study's contents, sees source-order uddeshakas/sutras and available components, selects one | Exact selected reference opens; introduction-only/unavailable items do not masquerade as full meanings. Returning to contents preserves selected study, expansion and scroll |
| SJ-02 Listen and revisit (UC-04) | Meaning audio is available; learner starts selected sutra, replays, moves previous/next, then pauses | Audible meaning and displayed reference agree. Replay begins current meaning; previous/next selects adjacent source units. First/last/missing boundaries are explicit under SJ-R5. Paused content does not restart solely because of browsing |
| SJ-03 Read ↔ listen (UC-03/04) | Both components exist; listener chooses Read this sutra; reader chooses Listen here | Destination is the exact corresponding sutra. Existing listening continues or pauses according to settled SJ-G3; one player remains. Browsing alone leaves the other mode's checkpoint intact. Missing counterpart is explained with no unrelated fallback |
| SJ-04 Leave and return (UC-03/04) | Learner scrolls a long meaning, browses elsewhere, uses mini-player, parent and browser Back, then reopens app | Mode reference remains correct; agreed scroll/audio precision is met (SJ-G4). Mini-player returns to the active audio unit. Back does not secretly advance a sutra. Phone overlays do not cover active controls or text |
| SJ-05 Bookmark from either mode (UC-03/08) | Sutra has a stable source identity; learner saves and later opens it | Bookmark identifies chapter/uddeshaka/sutra, offers each available mode and resolves the same source unit. Repeated save does not duplicate it; incompatible/missing references stay visible and recoverable |
| SJ-06 Prepare offline (UC-04/05) | Selected chapter has reviewed audio; learner saves, then loses network | Saved readiness reflects complete usable files; selected meaning, replay, adjacent transitions and resume work offline. Interrupted/corrupt/partial saves remain honest and retryable; no silent skip. Driving claims require real phone evidence |
| SJ-07 Replace old narration (UC-06/07/10) | Existing seven-section progress/bookmarks or backup exist; corrected content arrives | Compatible references remain; changed timestamps are migrated only with accepted mapping, otherwise explained under SJ-R6. Old state is not silently erased. Restore and cached-app activation are tested with both old and new versions |

## Decisions and dependencies

This table owns the new open questions; the main specification remains authoritative for its existing G-01–14 gaps.

| Ref | Standing / question | Proposed resolution and affected work |
| --- | --- | --- |
| SJ-D1 | Confirmed by owner, 22 Nov: sutra-by-sutra Hindi meaning replaces storification | Applies to all new scripts/audio and acceptance; supersedes connected-chapter narration preference |
| SJ-G1 / high | Exact source edition, unit boundaries, numbering, redistribution evidence and qualified reviewer remain open (existing G-02/03) | Establish source ledger before claiming complete coverage or producing final recordings. Begin one uddeshaka/sample without guessing total sutra count |
| SJ-G2 / medium | Should audio also recite original Prakrit? | Recommend Hindi meaning as default, spoken reference included; original recitation optional later. Does not block mapping/meaning preparation |
| SJ-G3 / medium | When opening Read this sutra during audio, continue playback? | Recommend continue with mini-player; explicit mode navigation alone does not seek/pause audio. Prototype this with the owner before implementation |
| SJ-G4 / high for verification | Exact resume tolerance and long-text scroll recovery (existing G-04) | Define measurable candidate-specific tolerances before implementing/verifying preservation; do not invent a precision claim |
| SJ-G5 / high for replacement | Old section ranges may map only to a group, not a single sutra | Inventory old IDs/timestamps; propose mapped uddeshaka start with explicit notice only if mapping supports it, otherwise offer restart while retaining old state. Owner review before irreversible migration |
| SJ-G6 / medium | Continuous sequence or pause after every meaning? | Recommend continuous source-order playback with explicit replay/adjacent controls; optional pause-per-sutra can follow demonstrated need. Prototype first |

## Ordered backlog

Priorities and sequencing are recommendations. No duration/cost forecast is asserted without source-review and production throughput evidence. UX work can proceed beside editorial work, but production audio depends on reviewed script and references.

| Order / priority | Concrete task and output | Dependency / completion evidence |
| --- | --- | --- |
| 1 / P0 | Reconcile accepted product records: replace connected-narration preference, update UC-01/03/04 and content acceptance; link this decision from narration brief and current status | Planning review; records clearly distinguish superseded content and historical QA. Do before implementation so another agent cannot resume the rejected direction |
| 2 / P0 | Select edition and create source ledger: chapter → uddeshaka → sutra ID, original, Hindi meaning, provenance/rights/review status | SJ-G1; exact source boundaries and numbering, no assumed total count, all seven uddeshakas inventoried |
| 3 / P0 | Audit current script, seven tracks, 24 introductions and reader fixture against ledger | Mark each as retain-as-introduction, rewrite, replace or unavailable. Do not relabel commentary as translation. Produce per-sutra omission/addition checklist |
| 4 / P0 | Prepare a representative small set of consecutive sutra meanings and audio samples, including a difficult/long unit | 2; reviewer checks original-to-meaning fidelity, terms and spoken reference; owner listens for pacing and approves treatment before full generation |
| 5 / P1 | Prototype shared chapter contents and Read/Listen bridge, phone first | Can start beside 2–4 using labelled placeholders. Demonstrate Home resume, exact selection, replay/adjacent movement, parent/history return, mini-player, bookmark and missing-content states. Settle SJ-G2/3/6 |
| 6 / P1 | Design content/audio identity and migration contract, plus failure states | 2 and accepted interaction sample; choose implementation mechanism separately. Specify timing/segment lookup, revision changes, old progress/backup and unavailable references; settle SJ-G4/5 |
| 7 / P1 | Implement one complete uddeshaka as a vertical slice, after implementation authorization | 4–6; replace fixture path for selected real units, integrate with existing player rather than discarding shared-player improvements; prove SJ-01–05 and version behaviour for slice |
| 8 / P1 | Produce/review remaining chapter meanings and recordings; build full coverage manifest | Accepted sample and ledger; each source unit has reviewer result and matching text/audio reference; boundaries checked by ear; no file-generation count used as fidelity proof |
| 9 / P1 | Integrate complete chapter, availability and offline preparation; reconcile catalogue introductions | 7–8; complete SJ-01–07. Chapter end stops, missing units disclosed, introduction players have explicit scope and consistent ownership |
| 10 / P1 | Diagnose cached-old-app journey and verify safe update/restore | Reproduce the observed old→new experience using known saved state; inspect activation and stale clients. Do not clear user storage as a default fix. Test corrected recording migration and old backups |
| 11 / P1 | Run phone and accessibility journey validation | Current chapter candidate; Firefox and Chrome on owner's CMF Phone 1, exact versions recorded. Screen-off, lock screen/headset, calls/disconnect, offline reopen, interrupted downloads, large Hindi text, focus/history and sticky controls |
| 12 / P1 | Observe owner/intended learners doing goal tasks; update journey map with actual feelings and friction | Candidate/prototype; ask them to find a sutra, hear meaning, replay prior unit, read same unit, return to contents and resume next day. Record actions/confusion and comments without inferring understanding from playback completion |
| 13 / P2 | Prepare release, correction notices and next-chapter intake | Fidelity, preservation, offline/device and journey acceptance met; deploy only when authorized. Expand beyond first chapter using proven process; retain 24 introductions as clearly labelled discovery material |

## Verification plan and later scope

Build success from this review is not acceptance of any new flow. Future automated checks should cover source order/coverage, exact text–audio mapping, adjacent/replay boundaries, independent checkpoints, deep links/history and incompatible revision recovery. Real browser checks must cover the combined journey, not isolated player controls. Editorial listening checks prove content separately from software tests.

Defer new Agamas, mass audio generation, decorative redesign, expanded queues, topic search, sleep timer, completion gamification and extra commentary until the first faithful chapter and navigation journey work. Existing backup, privacy, offline, session ownership and device obligations remain; deferral does not erase them.

Next useful work: reconcile requirements and establish the source ledger plus a reviewed sutra-level sample; in parallel, prototype the shared study journey. This document is a reviewable plan, not authorization to implement or publish.
