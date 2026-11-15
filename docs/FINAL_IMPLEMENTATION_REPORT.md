# Final integrated implementation — 15 November 2026

## Release decision

**NO-GO for an unconditional PRD v4 sign-off until the physical Wi-Fi-off rehearsal, manual 200% zoom/VoiceOver review, and logged-out public-link check are completed.** Automated competition-prototype verification is recorded below. No submission or video recording is claimed.

## Baseline and changes

Baseline Mumin / 0b32d9e (v3 backend already merged). The only pre-existing untracked file, root package-lock.json, was preserved and is excluded from this change. Checkpoint: /tmp/cytozoe-checkpoint. Runtime DB and raw data remain ignored; a consistent local backup was created with integrity=ok. No engine, source hash, evidence identifier, migration, API contract or review concurrency behavior was changed.

| Feature | Disposition | Code / evidence |
|---|---|---|
| Canonical science, provenance gate, Mission Brief endpoint | Preserved | backend/app/engines; backend/tests/integration |
| Five biomarker cards | Improved: baseline sample count visible | frontend/src/components/MetricCard.tsx |
| Health Overview | Improved: clear historical label, seven-visit navigation, detail closed by default | frontend/src/pages/Overview.tsx |
| Evidence drawer | Improved evidence-first ordering; preserved source, calculation, limitations, explanations, notes | frontend/src/components/DrawerHost.tsx; EvidencePanel.tsx |
| Mission Brief | Preserved and collapsed; all 28 samples compared to API | frontend/e2e/frontend-v2.spec.ts |
| Health Trends, Radiation replay and quarantine | Preserved, rerun browser checks | frontend/e2e/environment.spec.ts; realtime.spec.ts |
| Review lifecycle and draft conflicts | Preserved, note preview added | frontend/src/pages/Reviews.tsx; e2e/quality.spec.ts; restart.spec.ts |
| Export | Improved: checked response, visible errors, download handoff status | Reviews.tsx; e2e/journey.spec.ts; final-release.spec.ts |
| Root test command | Fixed backend import discovery | backend/pyproject.toml |
| Crew Check-In / AI / live telemetry | Deferred / excluded | P1 optional; protect source-backed scope |

The export success message means the packet was handed to browser downloads; it does not claim the user saved or opened it. Existing test assertions were retained; disclosure clicks and download button roles reflect the new interface.

## Fresh verification

Environment: macOS, Python 3.12 virtual environment, Node 24.11, installed Google Chrome via Playwright. Tests use isolated databases; user runtime reviews are not test fixtures.

| Command | Outcome |
|---|---|
| npm test | Exit 0; 61 backend tests passed, 4 component tests passed, strict TypeScript passed; no skips reported |
| npm run build | Exit 0; bundled local assets; JS approximately 771 kB / 226 kB gzip |
| python scripts/verify_data.py --strict (venv) | Exit 0; both pinned SHA-256 hashes match |
| python scripts/import_data.py --all (venv) | Exit 0; both ALREADY_IMPORTED, no replacement |
| node tests/launcher/launcher.test.mjs | Exit 0; 13 checks passed, readiness, foreign-port refusal, teardown, single-origin start |
| npm run e2e | Exit 0; 17 passed in 1.6 minutes, no skipped or failed tests |
| python scripts/backup_db.py (venv) | Exit 0; unique runtime/backups file; integrity ok |
| git diff --check | Exit 0 |

One Starlette TestClient/httpx deprecation warning remains. No dependency migration was attempted. Initial root-test import failure was fixed. An intermediate browser run failed because the old test expected export links; final browser run uses button semantics and keeps packet parsing assertions.

## Scientific validation

Verified 28 health samples, 140/140 selected values, four participants and seven categorical visits. C001 L-3 creatinine is 1.37 mg/dL against 1.35 upper bound, collected before launch; retrospective baseline 1.236666… with n=3. Evidence and Mission Brief agree across all 28 samples.

Radiation: 1,202 raw rows, four conflicting timestamps, eight quarantined rows, 1,194 accepted. Existing tested E3 integration remains 296.04 µGy at the sensor over 99.04% coverage. No personal dose, causal cross-study join, diagnosis or fabricated data is introduced. Timezone remains unverified.

## Browser demonstration and screenshots

The network-isolated journey launches the real built app, selects C001/L-3, inspects row/hash/baseline, exercises verified explanations, saves FOLLOW_UP_REQUESTED, reloads, reopens audit history, downloads and parses HTML/JSON, and visits every workspace route without external requests. Separate tests exercise a real server stop/restart, stale-tab 409 with draft preservation, cross-tab SSE, radiation replay/pause/resume and source conflict evidence. Axe and keyboard focus checks run against the real interface.

Screenshots: [Overview](screenshots/final-overview.png), [Evidence](screenshots/final-evidence.png), [Export result](screenshots/final-export.png), [Trends](screenshots/health-1440.png), [Radiation](screenshots/environment-1440.png), [Review Log](screenshots/reviews-1440.png). Responsive captures cover 390, 768, 1024 and 1440 widths. Overview desktop, mobile and evidence drawer captures were visually inspected.

## Run and recover

One-time setup: `npm run setup`. Demo start: `npm start`. Open http://127.0.0.1:8000. Development: `npm run dev` at :5173. Enter q in the launcher terminal to stop cleanly. Keep the local server running offline.

Backup: `.venv/bin/python scripts/backup_db.py` (Windows: `.venv\\Scripts\\python`). Restore with the server stopped: `.venv/bin/python scripts/backup_db.py --restore runtime/backups/<chosen-file>.sqlite`. Restore creates a safety backup first. Do not delete runtime to reset a demonstration; use a separate CYTOZOE_DATA_DIR and import pinned files instead.

Troubleshooting: free ports 8000/5173 by stopping their owning application; never kill unrelated programs. If no data is loaded run `npm run data` with network access once. If the service is unavailable, restart the root launcher and check /api/readyz. A corrupt database requires restoring a known-good backup; do not overwrite it with an empty database.

## Remaining human release gates

1. Turn Wi-Fi off on the demonstration laptop with server running; inspect, save, refresh, reopen and export both formats. Browser-level network isolation already verifies the same dependency boundary but is not physical proof.
2. Review all four pages and drawer at real 200% browser zoom and with VoiceOver. Automated axe is not equivalent to manual assistive-technology testing. Automated 1280×800 no-overflow checks are included in the final-release test.
3. Open repository and NASA citations logged out; confirm public accessibility. No portal policy or competition eligibility verification was performed in this implementation pass.
4. Record the real 2–3 minute route in DEMO_SCRIPT.md, add video URL in SUBMISSION.md, review AI-development disclosure, and submit through the official portal as a team.

Reproducible final logs: [tests](test-logs/final-tests.txt), [browser](test-logs/final-browser.txt), [launcher](test-logs/final-launcher.txt), [build](test-logs/final-build.txt), [source verification](test-logs/final-data.txt). Final browser run follows the evidence-first drawer change; all 17 tests pass.
