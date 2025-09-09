# Storage Migration Feature

This feature delivers a zero-downtime migration of application data from Netlify Blobs/KV to Azure Table Storage, fully abstracted from the UI and concentrated in the API/service layer.

## Objectives

- Abstract storage behind repository ports so UI depends only on versioned REST APIs.
- Introduce Azure Table Storage as the primary datastore, keeping Netlify Blobs as fallback during transition.
- Preserve optimistic concurrency via ETags and add idempotency for writes and migrations.
- Ensure safe rollout with dual-write and read-through fallback feature flags.
- No mock data; all work is against real data models and code paths in this repo.

## Scope (Codebase-aware)

- Repositories and adapters:
  - `src/ports/` remain stable contracts (`EventRepoPort`, `OrgRepoPort`).
  - Implement Azure adapters in `src/infra/storage/`.
  - Keep existing Blob adapters for fallback and parity.
- Services:
  - `src/services/AzureTableService.ts` wraps `@azure/data-tables` with ETag support.
  - Harden `huntDomainService` (or new domain services) for normalization, validation, caching, and retries.
- API:
  - Keep `src/server/eventsRouteV2.ts` as orchestration only; data shaping moves into services.
  - Maintain stable v2 endpoints; introduce minimal new endpoints only if needed.
- Functions (optional bridge):
  - `netlify/functions/kv-get.ts` and `kv-upsert.ts` can proxy to Azure to avoid any client changes during transition.
- Tooling:
  - Migration/backfill script under `scripts/` with dry-run, checkpointing, and parity checks.
  - Local Azurite setup for dev/CI.

## Feature Flags

- `ENABLE_AZURE_TABLES`
- `DUAL_WRITE_TO_AZURE`
- `READ_FROM_AZURE_FIRST`
- `ENABLE_AZURITE_LOCAL` (dev only)

## Tables and Keys (Azure Table Storage)

- AppRegistry: PK=`app`, RK=`config` → serialized AppData JSON, ETag.
- Orgs: PK=`{orgSlug}`, RK=`org` → serialized OrgData JSON, ETag.
- Hunts (optional for queryability): PK=`{orgSlug}`, RK=`{huntId}` → minimal projection columns.
- HuntIndex: PK=`YYYY-MM-DD`, RK=`{orgSlug}:{huntId}` → for listToday.
- Media remains in blob/object storage (out of scope for this feature).

## Phases

1. Discovery and Schema Design
2. Service + Adapters (Azure) and Repository Factory
3. Migration Tool + Azurite Setup
4. Dual-Write and Read-Through Fallback
5. Staging Backfill + Parity Validation
6. Production Cutover + Shadow Writes
7. Decommission Netlify Blobs + Documentation

See individual phase folders for prompts and acceptance criteria.

## Acceptance Criteria (Overall)

- UI unchanged; all storage complexity isolated behind APIs.
- Azure adapters pass integration tests with Azurite.
- Migration completes with parity verified on sampled data.
- Feature flags allow instant rollback to Blob reads.
- Netlify Blob storage decommissioned after stable period.
