# 0007 — Keep Google Calendar, self-owned OAuth client, no vendor callback

- Status: accepted
- Date: 2026-07-05
- Supersedes: 0002

## Context
0002 chose to replace Google Calendar with an EventKit helper. The director reversed this: keep Google Calendar. Inspection shows the upstream integration is already vendor-light — a PKCE desktop OAuth flow directly against Google with tokens in local SQLite. Its only openwhispr.com touchpoints are the build-time client credentials and a cosmetic post-auth redirect to `openwhispr.com/auth/desktop-callback`.

## Decision
Keep the upstream Google Calendar integration, running entirely on a user-owned Google Cloud OAuth client (Desktop type), with the post-auth browser flow terminating at the local loopback server instead of redirecting through openwhispr.com. No EventKit work.

## Consequences
Buys zero new native code, an unchanged meeting-detection pipeline, and a small diff against upstream; costs a one-time Google Cloud console setup by the director and accepts googleapis.com as a permitted runtime endpoint (a deliberate exception to the local-only posture, analogous to 0005's opt-in providers). Rejected: EventKit replacement (0002 — reversed by director); vendor-proxied OAuth (depends on openwhispr.com, removed by 0003).

## Constraints for agents
- `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` come from the user's own Google Cloud project via env/.env; never embed or fetch vendor credentials.
- The OAuth completion page is served by the local loopback server (`src/helpers/googleCalendarOAuth.js`); no redirect to openwhispr.com or any vendor domain.
- Scopes stay read-only (`calendar.events.readonly`, `calendarlist.readonly`); widening scopes requires a new decision record.
- Tokens remain in local SQLite via the existing `saveGoogleTokens` path; they are never sent anywhere but Google.
- Permitted Google endpoints: `accounts.google.com`, `oauth2.googleapis.com`, `www.googleapis.com/calendar/*` — nothing else.
