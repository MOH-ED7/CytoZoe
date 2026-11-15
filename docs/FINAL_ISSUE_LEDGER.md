# Final integrated build issue ledger — 15 November 2026

Baseline: branch Mumin, commit 0b32d9e. Untracked root package-lock.json preserved; checkpoint stored outside Git under /tmp/cytozoe-checkpoint. v3 backend and frontend v2 already merged. No scientific engine or API changes.

| Severity | Module | Finding | Smallest fix | Verification |
|---|---|---|---|---|
| P0 | backend/pyproject.toml | Root npm test cannot import app on this environment | Configure pytest pythonpath relative to backend | npm test |
| P0 | Overview | Large duplicate Mission Brief competes with measurements | Keep endpoint and panel, collapse secondary details; compact seven-visit navigation | All-28-sample brief test, responsive checks, final-release test |
| P0 | Reviews | Download links do not communicate API failures | Checked fetch, browser download, visible status, retry | Parsed HTML/JSON journey; injected 503 recovery test |
| P0 | Release checks | Old Windows results do not establish current Mac behavior | Rerun full suite and launcher on Mac | Current logs and screenshots |
| P1 | Product | Crew check-in is optional and unrelated to source-backed review | Defer to protect release | No schema/data changes |

The first browser run used the old export-link locator and failed after the control became a button. Visual review also showed the explanation composer above the observation; the drawer now presents observation, calculation and source first. The locator was updated to its correct semantic role; parsing, scientific assertions and offline assertions remain intact. Collapsed panels are opened explicitly before existing assertions. No assertions were weakened.
