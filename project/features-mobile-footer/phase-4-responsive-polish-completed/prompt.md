# Phase 4 — Responsive Polish and Robustness

Goal
- Refine the footer for larger screens and edge cases, ensuring it plays nicely with modals, keyboards, and different viewports.

Scope
- Consider sticky vs fixed on tablet/desktop; adjust spacing and hit areas.
- Ensure modals/sheets overlay correctly and don’t conflict with the footer.
- Handle on-screen keyboard: optionally compress or hide footer when inputs are focused.
- Add lightweight analytics for footer actions (optional).

Out of Scope
- New app features; this is UI polish.

Implementation Steps
- Add media queries for larger breakpoints: maybe reduce shadow and increase spacing.
- Verify z-index with tips modal and any future overlays.
- Test on iOS/Android with the virtual keyboard; adjust layout if needed.
- Optionally add analytics hooks on footer button clicks.

Acceptance Criteria
- Footer looks correct on mobile and decent on tablet/desktop.
- No overlap or interaction conflicts with modals and on-screen keyboard.
- Accessibility remains intact.

References
- `src/App.jsx` (layout and modals)
- `src/features/app/Header.tsx` (visual reference)
