# Phase 5 — Mobile Footer (Event/Challenges/Social)

Goal
- Provide a persistent, thumb-friendly footer on mobile with three static items.

Scope
- Create `src/features/app/FooterNav.tsx` with three items: Event, Challenges, Social.
- Insert footer in the hunt page; add bottom padding to main content to avoid overlap.
- Route buttons to consistent destinations (e.g., Event → `#/event` or placeholder, Challenges → hunt, Social → feed).

Out of Scope
- Dynamic footer content based on tabs.

Implementation Steps
- Build footer with accessible labels and large touch targets.
- Ensure safe-area handling (padding-bottom: env(safe-area-inset-bottom)).
- Pad content container bottom (e.g., ~72px + safe-area inset) so content is not obscured.

Acceptance Criteria
- Footer stays fixed, does not overlap content.
- Three items navigate to their targets consistently across the app.
- Meets accessibility basics (aria-labels, visible focus).
