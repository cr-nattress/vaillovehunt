# Phase 4 Prompt: A11y, Attribution, Tests

Polish the MapPage with accessibility, attribution, and tests.

Tasks:
1) Ensure tile layer attribution is present and visible.
2) Add ARIA labels to the map container and "Locate Me" control.
3) Add keyboard handlers for the control.
4) Write an integration test that:
   - Mocks geolocation success and asserts a marker is rendered and centered.
   - Mocks geolocation failure and asserts a fallback center and an inline error.

Validation:
- Run test suite; new tests pass.
- Manual keyboard checks for control operability.
- Confirm attribution is shown in the UI.
