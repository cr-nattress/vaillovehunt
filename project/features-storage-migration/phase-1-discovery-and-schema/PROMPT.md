# Phase 1: Discovery and Schema Design

Objective: finalize a storage-agnostic design and Azure Table schema mapped to real code paths.

## Inputs (Codebase)
- Ports: `src/ports/event.repo.port.ts`, `src/ports/org.repo.port.ts`.
- Blob adapters: `src/infra/storage/blob.adapter.ts`, `src/infra/storage/events.blob.adapter.ts`.
- Services: `src/services/BlobService.ts`, `src/services/OrgRegistryService*`.
- API: `src/server/eventsRouteV2.ts`.
- Data model: `docs/NEW_DATA_MODEL.md`.

## Tasks
- Review and lock repository interfaces (no breaking changes).
- Define Azure Table schema and keys:
  - AppRegistry (PK: `app`, RK: `config`).
  - Orgs (PK: `{orgSlug}`, RK: `org`).
  - Hunts (optional projection) (PK: `{orgSlug}`, RK: `{huntId}`).
  - HuntIndex (PK: `YYYY-MM-DD`, RK: `{orgSlug}:{huntId}`).
- Define ETag concurrency semantics mapping to Azure ETag.
- Define feature flags: `ENABLE_AZURE_TABLES`, `DUAL_WRITE_TO_AZURE`, `READ_FROM_AZURE_FIRST`, `ENABLE_AZURITE_LOCAL`.
- Decide API DTOs and normalization rules (move from routes to service layer).

## Deliverables
- Updated design in `project/features-storage-migration/README.md` (this feature).
- A short ADR snippet (if using docs/adr) referencing chosen keys and flags.

## Acceptance Criteria
- Schema defined with PartitionKey/RowKey for each table.
- No changes required by UI; all contracts remain in v2 endpoints.
- Concurrency, idempotency, and fallback behavior documented.
