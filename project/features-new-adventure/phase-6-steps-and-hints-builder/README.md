# Phase 6: Steps & Hints Builder (with optional image)

Goal: Add a new wizard step to define hunt steps (stops) with hints and an optional image per step. This is still draft/local-only; persistence comes later.

Reference: `project/features-updated-data-model/NOTES.md`

Scope
- New wizard step key: `new-steps` in `src/features/event/SplashScreen.tsx`.
- Allow adding N steps dynamically.
- For each step (stop):
  - Title (required)
  - Hints (array input, 1–3 items, at least 1 required)
  - Optional image picker with thumbnail preview and clear action
  - Reorder (Up/Down) and Remove controls
- Validate before advancing to review.

Data Mapping (Org JSON)
- Each step becomes a stop:
  - `stops[i]`: { id (slug of title), title, hints[], assets?{ coverUrl?, thumbnailUrl? } }
- Location (city/state/zip) remains on the hunt (from Phase 5).

Acceptance Criteria
- Users can add, remove, and reorder steps.
- Each step requires a title and at least one hint.
- Optional images show a preview and can be cleared.
- All data lives in local wizard state for now.
