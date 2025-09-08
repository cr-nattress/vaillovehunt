# Phase 6 Prompt: Steps & Hints Builder (with optional image)

Reference notes: `project/features-updated-data-model/NOTES.md`

Implement a new wizard step to collect steps (stops) for the hunt, each with hints and an optional image.

Tasks:
1) In `src/features/event/SplashScreen.tsx`, add a new step key: `new-steps`.
2) Create UI to manage a dynamic list of steps:
   - Add Step button to append a new step row
   - Per-step fields: Title (required), Hints (1–3 strings; at least 1 required)
   - Optional Image input with preview and a Clear control
   - Reorder (Up/Down) and Remove step
3) Validation:
   - At least one step
   - Each step has a non-empty Title and at least one Hint
4) State:
   - Maintain steps in local wizard state (no network)
   - Preserve state when navigating Back/Next
5) Navigation:
   - Back returns to `new-hunt`
   - Next proceeds to `review-submit`

Validation:
- Users can add/remove/reorder steps.
- Title + ≥1 hint required per step.
- Image is optional and can be cleared.
- All data remains local for now (no uploads yet).
