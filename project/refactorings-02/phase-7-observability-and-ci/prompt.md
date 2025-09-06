# Phase 7 — Observability & CI (Logs, Sentry, CI checks)

Goal
- Catch issues earlier and get actionable telemetry without burdening developers.

Scope
- Structured logging helpers (area, action, status, metadata).
- Optional error reporting (e.g., Sentry) gated by environment flag.
- CI pipeline: typecheck, lint, unit/integration tests, and preview deploy.

Out of Scope
- App feature changes.

Implementation Steps
- Create `src/utils/log.ts` with helpers: `logInfo`, `logWarn`, `logError` that accept `{ area, action, ...meta }`.
- Integrate logging into critical flows (upload, photos fetch, feed fetch) replacing ad-hoc `console.log`.
- Add optional Sentry (or similar). Guard with env var (e.g., `VITE_SENTRY_DSN`) and noop in dev.
- Add basic GitHub Actions (or your CI) workflow:
  - install deps, `npm run typecheck`, `npm run lint`, `npm test`, build
  - optional: Netlify/Vercel preview deploy on PRs

Acceptance Criteria
- Logs are consistent and include area/action tags.
- CI blocks merges when typecheck/lint/tests fail.
- If Sentry is configured, runtime errors report with useful context and source maps.

Guardrails
- No PII in logs. Ensure DSN only in prod via env.
