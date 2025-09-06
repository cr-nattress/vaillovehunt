# Phase 6 — Accuracy Controls, Battery & Performance

Goal
- Make accuracy thresholds and timeouts configurable, and provide a refine flow for low-accuracy cases.

Scope
- Add options to `getUserLocationSmart()` and `useLocation()` to accept `{ timeoutMs, accuracyThresholdM }`.
- Provide a refine prompt when `accuracy > threshold`.
- Avoid battery drain: use `getCurrentPosition` by default; add optional throttled `watchPosition` with cleanup.

Out of Scope
- UI modal/panel for refine flow (a simple notice/button is sufficient here).

Implementation Steps
- Update `src/location/location.ts` to accept options and pass to `getPreciseLocation`.
- Update `src/location/useLocation.ts` to surface `accuracy` and gated refine CTA.
- If you add `watchPosition`, throttle to ~10–20s and stop on unmount.

Acceptance Criteria
- Poor accuracy triggers a visible, non-blocking refine prompt.
- No continuous GPS usage unless explicitly enabled.
- Timeouts and accuracy thresholds are configurable via function args or config.
