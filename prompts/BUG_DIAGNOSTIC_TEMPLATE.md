# Bug: [Short, specific title]

## Summary
- [One-line description of the visible symptom]
- [Impact and severity: user-facing, data loss, blocker, etc.]
- [Environment: local vs Netlify dev vs production; team/location/event/session if relevant]

## Reproduction
- Steps:
  - [1]
  - [2]
  - [3]
- Expected:
  - [What should happen]
- Actual:
  - [What actually happens]

## Code Map
- UI entry point:
  - [`path/to/component.tsx`] — user action handler: [`onClick`, `onChange`, `onSubmit`]
- State:
  - [`path/to/store.store.ts`] — fields: [`fieldA`, `fieldB`], actions: [`updateX`, `resetY`]
- Data flow:
  - [User event → handler → store update → render condition → UI/DOM]
- Services / network (if applicable):
  - Client: [`path/to/service.ts`]
  - Serverless/API: [`netlify/functions/xyz.ts`]
  - Env/base: [`src/services/apiClient.ts`]

## Diagnostics Checklist (run top-to-bottom)
- UI/DOM
  - Confirm nodes exist for expected UI in the DOM.
  - Inspect computed styles: visibility, display, opacity, overflow, z-index, color contrast.
  - Check conditional rendering and attributes controlling visibility (`hidden`, `aria-hidden`, class toggles).
- State
  - Log store slice before/after action (`useStore.getState()`).
  - Ensure immutable updates and new object identity.
  - Verify consumers subscribe via selectors and actually re-render.
- Effects
  - Identify side effects that may overwrite/restore state (e.g., team-switch hydration).
  - Temporarily guard/disable to isolate.
- Network (if applicable)
  - Verify base URL, method, status, response body.
  - Surface server error bodies to UI (not just generic failures).
  - Check Netlify function logs and required env variables.
- CSS/Animation (if applicable)
  - Ensure keyframes exist and `animation-fill-mode: forwards` or final styles set explicitly.
  - Confirm no clipping due to `overflow: hidden` or transforms; verify final `opacity: 1`.
- Tests
  - Add a minimal test reproducing user action and asserting DOM/state changes.
  - If animated visibility is involved, assert computed styles or set final explicit styles during test.

## Hypotheses (mark true/false with evidence)
- [stale_prop_progress]: Downstream consumer reads stale props instead of store selector.
- [visibility_toggle_logic]: The condition/hidden attribute prevents showing revealed content.
- [css_animation]: Animation leaves element invisible (opacity/display/overflow).
- [reset_side_effect]: Unrelated effect resets or rebuilds store after update.
- [env_network]: Wrong base URL, missing env, or failing serverless function/API.
- [data_shape]: Unexpected data (null/empty) causes guard to short-circuit.

## Evidence
- DOM:
  - [Nodes exist? Visible? Computed styles?]
- Store:
  - [Before vs after values; object identity changed?]
- Logs:
  - [Key console lines showing branching and results]
- Network:
  - [URL, status, response body, function logs]
- Tests:
  - [Failing assertions or snapshots]

## Root Cause
- [One-line causal statement tied to the evidence above]

## Fix Plan (minimal viable change)
- [1–3 precise edits with file paths and symbols]
- [Guards to prevent clobbering from effects]
- [Explicit visibility styles if animations are unreliable]
- [Improve error surfacing in UI]

## Acceptance Criteria
- [User action produces expected UI/state change]
- [No regressions to adjacent flows]
- [Tests cover the path and pass reliably]

## Post-Fix Validation
- Manual QA checklist
- Test run results
- Optional: dev-only probe or enhanced logging toggle

## Complexity Estimate
- Trivial / Low / Medium / High / Critical blocker
- [Justification: scope, cross-module impact, environment coupling]

## Runbook (quick commands/URLs)
- Local Netlify dev (functions): `npm run start:netlify`
- Vite + API server: `npm run start`
- Check env:
  - Local `.env.local`: [keys]
  - Netlify: Site → Settings → Environment
- Key URLs:
  - API base: [from `src/services/apiClient.ts`]
  - Function endpoint(s): `/.netlify/functions/[name]`
