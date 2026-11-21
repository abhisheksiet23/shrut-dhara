# Chapter checklist

## Source and coverage

- Start from the printed title and table of contents, then verify opening and closing markers. Preserve the chosen edition's references. A cross-edition numbering map is optional unless needed to reconcile text or an existing backup.
- Keep a compact ledger with one row per source unit or consecutive range. Columns are reference, source page, original verified, Hindi meaning, explanatory point, spoken section/paragraph, and unresolved question. Record what repeat material was consolidated and which details remain. Check the last unit before marking a chapter complete.
- For OCR, compare Devanagari and Prakrit from page images, especially conjuncts, vowel marks, negation, proper names, and numbers. Never repair unclear canonical text by guessing. Source links and page references belong in the reader or credits, and review notes stay outside the spoken input.
- For listening, keep doctrine in its Jain context. Keep translator glosses, editorial illustrations, and period classifications distinguishable from sutra wording. Use a native Hindi listening check with names, technical vocabulary, enumerations, and sentence rhythm. Where speech is still awaiting review, say so without calling it verified.
- Keep a dated asset record with owner/source, edition, license evidence, attribution, voice and training lineage, revision, and review status. Prefer providers with clear output rights for the intended use. If access or provenance is uncertain, keep a local review copy and continue the separate text work.

## ShrutDhara integration

Use the active checkout. `docs/use-case-specification.md` gives the product rules. `docs/shastraparijna-hindi-narration.md` is the baseline script and coverage example. `docs/implementation-checks.md` contains the previously verified release details.

- `web/src/app/pages/narration.ts` shows the review experience. The Listen entry, Angular route, Vercel rewrite, local preview route, and service-worker navigation allowlist must agree on a new deep link. Reuse patterns rather than replacing the existing calibration path or personal state.
- `web/public/narration/` is the shipped review asset directory. Copy in only the intended MP3, transcript and credits. Keep raw takes, synthesis caches and review notes outside public assets. For multiple chapters, use distinct slugs and names and avoid another global `credits.txt` collision.
- The review MP3 is streamed, with a separate file download. Offline playback within the app needs the existing full-file integrity path, cache retention, and browser verification. Do not infer offline PWA or background support from an online `<audio>` test. For the current Android support scope, Firefox on CMF Phone 1 is primary and Chrome Android is required.
- Run `npm test` and `npm run build` from the repo root before a release. Test opening the chapter from Listen and by direct URL, playback start/pause and seek, manuscript or transcript access, and source and voice credits. On the deployed origin, compare the exact audio SHA-256 and test an HTTP byte range. Keep validation and deployment status separate. A content request that does not authorize publication stops at a local or reviewable artifact.
