# Phase 3: Schemas & Migrations (App/Org JSON Contracts)

Goal: Add versioned Zod schemas for App/Org JSON and a migration scaffold. No runtime wiring yet.

Reference: `project/refactorings-04/plan.md`, `project/features-updated-data-model/NOTES.md`

## Tasks
- Ensure `src/types/appData.schemas.ts` exists (App JSON) and add `CURRENT_APP_SCHEMA_VERSION`.
- Create `src/types/orgData.schemas.ts` (Org JSON) and add `CURRENT_ORG_SCHEMA_VERSION`.
- Create `src/lib/migrations/` with placeholder functions:
  - `migrateAppJson(data: unknown): AppJson`
  - `migrateOrgJson(data: unknown): OrgJson`
  - Include per-version steps (vN→vN+1) with TODOs.
- Add lightweight tests or notes for how to validate schemas in isolation.

## Acceptance Criteria
- TypeScript compiles.
- Schemas export versions and default values.
- Migration scaffold functions exist with TODOs and typed signatures.
- No runtime changes.
