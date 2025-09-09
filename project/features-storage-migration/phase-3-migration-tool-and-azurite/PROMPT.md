# Phase 3: Migration Tool + Azurite Setup

Objective: build an idempotent backfill from Netlify Blobs to Azure Tables and set up Azurite for dev/CI.

## Inputs (Codebase)
- Reader: `src/services/BlobService.ts` via `/api/kv-get`.
- Writers: `src/services/AzureTableService.ts` (to be added).
- Data: `app.json`, `orgs/{org}.json`.

## Tasks
- Create `scripts/migrate-netlify-to-azure.ts`:
  - Enumerate known orgs from `app.json.organizations`.
  - Read each `orgs/{org}.json`; validate with existing Zod validators.
  - Upsert AppRegistry, Orgs, Hunts (optional), HuntIndex.
  - Idempotent: safe to re-run; checkpoint file `.migration-checkpoints.json`.
  - `--dry-run` to print planned writes; `--resume` to continue.
- Add Azurite setup docs to `STARTUP.md` and optional CI step.

## Acceptance Criteria
- Dry-run prints correct plan without writes.
- Full run completes and is safe to re-run.
- Azurite instructions verified locally.
