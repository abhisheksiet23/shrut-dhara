# Workstream: sutra-by-sutra study (Ācārāṅga, first Śrutaskandha)

As of 22 Nov 2026, late night (whole Book 1 text reading added). Update when the candidate, decisions or blockers change.

| Item | Current fact |
| --- | --- |
| Objective / boundary | Reading: whole first Śrutaskandha (chapters 1–9, 283 units, chapter 7 lost) in source order, Hindi meaning per unit, Contents → chapter → uddeshaka → sutra. Listening: none now (earlier sample retired; text changed). Draft status kept in data only, never shown in the app. |
| Candidate | Uncommitted-to-git work in the folder: `web/public/content/acharanga-book1/book.json` (built by `docs/content/book1/build_book.py` from `ch01..ch09.py`), generalized app and tests. Sandbox: vitest passes except `narration.spec.ts` (a file not staged), dev build OK. Not deployed. |
| Accepted decisions | SJ-D1 (22 Nov): sutra-by-sutra Hindi meaning replaces storification; English chrome, Hindi content. Owner (22 Nov): public-domain sources only, no contact with Padma Prakashan; owner is not a Prakrit reviewer. Links: [change plan](../sutra-journey-change-plan.md), [design](../sutra-journey-design.md), [source ledger](../sources/README.md) |
| Provisional | SJ-G2 Prakrit recitation; SJ-G3 audio on Read-this-sutra; SJ-G6 continuous vs pause; Agamodaya 1916 as primary source (rights likely PD, unconfirmed) |
| Proof | Unit counts per lesson match Jacobi 1884 (checked in script). Meanings are written from Jacobi's English, not from Prakrit; Prakrit shown only for ch1 lesson 1 (Agamodaya 1916). `web/e2e/sutra.e2e.mjs` still uses old ids and was not run. No qualified review. |
| Content findings | Revision 1 (live, with audio) has two errors: 1.1.2 "बहुत से" should be "कुछ"; 1.1.4 "जानना चाहिए" should be "जान लेता है". Unit numbering differs by edition. Revision 2 drafts: [docs/content](../content/acharanga-1-1.draft-r2.md), status draft, not wired in |
| Not proved | Real Android, screen-off, offline, screen reader, dark theme; Prakrit proofreading; any qualified review; rights confirmation |
| Next | 1) owner commits. 2) update `web/e2e/sutra.e2e.mjs` for new ids and run it. 3) OCR-repair and attach Prakrit for other chapters. 4) compare units with Śīlāṅka/Jacobi. 5) re-record audio with new recording IDs. 6) cross-Agama correction sweep. Ch6 lesson 3 was taken from a secondary copy (page missing on sacred-texts); check it. |
| Context gaps | Codex loading of AGENTS.md unverified (start in this folder); per-sutra status not yet a field in study.json |
