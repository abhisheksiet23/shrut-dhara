# Sutra-centred journey review

22 November 2026 · Analysis and planning only · [Proposed behaviour and tasks](sutra-journey-change-plan.md)

## Direction accepted from the owner

Audio must give the Hindi meaning **sutra by sutra, in source order**. The storified shastra direction is rejected. This supersedes the earlier preference for a connected chapter explanation in the analysis findings and narration brief. Natural spoken Hindi is still appropriate; invented stories, thematic rearrangement, reflective prompts and chapter summaries cannot replace a sutra's meaning. Whether the original Prakrit is also spoken is an open choice, not implied by this decision.

The desired experience is: “I know which sutra I am studying, can understand its Hindi meaning, hear it again, move backward or forward, and return without losing my place.”

## Evidence and limits

- Reviewed the last three commits: `f71ccb2` (English chrome, icons, accessibility and listening E2E), `f93db4a` (Claude shared-player integration, seven narration sections and offline support), `d91e69d` (catalogue/narration QA records).
- Starting working tree had changes to `docs/implementation-checks.md` and the narration manifest. They were left intact. No application source was edited, committed or deployed.
- Used the public app in the desktop in-app browser, including a 390 × 844 phone viewport. Exercised collection → chapter → listening, playback, section selection, Home, reader, mini-player return, transcript expansion and browser Back. Existing profile had sample progress; this was not a clean first-use test.
- Initially an older cached app appeared: Hindi chrome, separate native narration player and calibration Listen page. Closing and reopening the public app exposed the current English-chrome shared-player experience. This is observed update friction, not proof that the current deployment lacks the shared player. The exact service-worker cause was not diagnosed.
- Rebuilt local production assets successfully (`main-2YNTDSU2.js`). The browser's localhost:4174 showed an older app; a fresh :4188 origin timed out. Local serving was therefore not accepted as current browser evidence. Current public behaviour and repository inspection are the evidence below.
- Source inspection: `pages/reader.ts`, `pages/listen.ts`, `pages/acharanga.ts`, `pages/bookmarks.ts`, `app.html`, routes, narration script/brief and coverage records. No independent scripture verification or source-site research was performed.
- Playback reached “Playing · streaming” for section 2, then paused around 0:06. Home showed the same section/time and the mini-player returned to it. This verifies controls/state, not pronunciation, doctrinal fidelity or listening comprehension. No real Android, screen-off, offline, interruption, backup or update recovery test was executed in this review.

## Journey map: current experience

Feelings and first-person thoughts below are **design hypotheses inferred from friction**, not measured user testimony. The owner's dissatisfaction with storification and navigation is direct feedback. Rows describing source-only behaviour are explicitly marked.

