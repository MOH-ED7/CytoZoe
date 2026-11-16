# CytoZoe product features and workflows

- **5 pages:**
  - Landing / introduction
  - Health Overview
  - Health Trends
  - Radiation Review
  - Review Log & Export
- **3 charts:**
  - blood marker by visit
  - sensor dose rate
  - estimated accumulated sensor dose
- **3 deterministic engines:**
  - **E1 ingestion & quality:** hashing, schema validation, conflict quarantine
  - **E2 health comparisons:** retrospective preflight mean, Δ, %Δ, strict range status
  - **E3 environment integration:** trapezoidal estimate over covered intervals only
- **1 evidence drawer:** a *Verified explanation* assistant built from fixed, source-bound templates. No language model is involved.
- **Real-time features, with no fabricated "live" data:**
  - **Radiation replay stream:** the server streams the 1,194 recorded DosTel1 readings over server-sent events, in their original order, at 300×, 1200× or 3600× speed. Rate, peak, estimated dose so far and coverage update as they arrive. Data-quality conflicts appear in an event feed at the moment the stream reaches them. Always labelled *Replay · not live*.
  - **Mission timeline replay:** steps through a participant's 7 real blood draws. The whole Overview (cards and findings) updates visit by visit, and range flags appear in an event feed.
  - **Live sync:** saving or changing a review pushes an event to every open window. Tabs refresh instantly, the sidebar's *Recent reviews* updates, and other windows get a notice. A tab with an unsaved draft is never silently rebased; it gets a 409 conflict prompt instead.
- **Conversational assistant:** suggested questions or a typed question. Typed text is routed by fixed keyword rules to the same verified templates, so there is no language model, and the typed text is never echoed into an answer.
- **Persistent reviews:** statuses OPEN / FOLLOW_UP_REQUESTED / REVIEWED, optimistic versioning (HTTP 409 on stale edits), and an audit history.
- **Local export:** a self-contained printable HTML packet plus a JSON packet, with health and environment sections kept separate. Both carry source hashes, provenance, rule versions and limitations.
- **Mission Health Intelligence Brief** (`GET /api/mission/brief`): one typed, source-linked summary of a historical sample. For each marker it gives what was observed, what it was compared with, the exact source row and column, why it was flagged, the limits, and what follow-up can be recorded. It is built only from the canonical evidence objects, so every number matches the evidence view and the export. See [docs/API_CONTRACT.md](API_CONTRACT.md).
- **Verified provenance:** only files whose SHA-256 is registered in the reviewed manifest can be stored as NASA data. A schema-valid but altered file is rejected (`SOURCE_HASH_MISMATCH`), even on an empty database.
- **Operational readiness:** `/api/healthz` (liveness), `/api/readyz` (DB + migrations + verified data). Launchers report real readiness, refuse busy ports and leave no orphaned processes. `scripts/backup_db.py` makes and restores consistent database backups.

Stack: React 19 + TypeScript + Vite + Recharts · FastAPI + Pydantic + pandas · SQLite (WAL, versioned migrations). The server binds to **127.0.0.1:8000** and serves the API and the built interface from one origin. It uses no CDNs, analytics or cloud APIs, and the Inter font is bundled locally.
