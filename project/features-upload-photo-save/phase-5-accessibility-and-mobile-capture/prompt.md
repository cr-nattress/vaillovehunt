# Phase 5 — Accessibility & Mobile Capture

Goal
- Ensure the new local preview/save flow is accessible and works smoothly on mobile devices with camera capture.

Scope
- File input improvements:
  - `<input type="file" accept="image/*" capture="environment">` for mobile camera usage.
  - Keyboard and screen reader-friendly labels (contextual to the stop title).
- Announce status changes (preview ready, saved locally, removed) via an `aria-live` polite region.
- Manage focus after key actions (select, save, cancel) so users don’t lose their place.

Out of Scope
- Server sync or queueing.

Implementation Steps
- Add/verify `aria-label` on Select/Save/Change/Cancel buttons (e.g., “Select photo for <stop title>”).
- Ensure only one file input is tabbable, paired with a visible button via `label for` wiring.
- Add an `aria-live="polite"` region near the StopCard actions to announce “Preview ready”, “Saved locally”, etc.
- On Save/Cancel, programmatically focus the next logical action (e.g., Change Photo or Select Photo) to keep keyboard flow steady.

Acceptance Criteria
- Users can select and save photos with keyboard-only and screen readers announce status changes.
- Mobile users can open the camera reliably when tapping Select Photo.
- Focus remains predictable and visible throughout the flow.
