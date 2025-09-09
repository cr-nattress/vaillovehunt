# Phase 2: Services and Adapters (Azure) + Repository Factory

Objective: implement Azure Table adapters and service layer hardening while keeping ports stable.

## Inputs (Codebase)
- Ports: `src/ports/*.ts`.
- Domain service: `src/services/domain` (e.g., `huntDomainService`).
- Routes: `src/server/eventsRouteV2.ts`.

## Tasks
- Create `src/services/AzureTableService.ts` wrapping `@azure/data-tables` with:
  - getEntity, upsertEntity, query, ETag handling, retries, timing logs.
- Implement adapters:
  - `src/infra/storage/azure-table.org.adapter.ts` implements `OrgRepoPort`.
  - `src/infra/storage/azure-table.events.adapter.ts` implements `EventRepoPort` using HuntIndex.
- Add repository factory selection by flags (Azure primary, Blob fallback) in server composition root.
- Move normalization (e.g., status/date shaping) from `eventsRouteV2.ts` into domain translator(s).
- Add config flags in `src/config/flags.ts` and wire in `src/config/config.ts`.

## Acceptance Criteria
- Compilable Azure adapters with unit tests for ETag paths.
- `eventsRouteV2.ts` contains no data normalization logic.
- Repository factory returns the correct adapter based on flags.
