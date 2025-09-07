# Phase 4 — Performance & Polish (Lazy images, animations)

Goal
- Improve perceived performance and smoothness while keeping behavior unchanged.

Scope
- Lazy-load completed photos in `CompletedAccordion.tsx` only when expanded/visible.
- Prefer transform/opacity animations over layout-affecting ones in `stop-card/*`.
- Memoize static sections of `StopCard` and avoid unnecessary re-renders.

Out of Scope
- Functional changes to upload or navigation.

Implementation Steps
- CompletedAccordion: render a lightweight thumbnail (small `src` or CSS background) by default; load full image when the row expands (IntersectionObserver or expand event).
- StopCard: ensure animations use `transform` and `opacity`; avoid changing `top/left/height` where possible.
- Add `React.memo` strategically to subcomponents that receive stable props.

Acceptance Criteria
- Scrolling and expand/collapse interactions feel snappier on mid-tier devices.
- No image loading until content is visible/expanded.
- No visual regressions in transitions and layout.

Guardrails
- Keep image alt text accurate; do not lazy-load critical images needed for context.
- Test on mobile viewport to verify no content jank.
