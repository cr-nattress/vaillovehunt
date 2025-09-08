# Splash Paywall: Status

This status file is updated after each phase to reflect progress and next steps.

## Phase Checklist
- [ ] Phase 1: UI Stub + Flags (no payments)
- [ ] Phase 2: Entitlement Read (KV/Blobs) — no purchase
- [ ] Phase 3: Provider Integration (Sandbox) — Stripe or Lemon Squeezy
- [ ] Phase 4: Webhooks & Receipts — server validation and revocations

## Current Phase
- Not started. Begin with Phase 1.

## Notes
- Keep flags OFF by default. Enable only in dev/sandbox.
- Non-blocking UX: failures should not crash Splash; always allow graceful recovery.
