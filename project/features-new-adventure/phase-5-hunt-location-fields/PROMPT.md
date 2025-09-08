# Phase 5 Prompt: Hunt Location Fields

Reference notes: `project/features-updated-data-model/NOTES.md`

Add City/State/ZIP to the New Adventure `new-hunt` step before the steps/hints builder. No blob writes in this phase.

Tasks:
1) In `src/features/event/SplashScreen.tsx`, extend the `new-hunt` form with required fields:
   - City (non-empty)
   - State (2-letter or dropdown)
   - ZIP (5-digit; optionally accept 5+4)
2) Store values in wizard state; persist across back/forward.
3) Validate fields inline with accessible errors (`aria-invalid`, messages).
4) Prevent Next until all fields are valid.

Validation:
- Entering valid City/State/ZIP enables Next.
- Navigating away and back preserves values.
- No persistence to blobs yet; no regressions to prior steps.
