# Email Magic Link Authentication: Technical Plan

Adds a passwordless magic-link step to the Splash wizard. Users must enter their email each time they (re)enter and complete sign-in via a one-time link. All server logic runs on Netlify Functions.

## Goals
- Require email-based sign-in at the beginning of the Splash wizard (Step 0).
- Always require email on reentry (no long-lived auto-login).
- Use magic links: short-lived, single-use tokens; validate server-side; redirect back to the app.
- Keep implementation additive and feature-flagged.

## Server (Netlify Functions)
- `auth-start` (POST): accepts email, generates signed token + one-time nonce in KV (TTL), and sends email (provider later).
- `auth-complete` (GET): validates token + nonce, sets a short-lived "just-authenticated" bootstrap (cookie/KV), redirects to `/splash?authed=1`.
- `me` (GET): returns { justAuthed, email, issuedAt }.
- `logout` (POST): clears bootstrap state (optional).

## Storage
- KV: single-use nonces, short-lived bootstrap state, rate limits.
- Blobs (optional): user profiles `users/{emailHash}.json`.

## Flags
- `ENABLE_EMAIL_SIGNIN` (default false).

## Phases
1) UI Stub (no email sent; logs only)
2) Functions (dummy provider; log link/code)
3) Email Provider (SendGrid/Postmark/Resend) + rate limits
4) Hardening (short-lived bootstrap, reentry enforcement, logout)
5) Integrations (paywall entitlement check, rules acceptance post-auth)

Track progress in `STATUS.md`. Each phase has a README and PROMPT.
