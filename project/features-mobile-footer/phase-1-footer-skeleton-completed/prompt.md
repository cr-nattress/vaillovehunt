# Phase 1 — Mobile Footer Skeleton

Goal
- Implement a bottom-fixed footer that remains visible on mobile, styled to match the app and respecting device safe areas.

Scope
- Create a new `FooterNav` component under `src/features/app/FooterNav.tsx`.
- Fixed at bottom on small screens with appropriate height (56–64px), shadow, and brand colors.
- Add bottom padding to the main content container so content isn’t obscured.
- Include three static buttons (icons + labels) with role="navigation":
  - Event
  - Challenges
  - Social
- Handle safe-area insets via `env(safe-area-inset-bottom)`.

Out of Scope
- Wiring different actions for Current vs Completed (Phase 2).
- State-enabled/disabled logic and advanced ARIA (Phase 3).

Implementation Steps
- Build `FooterNav` with a container and the three buttons (Event, Challenges, Social). Links can be placeholders for now (e.g., `#event`, `#challenges`, `#social`).
- Insert `<FooterNav />` near the end of the hunt page in `src/App.jsx`.
- Add bottom padding to the main content wrapper: `paddingBottom: 'calc(72px + env(safe-area-inset-bottom))'`.
- Ensure z-index keeps footer above content but below modals.

Acceptance Criteria
- Footer is visible and fixed at the bottom on mobile.
- Main content is scrollable and not covered by the footer.
- Visual style matches the app theme and uses brand tokens.
 - Three static buttons (Event, Challenges, Social) are visible and clickable.

References
- `src/App.jsx` (page layout)
- `src/features/app/Header.tsx` (header style reference)
