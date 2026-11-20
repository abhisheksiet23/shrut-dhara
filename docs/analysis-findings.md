# ShrutDhara — analysis findings

Date: 2026-11-20 · Status: requirements evaluation, no implementation

Subsequent owner decision, 2026-11-20: deliver a web app/PWA without an APK or app-store dependency, retaining Android phones as the primary device audience. See D-02 in the specification and the separate [technical design](app-design.md). Earlier Android references identify devices; native delivery is not accepted scope.

Behavioral handoff: [Use-case specification](use-case-specification.md). The specification owns shared rules, acceptance conditions, and the single gap register.

## Evidence and boundary

Primary source: the supplied *ShrutDhara Business Requirements Document*, sections 1–13, from `C:/Users/Abhishek/.codex/attachments/367ed153-3c47-431e-a892-091c1f003bb7/Pasted text.txt`. No source revision was supplied. Owner decision in this chat, 2026-11-20: **Android phones first**.

The workspace contained no discoverable application files during this review. All behavior below is intended, not observed. No canonical sequence, scripture edition, licensing status, doctrinal claim, audio tool terms, or Android capability has been independently verified. This is a requirements evaluation, not market-demand validation, legal clearance, architecture selection, or executed QA.

## Assessment

The concept is coherent enough to advance into content discovery and a focused product prototype. Its strongest feature is the distinction between studying a sutra and understanding a chapter through listening. Separate progress supports that distinction without imposing a learning sequence. Offline use, no registration, and no advertising are consistent with the personal-use goal.

The central delivery dependency is a publishable, reviewed chapter. A polished reader cannot compensate for uncertain sources, missing redistribution rights, or an audio explanation that omits important teachings. The BRD treats these as obligations but does not yet define the people, evidence, or acceptance process that satisfies them. This blocks publication, while leaving substantial experience design possible.

The ambition to replace mindless consumption expresses the motivation; it does not establish that the app changes habits or improves understanding. The existing success criteria primarily demonstrate functionality. Comprehension and everyday usefulness need separate observation with intended users; no commercial demand claim is required for a personal tool.

## Problem, actors, and outcome

| Actor | Need | Desired outcome |
| --- | --- | --- |
| Hindi-reading beginner | Understand original teachings without specialist vocabulary | Read the source, meaning, and explanation with their distinctions visible |
| Listener, including a prepared driver | Learn without looking at a screen | Hear a coherent complete explanation and reliably resume it |
| Returning learner | Continue either learning mode independently | Recover reading and listening positions without losing bookmarks |
| Content preparer/reviewer | Publish trustworthy and shareable material | Establish source, coverage, review, attribution, and correction evidence |

These are roles, not proposed account types. The BRD requires no user accounts; editorial responsibilities do not imply an in-app administration system.

## Findings that change the requirements

1. **One chapter is the right proposed vertical slice.** Use the same complete chapter for both journeys so source mapping, comprehension, and progress independence can be assessed together. The BRD permits an initial reading subset; the stronger shared-chapter boundary remains a recommendation until confirmed (G-02).
2. **Editorial readiness has multiple dimensions.** Text, translation, explanation, narration script, recording, and local download availability are different facts. A single “verified chapter” badge would conceal missing work. Review scope and reviewer authority require decisions (G-03); availability rules are in R-02.
3. **The canonical collection and a source edition are different decisions.** A verified list of 32 titles does not settle chapter structure or sutra references. Sequence, selected edition, and mappings must be sourced together before content identifiers and progress migration are designed (G-02, G-05).
4. **One sutra per screen conflicts with unrestricted content length unless interaction is clarified.** A large font and long explanation may exceed a screen. Reading within a sutra must not accidentally advance it. The gesture choice is open; full readability is already required (G-04).
5. **Exact resume needs an observable definition.** A sutra reference alone may not recover a long passage's visible position. Audio replaced by a revised recording may no longer have the same timestamp meaning. Separate routine resume from edition/recording migration (G-04, G-05).
6. **Offline is a lifecycle promise.** First use, content installation, interrupted downloads, low storage, updates, and restoration can affect whether the next session works. Core playback must use local content without a paid service. Installation and update behavior need decisions (G-06).
7. **Driving readiness depends on a supported Android environment.** The owner selected Android first. Background, interruptions, media controls, and Bluetooth behavior require a declared support range and real-device evidence. “Where supported” should become explicit limitations, not an untestable release claim (G-01, G-07).
8. **“Next available chapter” conflicts with “never skip silently” at gaps.** The app must disclose missing content; it is unclear whether an explicitly prepared noncontiguous queue is enough notice or whether a gap always stops automatic playback. This affects hands-free use (G-07).
9. **Completion is not the same as position.** Landing on a chapter's final sutra or seeking to the end of audio does not necessarily demonstrate study. The read/listened labels need owner-defined meaning (G-08).
10. **Free use does not establish free production or distribution.** The BRD rules out recurring required infrastructure and paid core dependencies. Editorial time, audio production, storage/distribution, and license compatibility remain dependencies to investigate, not proven zero-cost properties (G-03, G-06).
11. **Search and reflection need boundaries.** Text/reference search, indexed topics, and personal reflection have different content and privacy needs. The BRD does not require storing reflections. Keep these visible in later scope without inventing notes, topic taxonomies, or engagement features (G-10).

## Capability coverage and proposed sequencing

| Goal/capability | Use case | Recommended timing |
| --- | --- | --- |
| Establish publishable chapter content | UC-01 | First release prerequisite |
| Browse availability and navigate | UC-02 | First release |
| Read, resume, and bookmark | UC-03 | First release |
| Listen offline and resume independently | UC-04 | First release |
| Prepare hands-free listening and handle interruptions | UC-05 | First release, bounded by Android support |
| Expand content without losing personal state | UC-06 | Preservation contract now; update workflow before first update |
| Export and restore personal state | UC-07 | Required product obligation; recommend first release |
| Search, presentation preferences, reflection, queue conveniences | UC-08 | Preserve long-term scope; release allocation needs confirmation |

Proposed first increment: one rights-cleared complete chapter from आचारांग सूत्र, both journeys, availability/source information, offline operation, independent resume, bookmarks, Android audio controls, and backup/restore. A preselected single-chapter listening session is sufficient to demonstrate the initial audio-first experience; it does not satisfy the long-term multi-chapter queue requirement. The owner has confirmed only Android-first, not this scope recommendation.

Long-term scope remains all 32 Agamas, documented source differences, full direct/sequential access, search, reading settings, completion indicators, speed controls, queue, sleep timer, and optional autoplay. Voice commands are optional. No account, paid subscription, advertising, mandatory network dependency, or invented scripture is introduced.

## Decisions and next useful work

The authoritative [gap register](use-case-specification.md#gap-and-decision-register) separates content/publication blockers from device and behavior decisions. The next useful step is to identify the first chapter, source edition, redistribution evidence, and qualified review responsibility, while resolving reader navigation and testing the intended Android audio experience. Do not select an architecture merely from the phrase “offline-first.”

Content review should assess whether each major teaching in the chapter is represented in the written and audio explanations, whether examples are clearly attributed as examples, and whether terminology is pronounced intelligibly. A completion percentage or arbitrary narration duration would not prove that.

This evaluation supports proceeding with a bounded exploration. It does not establish production readiness. No selected flow is marked built or verified, and unresolved choices remain explicit in the specification.
