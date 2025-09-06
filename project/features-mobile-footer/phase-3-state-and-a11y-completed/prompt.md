# Phase 3 — State Awareness and Accessibility

Goal
- Make footer actions intelligently enabled/disabled based on app state and improve accessibility.

Scope
- Disable Reveal when no more hints; disable Upload while uploading; show View Collage vs Create Collage appropriately.
- Add aria-labels to all buttons and ensure focus styles are visible.
- Keyboard support: Enter/Space activates; ensure footer is reachable in tab order.

Out of Scope
- Desktop/tablet visual tweaks (Phase 4).

Implementation Steps
- Compute capability flags in `App.jsx` (e.g., `canRevealHint`, `canUpload`, `hasCompleted`, `hasCollage`).
- Pass flags to `FooterNav` and conditionally disable/alter labels.
- Provide descriptive aria-labels (e.g., "Upload photo for current task").
- Verify z-index and interaction with modal overlays.

Acceptance Criteria
- Buttons reflect real availability and are not clickable when disabled.
- Screen readers announce clear labels; keyboard users can activate each action.
- No regressions in footer layout or tab-driven behavior.

References
- `src/App.jsx` (state and handlers)
- `src/features/app/StopCard.tsx` (upload state reference)
