# Phase 8 — Configuration & Env Validation

Goal
- Prevent runtime surprises by validating configuration and environment values on startup.

Scope
- Centralize config in `src/config.ts` and validate with Zod.
- Validate: API base URLs, feature flags (booleans/strings), optional Sentry DSN, etc.
- Provide sensible defaults for local dev.

Out of Scope
- Changing feature behavior; only validation and centralization.

Implementation Steps
- Create `src/config.ts` that reads from `import.meta.env` and validates via zod schemas.
- Export a typed `config` object for services and features to consume.
- Replace scattered config usages with imports from `src/config.ts`.

Acceptance Criteria
- App fails fast in dev if critical env is missing or invalid, with a clear error.
- Services and features import from the single config source.

Guardrails
- Keep defaults for local dev; do not block boot on non-critical optional values.
