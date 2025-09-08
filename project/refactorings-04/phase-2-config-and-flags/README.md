# Phase 2: Config & Feature Flags (Centralized, Typed)

Goal: Centralize configuration and feature flags in a single typed module without changing behavior.

Reference: `project/refactorings-04/plan.md`

## Tasks
- Create a typed config/flags module (e.g., `src/config/`) with:
  - `config.ts` for environment-derived values (safe defaults)
  - `flags.ts` for feature flags (e.g., `ENABLE_BLOB_EVENTS`, `USE_HTTP_REPO`)
- Ensure no runtime changes: keep existing imports working; the new module is additive.
- Document flag intent and default values in code comments and this README.

## Acceptance Criteria
- TypeScript compiles; no imports switched yet.
- Flags are defined and discoverable, but not consumed in runtime logic.
- `STATUS.md` will be updated after review.
