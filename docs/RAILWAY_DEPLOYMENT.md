# Railway public research demo

Use the existing `MOH-ED7/CytoZoe` main branch and the existing CytoZoe Railway service. No replacement project is needed.

## Required service configuration

- Repository root: `/` (not `frontend`). Builder: Dockerfile, Dockerfile path: `Dockerfile`. Configure this explicitly in Settings.
- Leave custom build/start overrides empty; the image starts `scripts/railway_start.py`.
- Attach a persistent volume **to this service** at `/data`. Keep one replica.
- Railway injects `RAILWAY_VOLUME_MOUNT_PATH` for the volume and `PORT` for HTTP. Startup fails closed unless `/data` is an actual mount. SQLite is `/data/cytozoe.sqlite`, including its WAL/SHM files.
- Generate a Railway domain. `RAILWAY_PUBLIC_DOMAIN` is used as an exact allowed host automatically; health probes use `healthcheck.railway.app`. For a later custom domain, add only its exact hostname to `CYTOZOE_ALLOWED_HOSTS` (comma-separated). No wildcard hosts or permissive CORS.
- Healthcheck: `/api/readyz`, 300 seconds. Restart: On Failure, 3 retries. Liveness: `/api/healthz`.
- Railway now deprecates per-service `railway.toml`; new services cannot opt in and legacy support ends 2026-12-01. Use the dashboard settings above; the optional local TOML is not the source of truth. A later IaC migration must import/review the existing project rather than provision a duplicate.
- Fetch/strict SHA-256 verification runs during image build. Startup re-verifies the files, applies existing migrations and atomically/idempotently imports the pinned source datasets into the mounted database. Never use `--allow-new-version` or copy a private/local review database into the image.
- Public entry point always enables read-only demo mode. All write verbs are blocked except stateless `POST /api/explain`. Anonymous visitors can inspect evidence, replay radiation and download exports; save/edit/import actions receive an explicit 403. Existing local launchers keep their normal writable, loopback-only behavior.

Only use public-safe review content in this service's volume: read-only hosting prevents modification, not reading/exporting existing notes. A fresh volume starts without fabricated sample reviews. Enable Railway volume backups and restore only approved snapshots. Do not remove/recreate an existing volume during redeploys.

## Verification

Build: `docker build -t cytozoe-railway:verify .`. For local container smoke testing, use a fresh named Docker volume mounted at `/data`, set `RAILWAY_VOLUME_MOUNT_PATH=/data`, and publish port 8000; never mount the normal local runtime database. Verify five routes, both health endpoints, source hashes, replay and exports; POST/PATCH review requests must return `PUBLIC_DEMO_READ_ONLY`. Local writable behavior remains covered by the backend and browser regression suites.

A Docker build, deployed health status and working HTTPS URL are separate checks. Do not claim production success before all are observed. Verified locally on 2026-11-15: final multi-stage Docker build passed (including TypeScript and Vite); 64 backend tests passed, including public write blocking, host validation and missing-volume refusal. Running-container smoke checks passed for all five pages, health/readiness, source evidence (C001/L-3 creatinine 1.37), JSON export and radiation SSE replay. Review POST/PATCH and import returned the expected read-only 403. The existing frontend release browser run passed 25 tests; component tests remain blocked by a Vitest worker-start timeout and must not be described as passing.

Railway account inspection found the existing `terrific-insight` production / `CytoZoe` service. Its GitHub connection reports “Auto deploy unavailable / Could not load branches.” No working public deployment is claimed. Use Source > Retry (or repair the existing GitHub integration), confirm `MOH-ED7/CytoZoe` / `main`, attach `/data`, configure Dockerfile/health settings above, and deploy the latest commit. Generate a domain targeting the service PORT (8080 if using Railway’s default); verify HTTPS readiness before announcing the URL.

## GoDaddy (only after a domain is chosen)

1. In this Railway service's Networking settings, add the exact domain/subdomain you own.
2. Copy the DNS records Railway actually generates, including any ownership-verification TXT record. Do not guess a target from the service name or Railway domain.
3. In GoDaddy DNS, add those exact record types, names and values. Remove only a conflicting record for the same hostname after reviewing it. Preserve MX/TXT/email records.
4. For an apex hostname, follow Railway's displayed provider-specific instructions; use a supported `www` CNAME and apex forwarding if the provider cannot support the required apex record.
5. Add the exact custom hostname to `CYTOZOE_ALLOWED_HOSTS`, redeploy, then verify DNS validation, issued HTTPS certificate and both health endpoints.

References: https://docs.railway.com/builds/dockerfiles · https://docs.railway.com/volumes · https://docs.railway.com/deployments/healthchecks

Current platform reference: https://docs.railway.com/infrastructure-as-code
