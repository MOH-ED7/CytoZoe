CytoZoe — Final Integrated Build PRD (v4)
Project: CytoZoe — Understand the change. Keep the evidence. Competition: NASA Space Apps Challenge 2026 — Create Health Monitoring Software for Astronauts on Space Missions Purpose: One integrated engineering handoff to Claude Code to finish, connect, polish, verify, and release the existing application. After this work, the remaining human tasks should be recording/approving the final presentation and submitting through the official portal. Priority: Stable, truthful, high-quality competition prototype, not clinical/flight certification.  Prepared: 15 November 2026
0. Claude Code execution directive
You are the lead full-stack engineer, scientific-data engineer, UI/UX designer, tester, release engineer, and technical writer assigned to finish the existing CytoZoe application in one coordinated implementation pass. Do the work in the repository, not just write a plan. Do not stop after creating mockups, pseudocode, documentation, or a partial feature. Complete all P0 requirements, run the app and the entire relevant test suite, and report evidence. Carry out the stages autonomously without requiring approval at each stage unless a genuinely destructive or externally consequential action requires it.
Critical constraints:
* Do not rebuild the application, replace its architecture, or change scientific calculations without finding a demonstrated defect, explaining it, and adding an independently checked regression fixture.
* Preserve current FastAPI/React/TypeScript/SQLite architecture, migrations, API contracts, deterministic engines, provenance, evidence IDs, user review records, SSE replay/live sync, launchers, exports, and historical datasets.
* Use the existing verified code. Inspect rather than assume; public documentation can lag behind the local branch. Inventory the branch/working tree and check whether the v3 backend release branch has already been merged.
* No invented measurements, clinical diagnoses, medical advice, personal radiation-dose estimates, fake sensor feeds, misleading AI claims, or causal joins between unrelated studies.
* Keep it functional offline with the local service running. No runtime cloud API, CDN, analytics, tracking, externally hosted fonts, or dependency on Ollama/LLM services.
* Preserve unsaved drafts and concurrency semantics. Do not overwrite a newer review from a stale tab; preserve HTTP 409 conflict handling and audit history.
* Do not spend the final hours on redesign experiments, large dependency migrations, unused features, or optional ML.
* Any item documented as completed must be confirmed against code and rerun tests. An old green report is only a baseline, not proof of this final build.
* The team, not Claude, must finally submit via the competition portal. Do not claim submission took place.
1. Product definition and competition positioning
Problem: In isolated or communications-constrained missions, a person reviewing health observations needs more than measurements: they need clear context, methods, confidence boundaries, original evidence, and a documented follow-up. Environmental readings may also contain gaps/conflicts that must be shown, not concealed.
Solution: CytoZoe is a local-first, evidence-to-action research prototype. It processes real historical NASA health and ISS radiation datasets (separately), explains source-grounded measurements, supports human review, persists decisions locally, and exports auditable evidence packets.
Primary current user: research reviewer or crew-health analyst operating a single-user local workstation. Future intended user: a crew member using validated onboard measurements. Do not pretend the current system is flight-qualified astronaut clinical software.
North-star demo: From a historical biomarker observation, the user must inspect → verify source and calculations → explain limitation → request follow-up → save → restart/reopen → export. The secondary demo shows radiation conflict quarantine and replay. Both work without internet after local setup.
Success means: one connected, attractive, robust application with no broken primary actions, trustworthy results, full lifecycle tests, launch documentation, and immediately recordable demo—not the maximum number of features.
2. Existing technical baseline — preserve, verify, then improve
The public repository documents (as of 14 Nov 2026):
* React 19 + TypeScript + Vite + Recharts frontend, FastAPI/Pydantic/pandas backend, SQLite WAL with versioned SQL migrations.
* Four main workspace pages: Health Overview, Health Trends, Radiation Review, Review Log; public landing page and shared evidence drawer.
* Three deterministic engines: E1 ingestion/quality; E2 health comparisons; E3 radiation sensor integration.
* Source-bound explanation templates (fixed keyword routing for optional typed questions), not an LLM.
* Server-sent events for radiation replay and cross-window review sync, plus historical health timeline replay.
* Persistent review statuses OPEN, FOLLOW_UP_REQUESTED, REVIEWED, optimistic-lock version checks, review_events, HTML/JSON export.
* A backend v3 release report claiming 56 backend tests, 4 frontend unit tests, 12 Playwright E2E tests, and 13 launcher checks passed. The frontend seen in the recording was usable but crowded, and the recording did not demonstrate the entire review lifecycle.
Read these actual files first: AGENTS.md, README.md, docs/IMPLEMENTATION_STATUS.md, docs/ARCHITECTURE.md, docs/BACKEND_RELEASE_REPORT.md, docs/TEST_REPORT.md, docs/SOURCES.md, docs/DATA_DICTIONARY.md, docs/KNOWN_LIMITATIONS.md, docs/DEMO_SCRIPT.md, docs/SUBMISSION.md, docs/SECURITY.md, plus the code, manifest, migrations, frontend tests, and existing API schemas. Use the checked-out repository state as implementation truth.
Stage 0 — Safe baseline and discrepancy audit (P0)
1. Record branch, commit hash, git status, changed-file summary, and relevant diffs. Create a safe checkpoint before edits. Never silently discard local work.
2. Identify missing vs already-implemented requirements by opening actual components and routes. Confirm how GET /api/mission/brief is used and whether it is in the current branch. Never remove it simply because the large Brief panel is being reduced.
3. Run startup/readiness probes and all existing tests. Stage pinned research data where required so data tests run rather than skip; if unavailable, report exact blocked tests.
4. Capture screenshots of the current four pages at desktop width and note failed interactions, console errors, duplicated content, overflow, misleading labels, and unavailable controls.
5. Write a compact issue ledger with severity, owner/module, smallest fix, and verification test. Then implement, not just describe.
3. Scientific data and calculation requirements (P0; immutable unless defect proven)
3.1 NASA Inspiration4 health case
* Dataset: NASA OSDR OSD-575, pinned CMP CSV in the manifest. Current documented fixture: 4 anonymized participants, 7 categorical visits each, 28 samples, 5 selected biomarkers, 140 selected values.
* Support current crew member and visit selection from actual data; no hardcoded medical narratives. Keep visit names and ordering exactly as sourced.
* For each marker show exact stored measurement, unit, supplied per-sample laboratory bounds if present, strictly computed range status, source identity, and available baseline comparison.
* Retrospective baseline: mean of finite preflight observations when n >= 2; show n; calculate delta and percent change only where mathematically valid. Where no valid baseline or baseline is zero, display 'not available' with reason instead of 0, NaN, or fabricated percentages.
* Historical health replay: use only earlier preflight readings as the prospective baseline for a replayed frame; never leak future measurements into past states.
* Preserve scientific regression examples: C001 L-3 creatinine 1.37 mg/dL against supplied upper bound 1.35 mg/dL; it is a preflight measurement, so cannot be characterized as a spaceflight-induced change. Preserve existing golden fixtures, including boundary/equality and missing-value cases.
* Never label a source laboratory range exceedance as clinical severity, disease or diagnosis.
3.2 ISS DosTel1 radiation case
* Separate NASA OSDR RadLab study, historical 1 March 2022 ISS instrument data, not linked to Inspiration4 people. Documented fixture: 1,202 input rows; 1,198 unique timestamps; 4 conflicting timestamp groups; 8 quarantined raw rows; 1,194 accepted readings.
* No averaging, deleting, or guessing contradictory readings. Preserve raw conflicting pairs, reason codes, timestamp identity, source lines, and visible charts/event markers.
* Preserve E3 trapezoidal integration over adjacent accepted samples only, excluding invalid/non-positive time differences, spans over 300 seconds, and intervals crossing excluded conflict events. Preserve source coverage and tested cumulative result (documented 296.04 µGy over 99.04% of the recorded span, as an estimate at the sensor; verify exact result in final tests).
* Explicitly label replay as historical, accelerated, not live. Do not attribute environmental sensor readings to a participant or derive organ/effective/personal radiation dose.
* Source timestamp timezone is unverified. Do not add an invented timezone or infer causality.
3.3 Source integrity, import and evidence
* Keep SHA-256 pinned source manifests, strict allowlisted NASA download setup, size/encoding/schema checks, null handling, non-finite rejection, atomic/idempotent imports, provenance classes, read-side trust gate, conflict quarantine, and source row/line/column/raw value.
* Do not ship raw CSV files or runtime DB in public Git unless explicitly permitted by the project's data/security decision. One-time fetching/importing may require internet; normal app use must not.
* A tampered but schema-valid source MUST NOT be presented as verified NASA data. Failed import must preserve the previous good DB state and saved reviews.
* Freeze source hash and rule version with saved review evidence. A newer import cannot rewrite old exported findings silently.
* Health and radiation case evidence must remain separate in API responses, SQLite constraints, review screens and exports.
4. Backend and integration requirements (P0)
Use current routes as the contract; only extend in a backwards-compatible way if necessary. Inventory and test the existing implementations of:
* GET /api/healthz, GET /api/readyz, GET /api/status, GET /api/datasets
* POST /api/import, GET /api/participants
* GET /api/health?participant=&sample= and GET /api/health/trend?participant=&marker=
* GET /api/mission/brief where present; verify brief/evidence/export agreement rather than deleting it
* GET /api/environment, GET /api/evidence/{id}, POST /api/explain
* GET/POST /api/reviews, GET/PATCH /api/reviews/{id}
* GET /api/export?format=json|html
* SSE GET /api/events, SSE GET /api/replay/environment?speed=&start=; GET /api/replay/health?participant=
Behavioral rules:
1. The frontend consumes backend-calculated evidence; it does not recalculate or silently reinterpret source mathematics.
2. All existing inputs are validated server-side. Errors are structured and actionable; include request IDs where supported. A dead/unready DB returns a typed 503; the app never pretends to be connected.
3. The status UI distinguishes server connected, data loaded, and data unavailable. No misleading 'live astronaut data' indicator.
4. Review POST is idempotent for the same finding; PATCH enforces versioning. On 409 show 'this review was updated elsewhere', preserve draft text, allow explicit reload/reconcile; do not silently overwrite.
5. Saving review state writes durable records and audit events; reopening after browser refresh and actual server process restart shows the same data.
6. Cross-tab SSE keeps lists/toasts/review counts synchronized; reconnect and disconnect cleanly; unsaved edits do not disappear.
7. Radiation SSE preserves accepted source order, resume/pause/reset/speed behavior and stops cleanly without runaway connections. Replays never write review state or contaminate calculations.
8. HTML and JSON export include correct sources, hashes, provenance class, rule versions, measurements, limitations, review status, history and notes. Escape HTML/script and spreadsheet formula injection. Verify downloaded files are parseable and complete.
9. Existing loopback host/origin guards, CSP, no permissive CORS, no secret leakage, safe logs, input limits, SQL migrations, WAL and DB backup/restore must continue working.
10. Keep single-origin production-mode local setup (127.0.0.1:8000) and existing dev setup (:5173 with API proxy); avoid adding a new server/database/framework.
5. Frontend product requirements (P0)
5.1 Global shell, navigation, visual design
* Keep the landing page and four main workspace sections. Preserve working deep links and URL state. Do not add decorative pages that don't lead to meaningful functions.
* Make the application feel like a premium scientific mission-control workspace: restrained palette, clear typographic hierarchy, clean spacing, consistent cards, generous whitespace, subtle motion only when informative, minimal interface noise.
* The existing warm/light v2 design is acceptable; use a dark navy sidebar only if the change is small, coherent and does not cause regression. Avoid wholesale visual replacement. Main analytical surface should remain light/readable.
* Sidebar: logo, four navigation destinations, compact local readiness status, brief recent reviews; no large operational debug panel by default. Keep source status unambiguously historical.
* Loading, empty, error, success, offline, reconnecting, and conflict states must be designed, not left as blank panels. Every visible control must work. No dummy CTA or broken route.
* Desktop first (1440×900 and 1280×800), support 1024, 768, and 390 px without clipped charts, drawers or horizontal page overflow. Proper card stacking, mobile navigation, touch targets and typography.
* Accessibility: semantic headings, real labels, keyboard navigation, focus indicators, drawer focus trap + Escape + focus return, table captions, color-independent status icons, readable contrast, reduced motion support, 200% zoom sanity check.
5.2 Health Overview — highest-priority redesign
Initial viewport shows just the information needed for a decision:
1. Title: Health Overview and unmistakable 'Historical NASA research data · OSD-575 · not live' indicator.
2. Crew member selector and historical visit selector, current visit context.
3. The five biomarker cards as primary visual focus. Each shows measured value with unit, supplied lab range status and concise delta/baseline where valid. Every card has an Inspect evidence action.
4. Results requiring review area showing only the flagged measurements for the selected visit. If none, say 'No measurements outside supplied laboratory bounds for this visit' — not 'astronaut healthy'.
5. Compact seven-visit navigation strip. Keep full historical replay available without dominating the Overview; link to detailed timeline under Health Trends when possible, otherwise make replay collapsible and unobtrusive.
6. Compact source identity/quality link. Move complete limitations and repeated tables to expandable Data & Sources or shared evidence drawer.
Remove duplicated measurement tables, long redundant summaries, oversized intelligence panel and overwhelming text. Keep correct information reachable in one click. No made-up overall health score.
5.3 Evidence & Result Details — single shared drawer
Replace the oversized Mission Health Intelligence Brief visual panel with a reusable Evidence & Result Details drawer closed by default. It should open via Inspect from biomarker cards, flagged rows, trends, radiation events, and saved reviews where applicable.
Drawer must show, when supported by real data:
* Plain-language observation, exact value/unit, measured sample/time and source-specific bounds;
* Valid preflight baseline with sample count, delta/% delta or reason unavailable;
* Source dataset, file, data row, physical line, column, raw reading, source URL/licence, SHA-256 and provenance class;
* Transparent formula/rule version and coverage/quality notes;
* Specific scientific limitations, non-diagnostic explanation, explicit uncertainty;
* Verified explanation actions using existing deterministic templates (unsupported prompts must fail clearly, never hallucinate);
* Human-review action: note, status, save, success, and link to history/export.
For radiation evidence use event/sensor-specific information, not participant baseline fields. The drawer must support copyable values and accessible tabs/sections if needed. Preserve the backend Mission Brief endpoint even if its content is reorganized into this drawer.
5.4 Health Trends
* Clearly show selected participant and biomarker, all seven historical visits in source order, chart values with units, and selected-visit highlights.
* Use categorical visit spacing, do not imply evenly spaced real-world time. Show per-sample reference bands/limits accurately when they differ; don't draw a falsely constant range.
* Tooltips: source value, unit, bounds, comparison status, baseline and evidence link as applicable.
* Provide accessible underlying data table (expandable), clear explanation of preflight vs postflight, and concise limitations.
* If moving the health visit replay from Overview is low-risk, place the full experience here with controlled play/pause/reset. Do not move the radiation replay here.
5.5 Radiation Review
* Preserve replay controls (start, pause/resume, reset, 300×/1200×/3600× speed), source clock, rate plot, cumulative sensor estimate, accepted/excluded counts and coverage.
* Event feed must highlight the four conflict timestamps at the correct point; clearly distinguish source-record time from wall-clock replay time.
* Clicking a conflict shows both original contradictory records and why they were quarantined; highlight affected chart region. Do not smooth over invalid data.
* Provide source-row explorer, method note and environmental-only disclaimer. Chart axes must have correct µGy/h vs µGy units and number formatting. Do not add an astronaut overlay or pretend causation.
* Avoid walls of duplicated methodology text; make secondary explanations collapsible.
5.6 Review Log & Export
* Present a useful review list with counts, source case, finding, status, note preview, last-updated and filter controls. Provide a clear empty state.
* Clicking a review opens the same evidence, saved note, status, version and audit history. Allow editing with safe conflict resolution.
* Prominent Export HTML and Export JSON controls; indicate the actual download outcome and handle errors. A report with zero reviews remains truthful and useful (not fabricated).
* Ensure changes appear after save, refresh, another tab, and restart. Make the full workflow demonstrable inside three minutes.
5.7 Landing page and judge-focused story
* One simple message: Understand the change. Keep the evidence. Explain in a sentence: 'Offline-first, source-traceable review of historical NASA health evidence.'
* Clear launch button, concise how-it-works flow (Observe → Verify → Act → Export), real case-study disclaimers, authentic NASA dataset credits, no unsupported 'AI diagnosis' or 'real-time monitoring' claims.
* Navigation takes judges to a ready-to-demonstrate, meaningful sample without creating demo-only fabricated data.
6. Optional astronaut-relevance enhancement (P1; conditional, not a release blocker)
The 2026 challenge asks for indicators that astronauts can evaluate and act upon. If and only if all P0 tests pass and time remains, add a very small Crew Check-In (Illustrative Prototype) in a separate clearly labelled sandbox:
* An optional daily self-report field (for example a plain-text observation or 1–5 subjective energy rating), a timestamp, a history view, and an explicit 'request follow-up' note.
* Store these inputs in a separate table/namespace, separate from the NASA source-backed cases and review export unless clearly labelled as 'user-entered illustrative data'. Do not treat entries as research data.
* Do not invent medical ranges, red/amber risk scores, vital-sensor hardware connections or treatment advice. If input is not validated for medical use, present it only as a demonstration of interface capability.
* Only build it when it can be fully tested without disturbing the existing data model or release schedule. Otherwise document it as future work. Not required for a passing final build.
Explicitly excluded now: predictive ML, medical risk scoring, personal dosimetry, flight certification, remote cloud deployment, account system, live NASA astronaut telemetry, new unverified datasets, complex AI agents, PWA rebuild, microphone/speech, and cross-study causal analysis.
7. Release engineering and reliability (P0)
* The application starts from clean documented setup with no manual code edits. Preserve Windows scripts (setup.ps1, start.ps1), macOS/Linux scripts (build_local.sh, start.sh), and root npm launcher as they currently exist; verify actual commands in package.json.
* Reproducible one-time setup fetches, verifies and imports approved NASA data. Warm launch does not refetch or re-import. Show meaningful errors if datasets are missing.
* /api/healthz liveness and /api/readyz readiness behave correctly when SQLite is missing/corrupt. Frontend does not render fabricated empty data as success.
* Test graceful startup/shutdown; no orphan Vite or Uvicorn processes; refuse non-owned port conflicts; preserve existing launcher checks.
* Physical Wi-Fi-off test on the actual demonstration machine with the local server left running: every route loads, evidence opens, review saves, refresh works, HTML/JSON export works. No attempted external requests.
* Backup and restore the runtime DB with unique filenames, verify notes and dataset provenance remain intact. Avoid bundling private runtime notes in release artifacts.
* Build the frontend locally, serve compiled output and API from the same origin, and verify user experience from a fresh browser profile.
* Check public repo links from a logged-out browser. Avoid committing raw data, runtime DB, logs containing private notes, credentials, caches, generated videos or dependencies.
8. Tests, evidence and mandatory acceptance gates
Gate A — Scientific fixture accuracy
* Pinned manifest verification succeeds and data import is idempotent.
* Expected counts: 28 health samples, 140 selected measurements, 1,202 radiation raw rows, 8 quarantined, 1,194 accepted.
* C001 preflight L-3 creatinine exact value/range is correct; compare to exact source data and explanation/export.
* Equal-bound, missing-bound, missing-value, n<2, zero-baseline, visit order, prospective replay, nonfinite, duplicate timestamp and gap cases pass.
* Radiation estimate, coverage, excluded intervals, replay end state and source rows match existing golden fixtures.
* Tampered source rejected, cross-case joins rejected, no real clinical inference.
Gate B — Backend integrity
* No breaking API changes; /api/mission/brief, evidence, review, export and status agree wherever applicable.
* Reviews survive a real server restart. Concurrent stale edits yield 409 with draft intact. Create is idempotent; audit events preserved.
* Backup/restore works; invalid import rolls back. Offline and SSE reconnect/disconnect behave cleanly.
* Security tests including injection escaping, CSP, origin/host limits and no external runtime calls pass.
Gate C — UI and whole journey
Run an actual Playwright path plus a short manual review:
1. Clean start → Health Overview shows genuine loaded NASA fixture.
2. Select C001 and preflight L-3 → five cards and the creatinine warning appear.
3. Click Inspect → drawer opens with correct measured value, range, baseline, row/hash and limitations; explain action is source-bound.
4. Enter a note and select FOLLOW_UP_REQUESTED → save succeeds, log count changes.
5. Open Review Log → locate saved entry, inspect evidence and audit trail.
6. Reload browser and restart the server → saved data still identical.
7. Open a second tab, edit same review, exercise live sync and 409 conflict safely.
8. Download HTML and JSON → open and parse both; source and note values agree.
9. In Radiation Review, play/pause/resume/reset, inspect a conflict event and verify final count/estimate.
10. Turn Wi-Fi off with local server running and repeat essential inspect/save/export journey.
Gate D — Visual and accessibility quality
* No overflowing/overlapping desktop UI at 1440×900/1280×800; correct tablet/mobile behavior; no horizontal page scroll at 390 px.
* Drawer keyboard/focus behavior correct; tab, escape, return focus; controls accessible; status not color-only; high-contrast readability.
* No dead CTA, mislabelled live/AI data, placeholder values, console errors, uncaught rejected promises, stalled spinner or broken source links.
* Capture screenshots and optionally a short screen recording from the final code for the submission package.
Gate E — Build and tests
Run commands appropriate to the actual repository; documented baseline includes:
python scripts/fetch_data.py --all
python scripts/verify_data.py --strict
python scripts/import_data.py --all
cd backend && python -m pytest -v
cd ../frontend && npm run typecheck && npx vitest run && npm run build && npx playwright test
# From repo root, if present:
node tests/launcher/launcher.test.mjs
Record exit codes and actual counts. A skipped suite is not a passed suite. Report test environment, committed revision, platform limits and any deviation. Do not assert that physical Wi-Fi-off or manual screen-reader testing passed unless executed.
9. Work ordering and change control
Implement in this order without stopping between stages for ordinary approval:
1. Baseline and test recovery — checkpoint current working tree; prove existing behavior; identify blockers.
2. Backend correctness/integration repairs — only if failures exist; ensure mission brief/evidence/reviews/export consistent.
3. Frontend simplification — Health Overview, shared drawer, four screens, responsive design and reachable evidence.
4. Full evidence-to-action workflow polish — save status, audit, reload, cross-tab, HTML/JSON.
5. Radiation, trends and language polish — data fidelity, charts, replay, explicit historical labels.
6. Safety/security/performance/reliability — offline, readiness, launcher, backup/restore, accessibility.
7. Re-run full release gates — clear P0 failures, stable app, screenshots, real final walkthrough.
8. Submission handoff — finalize truthful README/docs and give the team everything needed for video and portal submission.
Create focused commits or a small set of logically grouped commits; report modified files. Avoid destructive Git operations. Do not claim '100% production ready': the goal is a validated competition prototype.
Time protection: Because submission is the same day, favor verified P0 completion over P1 extensions. Reserve a substantial buffer for human video recording and portal submission. Do not add a feature that requires more validation than remaining time allows.
10. Deliverables Claude must provide at completion
1. Working repo/branch with final changes, no broken uncommitted state, and a concise change log.
2. Complete tested frontend and backend using the existing local single-origin startup path.
3. Final test evidence: command, outcome, exact counts, skipped/failed tests, screenshots and reproducible logs.
4. A feature audit table: existing preserved / improved / newly added / deferred, with links to code or tests.
5. A scientific validation note matching golden data, source manifests and limitations.
6. Final screenshots of Health Overview, Evidence drawer, Trends, Radiation, Review Log and export result.
7. Updated README.md, docs/IMPLEMENTATION_STATUS.md, docs/TEST_REPORT.md, docs/KNOWN_LIMITATIONS.md, docs/DEMO_SCRIPT.md, and docs/SUBMISSION.md as needed to reflect actual changes. No false completion claims.
8. A 2–3 minute demo route/script with the exact sequence of clicks, prepared case IDs, source evidence and offline proof. Provide a pre-recorded video only if a real capture is possible; never create fake footage.
9. Final user instructions: one setup command, one start command, localhost URL, reset/backup instructions, and a short troubleshooting list for the actual target OS.
10. A submission-ready checklist containing accessible repo URL, video link placeholder, accurate NASA citations and AI-development disclosure text, and an explicit note that portal submission must still be completed by the team.
11. A final GO / NO-GO report: mark GO only if all P0 gates pass; otherwise state blockers in order of severity, exact next corrective step and evidence. Do not call an unverified task complete.
11. Final definition of DONE
CytoZoe is complete for this hackathon when a person can launch it, inspect true historical NASA measurements, understand why a result was flagged, verify its source and scientific limits, save a review, reopen that review after restart, export the evidence, inspect transparent radiation data-quality decisions, and perform the essential workflow offline using the running local server. The interface must be polished, responsive, accessible and free of broken primary interactions; the science must match source fixtures; the documented release tests must pass.
Your immediate action as Claude Code: Open the repository, audit against this PRD, implement the missing P0 work, run the real app/tests, and produce the final handoff. Do not stop at a plan. Do not rebuild what already works. Do not postpone core integrations. Finish the complete verified application in this pass.

Sources to use during the build (read directly, do not trust this PRD over code)
* Repository: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project
* Current architecture: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/ARCHITECTURE.md
* Latest backend release evidence: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/BACKEND_RELEASE_REPORT.md
* Implementation status: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/IMPLEMENTATION_STATUS.md
* Test report: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/TEST_REPORT.md
* Known limitations: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/KNOWN_LIMITATIONS.md
* Demo: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/DEMO_SCRIPT.md
* Submission pack: https://github.com/Muhyadiinjama/CytoZoe_Nasa_project/blob/main/docs/SUBMISSION.md
* NASA challenge: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
* NASA Inspiration4 OSD-575: https://osdr.nasa.gov/bio/repo/data/studies/OSD-575
