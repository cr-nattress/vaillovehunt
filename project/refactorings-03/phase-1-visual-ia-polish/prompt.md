# Phase 1 — Visual & IA Polish (Current/Completed)

Goal
- Improve scannability and highlight primary actions without changing core flows.

Scope
- `stop-card/StopCardHeader.tsx` — tighten spacing, consistent typography, chevron rotation on expand.
- `stop-card/StopCardHints.tsx` — add “Hint X of N” stepper; standardize reveal animation timing.
- `stop-card/StopCardActions.tsx` — promote Upload button (full-width on mobile) and add microcopy.
- `features/app/CompletedAccordion.tsx` — add small thumbnail and completed time; quick actions (View/Share).

Out of Scope
- New features (queue, toasts), navigation changes.

Implementation Steps
- Adjust header styling and chevron rotation CSS.
- Add stepper text above hints, ensure aria-live remains appropriate.
- Style Upload button with primary emphasis and add one-line microcopy below.
- Render thumbnail and timestamp in completed rows; add accessible quick actions.

Acceptance Criteria
- Upload CTA stands out clearly on mobile.
- Hints show a step indicator; reveal feels cohesive.
- Completed rows show thumbnail + time and have quick actions.

Guardrails
- Keep color tokens from theme; ensure contrast compliance.
- No changes to business logic.
