# Phase 1 Prompt: Schemas and Services

Reference notes: `project/features-updated-data-model/NOTES.md`

Implement validated schemas and core services without changing UI behavior.

Tasks:
1) Add Zod schemas
   - Create `src/types/appData.schemas.ts` (App JSON) and `src/types/orgData.schemas.ts` (Org JSON).
   - Include: schemaVersion, etag, updatedAt, app.features, organizations, byDate; org.hunts with rules, teams/teamCaptain+teamMembers, uploads, stops, scoring, moderation, audit, archival.
2) Add services
   - `src/services/BlobService.ts`: `readJson<T>(key)`, `writeJson<T>(key, data, expectedEtag?)` (no-op implementations acceptable initially) with TODOs for Netlify functions wiring.
   - `src/services/OrgRegistryService.ts`: `loadApp`, `loadOrg`, `upsertApp`, `upsertOrg`, `addOrg`, `addHuntToOrg`, `updateByDateIndex`.
3) Export types for use in later phases.

Validation:
- Type checks pass.
- Services compile; methods stubbed and documented.
- No changes visible in the app.
