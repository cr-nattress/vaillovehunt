# Phase 2 — Wire Static Footer Links

Goal
- Render three consistent footer items — Event, Challenges, Social — and connect them to the same links across the app (not dependent on the top tab for now).

Scope
- Define three entries in `FooterNav`:
  - Event → e.g., `#/event` or in-app event section/URL
  - Challenges → e.g., `#/hunt` (main challenges page)
  - Social → e.g., `#/feed` or external social URL
- Always show these same three items regardless of `taskTab` or page.
- Wire click handlers to navigate to the corresponding destinations.

Out of Scope
- Dynamic footer content per tab (may be considered later if needed).

Implementation Steps
- Add props for navigation callbacks to `FooterNav` (e.g., `onNavigate`).
- Hardcode the three items in `FooterNav` with labels and icons.
- On click, call `onNavigate` with the appropriate page or open the external URL.

Acceptance Criteria
- Footer displays exactly three items: Event, Challenges, Social.
- Each item navigates to the same defined destination regardless of app state or tab.
- No regressions in layout or footer positioning from Phase 1.

References
- `src/App.jsx` (tab state and handlers)
- `src/features/app/StopsList.tsx` (active/first incomplete stop logic)
- `src/features/app/CompletedAccordion.tsx` (expand/collapse behaviors)
