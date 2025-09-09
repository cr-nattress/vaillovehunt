# Bug: Send magic link throws error

## Summary
- Clicking "Send Magic Link" on the splash screen fails with "TypeError: Failed to fetch".
- Severity: User-facing blocker for returning participants; prevents login via magic link.
- Environment: Local development (Vite + Express). Netlify dev and production unaffected by this specific root cause.

## Reproduction
- Steps:
  - Open the app locally with `npm run start` (spawns Vite at 5173 and Express at 3001).
  - Navigate to "Continue Your Hunt" on the splash screen.
  - Enter a valid email and click "Send Magic Link".
- Expected:
  - A POST request to `/api/auth/magic-link` returns 200 with `success: true`.
  - UI shows success toast and advances to `magic-link-sent` step.
- Actual:
  - Console shows:
    - `apiClient.ts:181` ❌ Request failed (attempt 1): Failed to fetch
    - `AuthService.ts:58` ❌ Failed to send magic link: TypeError: Failed to fetch
    - `UnifiedSplashScreen.tsx:178` Failed to send magic link: TypeError: Failed to fetch

## Code Map
- UI entry point:
  - `src/features/event/UnifiedSplashScreen.tsx` — user action handler: `onSubmit` `handleMagicLinkSubmit()`
- State:
  - Local component state: `magicLinkEmail`, `magicLinkLoading`, `emailError`, `step`.
- Data flow:
  - User clicks submit → `handleMagicLinkSubmit()` → `authService.sendMagicLink()` → `apiClient.post('/auth/magic-link')` → Express router route `/api/auth/magic-link` → `emailService.sendMagicLinkEmail()` and JSON response handling → UI step change to `'magic-link-sent'`
- Services / network:
  - Client: `src/services/AuthService.ts` and `src/services/apiClient.ts`
  - API server: `src/server/authRoute.ts` mounted at `/api/auth` in `src/server/server.ts`
  - Env/base: `VITE_API_URL` (from `.env`/`.env.local`), and base URL resolution in `src/services/apiClient.ts`

## Diagnostics Checklist (run top-to-bottom)
- UI/DOM
  - Confirmed form renders and submit fires `handleMagicLinkSubmit()`.
- State
  - Local state toggles `magicLinkLoading` as expected; error is surfaced via `emailError`.
- Effects
  - No interfering effects detected in this path.
- Network
  - Base URL: `apiClient.resolveApiBase()` used `http://localhost:3002/api` during dev, but server runs on port `3001`.
  - Endpoint: `POST /auth/magic-link` should map to `http://localhost:3001/api/auth/magic-link`.
  - Response: Request fails before reaching server due to port mismatch ("Failed to fetch").
  - Env: `update-port.js` previously wrote `VITE_API_URL` without `/api` suffix, which would produce an incorrect base if used.
- CSS/Animation
  - Not applicable.
- Tests
  - No existing test for magic link flow; consider adding a minimal integration test.

## Hypotheses (T/F)
- [stale_prop_progress]: False — local state is updated and handler is called.
- [visibility_toggle_logic]: False — error occurs prior to UI state transition.
- [css_animation]: False — unrelated to network failure.
- [reset_side_effect]: False — no effect resetting the step in this flow.
- [env_network]: True — base URL/port mismatch in dev; `VITE_API_URL` also missing `/api` when updated by script.
- [data_shape]: False — request does not reach the server to produce a response body.

## Evidence
- Logs:
  - apiClient logs: “❌ Request failed (attempt 1): Failed to fetch”
  - UnifiedSplashScreen catch logs: “Failed to send magic link: TypeError: Failed to fetch”
- Code:
  - `src/services/apiClient.ts` defaulted to `http://localhost:3002/api` in dev, while server is at `3001` (`src/server/server.ts`).
  - `update-port.js` wrote `VITE_API_URL=http://localhost:<port>` (without `/api`).
- Server:
  - `src/server/server.ts` mounts `authRouter` at `/api/auth`.
  - `src/server/authRoute.ts` handles `POST /magic-link` and `GET /verify`.

## Root Cause
- In development, the client used a base URL pointing to port `3002` while the Express API runs on port `3001`. Additionally, the env update script could produce a `VITE_API_URL` without the `/api` suffix, further misrouting requests. The request never reached the server, leading to “Failed to fetch.”

## Fix Plan (minimal viable change)
- `src/services/apiClient.ts`
  - Update development base URL to `http://localhost:3001/api`.
  - Continue to prefer `VITE_API_URL` if defined.
- `update-port.js`
  - Ensure it writes `VITE_API_URL=http://localhost:<port>/api` (with `/api` suffix).
- Type safety and logging improvements:
  - Add `src/vite-env.d.ts` to provide `import.meta.env` typings.
  - Harden `apiClient` catch block to handle unknown error safely and log the message.

## Acceptance Criteria
- Submitting the “Send Magic Link” form triggers a successful POST to `/api/auth/magic-link` (200, JSON `success: true`).
- UI advances to `magic-link-sent` and shows a success toast.
- No regressions to event loading or other API calls in dev.
- If `VITE_API_URL` is set, it is respected; otherwise, the fallback correctly targets `3001`.

## Post-Fix Validation
- Manual QA
  - `npm run start`
  - In the app, go to “Continue Your Hunt”, enter an email, submit.
  - Observe network: POST `http://localhost:3001/api/auth/magic-link` → 200 success.
  - UI shows “Magic Link Sent”.
- Test run
  - Existing tests still pass. Consider adding a small integration/unit test for `apiClient` base URL resolution in dev.
- Optional dev probes
  - Keep `apiClient` console logs for request URL and response code visible in dev to aid future diagnostics.

## Complexity Estimate
- Low
- Justification: Small, isolated changes in client URL resolution and a helper script; minimal cross-module impact.

## Runbook (quick commands/URLs)
- Local Netlify dev (functions): `npm run start:netlify`
- Vite + API server: `npm run start`
- Check env:
  - Local `.env.local` / `.env`: `VITE_API_URL`, `RESEND_API_KEY`, etc.
  - Netlify: Site → Settings → Environment
- Key URLs:
  - API base (dev): `http://localhost:3001/api` (from `src/services/apiClient.ts`)
  - Endpoint: `POST http://localhost:3001/api/auth/magic-link`
  - Health: `http://localhost:3001/health`
