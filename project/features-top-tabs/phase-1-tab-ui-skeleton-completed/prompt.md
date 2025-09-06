# Phase 1 — Top Tabs UI Skeleton (Current vs Completed)

Goal
- Create a simple two-tab UI on the Hunt page to switch between “Current Tasks” and “Completed Tasks”. This phase focuses on visuals and basic accessibility roles only; no data wiring.

Why
- Users want a fast way to flip between their in-progress task and previously finished tasks. A top tab improves discoverability and navigation compared to only an accordion.

Scope
- Add a small tab group at the top of the hunt page content area.
- Tabs: “Current Tasks” and “Completed (N)”. The count can be a placeholder for now.
- Use ARIA roles: role="tablist", role="tab" with aria-selected, and role="tabpanel".
- Do NOT alter routing in this phase.

Out of Scope
- Filtering content based on selection (that’s Phase 2).
- Keyboard arrow navigation details (Phase 3).
- Moving tabs into the header or deep-linking (Phase 4).

Implementation Hints
- File: `src/App.jsx` — render the tablist above `StopsList`.
- Styling should conform to the existing color variables (e.g., `var(--color-cabernet)`).
- Keep the selected tab in local component state for now.

Acceptance Criteria
- A two-tab control appears on the hunt page above the task list.
- The active tab has a distinct visual style.
- Buttons have appropriate ARIA roles and `aria-selected` states.
- No content filtering logic yet; both tabs display the same content for now.

References
- `src/App.jsx` (hunt page rendering)
- `src/features/app/StopsList.tsx` (task rendering list)
- `src/features/app/CompletedAccordion.tsx` (completed list UI)
