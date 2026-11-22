# ShrutDhara — agent instructions

Hindi web app for reading and listening to Jain shastras. Chrome (UI text) is English; only scripture content is Hindi. Owner: Abhishek. Start Codex and other agents with this folder as the working root, otherwise another AGENTS.md may be loaded. Skill library: use the skill-os / SkillMesh skills; they are read-only from this project (never edit the skill-os repo from here).

## Project context

Maintain project context automatically within authorized local work. At start/resumption, establish the project root and task/branch, read this map and relevant sections only:
- Purpose, run commands, current behaviour: README.md
- Accepted decisions and proposed rules: docs/sutra-journey-change-plan.md (SJ-D1 and SJ-R1..R7 are the current direction), docs/sutra-journey-design.md (implementation design)
- Requirements and open gaps: docs/use-case-specification.md (G-01..G-14)
- Current checkpoint: docs/workstreams/sutra-study.md (use only this task's record)
- Verification evidence (candidate-bound, newest first): docs/implementation-checks.md
- Content sources and method: docs/sources/README.md (ledger, rights, numbering concordance), docs/sources/acharanga-1-1.sources.json (extraction); Hindi drafts: docs/content/
- Session assessments: docs/session-assessments.md (closeout/resumption only)

Superseded: the connected-chapter / storified narration direction in docs/analysis-findings.md, docs/shastraparijna-narration-brief.md and docs/shastraparijna-hindi-narration.md. Historical evidence only; do not resume it.

Treat explicit owner decisions as accepted, verified facts as source/revision-bound, and assumptions or recommendations as provisional. Preserve replaced decisions as superseded with reasons. Update authoritative records after consequential changes; link evidence instead of copying conversations. Do not replace accepted intent merely because implementation differs.

After consequential changes and before completion, pause or handoff, refresh the workstream checkpoint: boundary, candidate, actual checks, unknowns, next action. Re-read before editing and reconcile conflicting changes to the same fact. Mark affected evidence stale when code or environment changes. Local upkeep does not authorize commits, pushes, deployment or external writes. For explicit read-only work, report the pending update instead of editing records.

At every session closeout, append a concise assessment to docs/session-assessments.md (rubric: score continuity, decision fidelity, evidence freshness, retrieval economy, project/workstream separation, review independence as 0/1/2, unknown, or N/A with reasons; maintenance-only closeout leaves continuity unknown; savings unknown unless measured). Record missed closeouts on resumption without fabricating scores.

Fresh reviewers get only the target, selected evidence and constraints, with no authoring history or assessments; use a no-history reviewer when available.

## Project rules

- Deploy only on explicit owner authorization (Vercel is the target; Codex does redeploys). The owner commits files himself.
- UI microcopy is English, content is Hindi (docs/microcopy.md; `core/microcopy.spec.ts` enforces it).
- Content is sutra by sutra, source order, Hindi meaning; no invented stories, reorderings or chapter summaries as meaning. Original-Prakrit recitation is an open choice (SJ-G2).
- A timestamp is valid only within its recording revision; a sutra ID only within its source edition. New content needs a new recording ID/URL. No guessed timestamp migration.
- Source policy (owner, 22 Nov): the owner reads no Prakrit and is not the content reviewer. Use public-domain sources only (Agamodaya 1916 Prakrit and commentary, Jacobi 1882 and 1884). The 1999 Padma Prakashan book is comparison-only: copy none of its text and do not contact the publisher. Write Hindi in our own words; Prakrit shown in Devanagari. Sutra numbering is edition-specific (see docs/sources/README.md).
- Each sutra carries a status: draft, compared, reviewed, approved. Only a qualified reader sets reviewed. Ask scholars only about flagged differences.
- Never generate or publish the other 41 meanings/audio, or re-record audio, before the first-lesson sample is compared and the owner decides. Revision 2 drafts in docs/content/ are not wired into study.json.
- Local-only, never publish or stage in other tooling: `.env.local`, `.audio-env/`, `.audio-work/` (63 MB voice model).
- Commands: see README.md (`npm --prefix web ci`, `npm run build`, `npm start`, `npm test`, `npm --prefix web run e2e`).
