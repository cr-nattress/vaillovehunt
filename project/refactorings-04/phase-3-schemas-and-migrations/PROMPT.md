# Phase 3 Prompt: Schemas & Migrations (App/Org JSON)

Implement versioned schemas and migration scaffolds. Do NOT wire to runtime yet.

Tasks:
1) App JSON schema
   - Ensure `src/types/appData.schemas.ts` exports `AppJsonSchema`, types, and `CURRENT_APP_SCHEMA_VERSION` (e.g., '1.0.0').
2) Org JSON schema
   - Create `src/types/orgData.schemas.ts` with `OrgJsonSchema`, types, and `CURRENT_ORG_SCHEMA_VERSION`.
3) Migration scaffolds
   - Add `src/lib/migrations/` with:
     - `app.migrations.ts` exporting `migrateAppJson(data: unknown): AppJson` (use zod parse for now; add TODO for version steps).
     - `org.migrations.ts` exporting `migrateOrgJson(data: unknown): OrgJson` (zod parse + TODOs).
4) Notes/tests
   - Add brief notes in each file on how version bumps will be handled.
   - Optional: a tiny unit test or comment with example usage.

Validation:
- TypeScript compiles.
- Both schemas and migration functions export typed signatures.
- No app imports changed. Update STATUS after review.
