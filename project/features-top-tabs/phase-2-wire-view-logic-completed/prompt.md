# Phase 2 — Wire Tab to Content Rendering

Goal
- Connect the tab selection to show either the next active/current task(s) or the completed list. When “Current” is selected, render only active cards. When “Completed” is selected, show only the completed accordion.

Scope
- Add a `view` prop to `StopsList` to switch rendering modes: `'current' | 'completed'`.
- When `view === 'current'`, render active tasks only (transitioning + first incomplete).
- When `view === 'completed'`, render the completed accordion only.
- Keep transitions and hint behavior intact.

Out of Scope
- Keyboard arrow navigation between tabs (Phase 3).
- Moving tabs to header or deep linking (Phase 4).

Implementation Steps
- Update `StopsListProps` with `view?: 'current' | 'completed'` (default 'current').
- Conditional return in `StopsList` based on view.
- In `App.jsx`, pass `view={taskTab}` to `StopsList`.
- Optionally auto-expand the completed accordion when `view === 'completed'`.

Acceptance Criteria
- Clicking the Current tab shows only active tasks.
- Clicking the Completed tab shows only the completed accordion.
- No regressions in photo upload, hint reveal, or animations.

References
- `src/features/app/StopsList.tsx`
- `src/features/app/CompletedAccordion.tsx`
- `src/App.jsx`
