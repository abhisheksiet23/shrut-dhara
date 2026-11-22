# Workstream: sutra-by-sutra study (Śastraparijñā)

As of 22 Nov 2026, night. Update when the candidate, decisions or blockers change.

| Item | Current fact |
| --- | --- |
| Objective / boundary | Read and Listen share sutra identity; audio gives Hindi meaning per sutra. First chapter only; all seven uddeshakas catalogued. |
| Candidate | `042bf75` plus uncommitted docs from the content-sourcing session; build `main-TTCKKONS.js`. Not deployed. |
| Accepted decisions | SJ-D1 (22 Nov): sutra-by-sutra Hindi meaning replaces storification; English chrome, Hindi content. Owner (22 Nov): public-domain sources only, no contact with Padma Prakashan; owner is not a Prakrit reviewer. Links: [change plan](../sutra-journey-change-plan.md), [design](../sutra-journey-design.md), [source ledger](../sources/README.md) |
| Provisional | SJ-G2 Prakrit recitation; SJ-G3 audio on Read-this-sutra; SJ-G6 continuous vs pause; Agamodaya 1916 as primary source (rights likely PD, unconfirmed) |
| Proof | App: 20 web + 5 prototype tests, 12 headless Chrome journeys ([checks](../implementation-checks.md)). Content: 1916 Prakrit and commentary extracted by OCR, concordance to app units built, not proofread against scans |
| Content findings | Revision 1 (live, with audio) has two errors: 1.1.2 "बहुत से" should be "कुछ"; 1.1.4 "जानना चाहिए" should be "जान लेता है". Unit numbering differs by edition. Revision 2 drafts: [docs/content](../content/acharanga-1-1.draft-r2.md), status draft, not wired in |
| Not proved | Real Android, screen-off, offline, screen reader, dark theme; Prakrit proofreading; any qualified review; rights confirmation |
| Next | 1) owner commits docs. 2) proofread OCR doubts against scan pages. 3) compare each unit with Śīlāṅka, Jacobi, 1999 (check only). 4) owner decides: replace revision 1 text and re-record (new recording ID, old audio kept superseded). 5) scholar reviews flagged differences. 6) then remaining 41 units. |
| Context gaps | Codex loading of AGENTS.md unverified (start in this folder); per-sutra status not yet a field in study.json |
