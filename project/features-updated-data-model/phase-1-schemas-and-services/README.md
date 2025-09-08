# Phase 1: Schemas and Services

Goal: Introduce validated schemas and core services for the new App/Org JSON data model without changing any UI.

Reference: `project/features-updated-data-model/NOTES.md`

Tasks:
- Add Zod schemas
  - `src/types/appData.schemas.ts` for App JSON
  - `src/types/orgData.schemas.ts` for Org JSON
- Add service scaffolds
  - `src/services/BlobService.ts` – read/write JSON with etag/updatedAt
  - `src/services/OrgRegistryService.ts` – orchestrate App/Org JSON operations
- No UI wiring yet; keep mocks and existing flows.

Acceptance Criteria:
- Type checks pass.
- Services compile and expose typed methods.
- No visible app behavior changes.
