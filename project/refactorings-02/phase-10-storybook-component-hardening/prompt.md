# Phase 10 — Storybook Component Hardening

Goal
- Improve UI reliability by documenting and testing components in isolation with Storybook, covering edge cases and states that often break during refactors.

Scope
- Install and configure Storybook for React (Vite builder).
- Create stories for core components:
  - `src/features/app/StopCard.tsx` — in-progress, uploading, done, with/without photo, max hints
  - `src/features/app/CompletedAccordion.tsx` — empty, few items, many items
  - `src/features/app/Header.tsx` — menu open/closed, different progress values
  - `src/components/ProgressGauge.jsx` — 0%, partial, 100%
  - `src/features/app/FooterNav.tsx` (once added) — Event/Challenges/Social variants
- Add basic interaction tests in stories (Storybook test-runner optional).

Out of Scope
- Business logic changes. Focus on visual and interactive states.

Implementation Steps
- `npx storybook@latest init` for React + Vite.
- Add `.stories.tsx` files colocated with the components.
- Create mock data factories in `src/test/factories/` to keep stories concise and realistic.
- Ensure stories do not call real network services; mock them where needed.
- Optionally add Chromatic or a visual-regression workflow.

Acceptance Criteria
- Core components listed above have representative stories for common and edge states.
- Stories run locally without real backends.
- Optional: visual tests baseline is created to catch regressions in future PRs.

Guardrails
- Keep stories small and focused; one concern per story.
- No fragile timing-based interactions in stories; prefer deterministic states.
