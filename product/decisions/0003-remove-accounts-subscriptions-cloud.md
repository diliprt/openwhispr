# 0003 — Remove accounts, subscriptions, and all openwhispr.com cloud services

- Status: accepted
- Date: 2026-07-05

## Context
Upstream ties optional features to a vendor account: better-auth login against `auth.openwhispr.com`, workspace billing with Stripe checkout, usage metering, email verification, and cloud note-sharing, all routed through `OPENWHISPR_API_URL`. This fork is a personal tool with no business model; every one of these surfaces is dead weight and a privacy liability.

## Decision
Delete the account, subscription, billing, and vendor-API layers entirely. The app runs with no concept of sign-in, workspace, plan, or server-side user state.

## Consequences
Buys a simpler app with no vendor lock and no runtime traffic to openwhispr.com; costs the loss of cloud note-sharing and any future upstream features gated on accounts, and enlarges the diff against upstream. Rejected: leaving the code dormant behind flags (dead network paths persist, upstream churn keeps touching them).

## Constraints for agents
- No runtime code may reference `openwhispr.com`, `auth.openwhispr.com`, or `OPENWHISPR_API_URL`; remove the constant and everything that consumes it (`src/lib/auth.ts`, `AuthenticationStep`, `EmailVerificationStep`, `WorkspaceBillingTab`, `UsageDisplay`, `ShareNoteDialog` cloud paths, and related IPC handlers).
- `better-auth` and `@better-auth/*` must not appear in `package.json` dependencies.
- No payment, checkout, plan, or entitlement code of any kind; the app must never render an upgrade or billing UI.
- Onboarding and settings must function fully with no network available.
