# Phase 2 Prompt: Config & Feature Flags (Centralized, Typed)

Implement a centralized config and flags module with safe defaults. Do NOT switch runtime to use it yet.

Tasks:
1) Create `src/config/config.ts` to export typed configuration derived from env (with safe defaults).
2) Create `src/config/flags.ts` to export typed feature flags (`ENABLE_BLOB_EVENTS`, `USE_HTTP_REPO`, etc.).
3) Add doc comments describing each flag and intended rollout strategy.
4) Ensure the app builds and existing imports are unaffected.

Validation:
- TypeScript compiles.
- New modules exist and are discoverable.
- No behavior changes yet; `STATUS.md` updated after review.
