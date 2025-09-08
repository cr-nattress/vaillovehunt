# Phase 5: Hunt Location Fields (City/State/ZIP)

Goal: Extend the existing New Adventure wizard to capture location fields for the hunt before defining steps/hints.

Scope
- Add City, State, ZIP to the `new-hunt` step in `src/features/event/SplashScreen.tsx`.
- Validate inputs (City non-empty; State 2-letter; ZIP 5-digit; optionally accept ZIP+4).
- Persist the values in the wizard state and carry forward to subsequent steps.
- No persistence to blobs yet (that happens later phases).

Acceptance Criteria
- City/State/ZIP appear on the hunt form and are required.
- Basic validation prevents proceeding until valid.
- Values persist when navigating forward/backward in the wizard.

Out of Scope
- Geocoding or map integration (future).
- Writing to App/Org JSON blobs.
