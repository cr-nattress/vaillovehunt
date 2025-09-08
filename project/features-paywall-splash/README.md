# Splash Paywall: Technical Plan

This feature adds a paywall step (Step 5) within `src/features/event/SplashScreen.tsx` after the initial join flow, still inside the Splash overlay. Users proceed to the Event page only if they are entitled (purchase completed or access otherwise granted).

## Goals
- Add a gated step in the Splash wizard: `paywall`.
- Respect per-hunt access config (visibility/paywall/price) from Org JSON.
- Provide two provider options and roll out via feature flags.
- Keep UX resilient: best‑effort; never block the app if providers are down.

## Data Model Additions (Org JSON)
- `hunts[n].access`:
  - `visibility`: `public | invite | private`
  - `paywallRequired`: boolean
  - `price`: number
  - `currency`: string (e.g., "USD")
  - `productId`: string (SKU or product code in the payment provider)
  - `promoCodeAllowed`: boolean (optional)
- Entitlements (KV/Blobs):
  - Path: `entitlements/{orgSlug}/{huntId}/...`
  - Fields: `{ email | sessionId, teamName?, provider, purchaseId, status: 'active'|'revoked', createdAt, updatedAt }`

## Feature Flags (to add in `src/config/flags.ts`)
- `ENABLE_PAYWALL` (default false)
- `PAYWALL_PROVIDER`: `'stripe' | 'lemonsqueezy'`
- Optional allowlist by org/hunt for controlled rollout.

## Service Options

### Option A: Stripe Checkout + Netlify Functions
- Client → Netlify Function: create Stripe Checkout Session with metadata `{ orgSlug, huntId, sessionId/email }`.
- Redirect to Stripe hosted checkout; success/cancel URLs return to Splash.
- Webhook (Stripe → Netlify Function) confirms payment → writes entitlement.
- Client polls entitlement or triggers a confirm endpoint.

### Option B: Lemon Squeezy Hosted Checkout + Webhooks
- Client opens LS hosted checkout with product ID and optional metadata.
- Webhook (LS → Netlify Function) writes entitlement on order success/refund.
- Client polls entitlement or uses a confirm endpoint.

## UX Flow
1) Steps 1–4 as-is.
2) Step 5: Paywall (only if `paywallRequired`):
   - Show price/currency, summary, and actions: Pay, Already Purchased?, Cancel.
   - If entitlement already exists (by email/session), auto-skip.
3) On Pay success, entitlement is persisted via webhook or confirm call.
4) Proceed to Event when entitlement status is `active`.

## Incremental Phases
- Phase 1: UI stub + flags (no payments)
- Phase 2: Entitlement read (KV/Blobs) – no purchase
- Phase 3: Provider integration (Stripe or LS) – sandbox only
- Phase 4: Webhooks & receipts – server validation and revocations

## Testing & Safety
- Sandbox keys; feature flags OFF by default.
- Manual paths: first‑time purchase, already purchased, payment failure.
- Webhook signature validation; structured logs.
- Non‑blocking failures: show retry or fallback; do not crash Splash.
