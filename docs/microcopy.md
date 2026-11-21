# ShrutDhara microcopy guide

**Rule 1 — Content is Hindi, the app is English.** Anything a person *studies* (narration audio and transcripts, section titles, study names and introductions, reader passages, the श्रुतधारा wordmark) stays Hindi. Everything that helps them *operate* the app (buttons, labels, status, errors, empty states, settings, navigation) is English. A test (`core/microcopy.spec.ts`) fails if Devanagari appears in app code outside an allow-list of content strings.

**Rule 2 — Sound like a calm, honest companion.** Not a system, not a guru, not a marketer.

| Do | Don't |
|---|---|
| Short sentences, plain words | "Epoch mismatch", "integrity check failed", "read-only window" |
| Say what happened, then what to do next | Blame ("You did it wrong") or hide ("Something went wrong") |
| Reassure about the thing people fear losing: their place, their saved audio | Over-apologise, exclaim, use emoji |
| Be specific: "Section 3 isn't saved for offline yet" | Generic: "An error occurred" |
| Be honest that the voice is AI and unreviewed | Imply scholarly authority the app does not have |
| Use "you/your" sparingly; prefer neutral verbs | "Oops!", "Awesome!", streaks, nudges, guilt |

**Rule 3 — Errors have three parts** (first two required): *what happened* · *what is safe* · *what to do*. Example: "Couldn't save section 3 offline. Your saved sections are untouched. Check your connection and try again."

**Rule 4 — Words we use**
- *Listen*, *Read*, *Library*, *Bookmarks*, *Settings*. A "section" is one uddeshaka of the narration. A "study" is one adhyayana.
- "Save offline" / "Saved on this device" (never "cache", "download manager").
- "Resume" for continuing from the saved place; "Start over" for restart.
- "This window" for the single active study window; explain it once, in plain words: "ShrutDhara can only be active in one window at a time."
- Never mention: IndexedDB, epoch, revision, manifest, service worker, sha256, MiB in user-facing text. Megabytes are fine.

**Rule 5 — Validation (inputs and states)**
- Backup import: say which problem (too large, not a ShrutDhara backup, from a newer version) and that nothing was changed.
- Never say "invalid". Say what is expected: "This doesn't look like a ShrutDhara backup file."
- Success messages are one short line, past tense, no exclamation: "Backup restored." 

**Rule 6 — Titles of works.** Show the Hindi title as the headline and an English gloss beneath, e.g. शस्त्रपरिज्ञा / *Shastra-parijnā*, so English chrome never leaves the reader guessing which work this is.

**Tone check before shipping any string:** Could a first-time user on a phone, in a hurry, tell what to do next? Would it be fine if their parent read it over their shoulder?