| Step and goal | Current touchpoint / evidence | Likely thought and feeling | Friction / consequence | Proposed experience |
| --- | --- | --- | --- | --- |
| 1. Open for a few minutes of study | Current Home offers separate Listen and Reading preview cards; older cached version appeared first | “Is this the same app I used?” Uncertainty, followed by relief at a clear resume card | App versions can present materially different journeys; reading is still a preview | Predictable Home with exact saved reference, clear content readiness and safe update guidance |
| 2. Find the shastra | Library → Acharanga → expand study; 24 studies are introductions, not 24 full Hindi meanings | “There is plenty here—but what can I actually study?” Interest becoming doubt | Catalogue breadth and learning depth differ; fixture reading lives on a separate path | One hierarchy: Agama → shrutaskandha → study → uddeshaka → sutra, with separate text/audio readiness |
| 3. Choose where to begin | First-study catalogue link leads to Listen; other studies have short introductory audio (current source; catalogue structure also observed in older UI) | “Will this play the introduction or the actual teaching?” Hesitation | Different playback contracts behind similar chapter choices | Explicit “Introduction”, “Hindi meaning”, and unavailable states; consistent chapter workspace |
| 4. Start listening | Current Listen has seven sections, range references such as 1.2.1–6 and streaming/offline labels | “It plays, but which exact sutra am I hearing?” Initially reassured, then unsure | An uddeshaka track groups several sutras; no individual sutra selection | Show and announce the current sutra reference with its Hindi meaning |
| 5. Understand faithfully | Script is a connected explanation; first heading “मैं अपने कर्म में कहाँ हूँ?”; transcript groups commentary paragraphs | “Is this the meaning, or someone’s interpretation?” Distrust / dissatisfaction | The owner wants source fidelity and unit-by-unit meaning; smooth narration does not establish either | Direct reviewed Hindi meaning for each source unit; commentary visibly separate and optional if retained |
| 6. Go back to something unclear | ±15-second and restart-section controls; seven section play buttons | “Where did that sentence start?” Effort and frustration | Time-based seeking cannot reliably replay the prior sutra; section restart repeats too much | Previous sutra, replay current sutra, next sutra; keep ±15 seconds as secondary controls |
| 7. Read what was heard | Section transcript expands in place; reader contains DEMO sample reflections | “I want this sutra’s original and Hindi meaning.” Disappointment | Transcript is commentary, and reader is unrelated sample text; no same-reference bridge | “Read this sutra” opens the matching source and meaning; explicit “Listen here” performs the reverse |
| 8. Browse while listening | Shared player survives route navigation; mini-player retains section 2 / 0:06 when paused | “Good, I haven’t lost it.” Relief | Useful foundation, but location is still section-level; mobile chrome adds density | Keep persistent mini-player with exact sutra and one-tap return, without covering reading/navigation |
| 9. Return to collection or previous screen | Reader has Library link; mini-player returns to Listen; browser Back returned to reader | “Does Back mean previous sutra or previous screen?” Possible hesitation | Parent navigation, content navigation and history are different operations; no unified chapter context | Distinct parent, previous/next sutra and history behaviour; restore list expansion and scroll |
| 10. Save a meaningful place | Bookmarks source supports reader passages only; not exercised as a current-runtime mutation | “Can I save the sutra I just heard?” Potential frustration | Listening reference cannot currently become a matching study bookmark | One sutra bookmark with Read/Listen actions when each component exists |
| 11. Stop and return tomorrow | Current Home showed पृथ्वीकाय · 0:06 and separate reading passage 2/3 | “My place is safe.” Reassurance, limited by coarse reference | Timestamp works for old recording, but regenerated meanings invalidate it | Independent reading/listening checkpoints with source and recording versions; explicit recovery for incompatible content |
| 12. Prepare offline / hands free | Save-all and Driving mode are visible; actual device operation untested | “Will this work when I put the phone away?” Cautious trust | Must not imply phone reliability from desktop checks or confuse introductions with complete meanings | Prepare the selected reviewed content, show saved readiness, and prove actual phone behaviour |

Emotional arc hypothesis: **curiosity → uncertainty about available content → relief at playback → doubt about fidelity → frustration finding the exact passage → relief at preserved position**. The highest-value improvements address fidelity and orientation before decorative polish.

## Findings that change the plan

1. **P0: the content unit is wrong for the owner's goal.** Splitting the existing recording into seven files improved playback, but did not create individual Hindi meanings. Further cutting those files cannot establish sutra fidelity. A source-aligned content pass must precede replacement audio.
2. **P0: reading and listening do not share usable scripture content.** Independent progress is desirable; unrelated content is not. Shared references with explicit cross-mode actions solve orientation without silently synchronising both progress records.
3. **P1: back/forward controls need three clear meanings.** Previous/next sutra, parent chapter/contents, and browser history should each behave consistently. The tested browser Back and mini-player worked; a universal “Back is broken” claim is unsupported.
4. **P1: preserve the recent shared-player work.** Current playback, paused position, Home resume and mini-player are useful. Extend them to sutra identity and inspect catalogue-player consistency rather than replacing everything.
5. **P1: content replacement is a state migration.** Old seven-section timestamps cannot be treated as valid locations in regenerated per-sutra narration. Preserve old bookmarks/positions and explain unresolved mappings.
6. **P1: version/update confusion is part of the journey.** A returning person can see a substantially older experience. Reproduce safe activation with saved state before claiming this is resolved.
7. **P2: catalogue expansion should follow one complete accepted chapter.** Twenty-four introductions remain useful discovery material if labelled accurately. They are not evidence that 24 studies are ready for study.

## Boundaries and continuity

The linked plan is proposed, not implementation or release authorization. The owner's content correction is accepted; navigation choices and task priorities are recommendations. Existing rights/source/reviewer, real-phone, offline and preservation gaps remain open in the main use-case specification. Earlier reports retain historical evidence; they must not be read as approval of the superseded narration direction.

Session assessment: owner correction recorded; last three commits and live journeys reviewed; findings distinguish current, cached, source-only and untested behaviour. No independent review or participant research; emotional hypotheses require validation. Continuation: settle source/reference mapping and a small sutra-level content sample, then prototype the proposed journeys before production changes.
