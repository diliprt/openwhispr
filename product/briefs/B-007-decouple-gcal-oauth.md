# B-007 — Decouple Google Calendar OAuth from openwhispr.com

- Status: done
- Depends on: —
- Screens: existing Integrations view (Google Calendar card unchanged)

## Goal
Google Calendar keeps working exactly as upstream built it, but the OAuth flow has no openwhispr.com touchpoint: completion terminates at the local loopback server with a plain success page, and credentials come from the user's own Google Cloud OAuth client. (Decision 0007, superseding 0002.)

## References
- Decisions: product/decisions/0007-keep-google-calendar-own-oauth.md (binding), 0003

## Scope
In:
- In `src/helpers/googleCalendarOAuth.js`: replace the `_redirect`/`_buildCallbackRedirect`/`_getDesktopCallbackUrl`/`_getProtocol` machinery (lines ~10–52) with a local HTML response served directly by the loopback server — success ("Google Calendar connected — you can close this tab") and error variants. Remove `DEFAULT_DESKTOP_CALLBACK_URL`, `PROTOCOL_BY_CHANNEL`, and the `VITE_OPENWHISPR_OAUTH_CALLBACK_URL` / `OPENWHISPR_CHANNEL` env reads.
- Verify the renderer learns of connection state via IPC/database polling rather than the deep-link protocol; if any `openwhispr://` protocol handler exists solely for the gcal callback bounce, remove that handler (check `main.js` `setAsDefaultProtocolClient` / `open-url` usage — remove only the gcal-specific part).
- Document self-owned OAuth setup in `docs/google-calendar-oauth.md`: create a Google Cloud project, enable the Calendar API, create a Desktop-type OAuth client, set `GOOGLE_CALENDAR_CLIENT_ID`/`GOOGLE_CALENDAR_CLIENT_SECRET` in `.env`. Include the consent-screen note: in "Testing" publishing status refresh tokens expire after 7 days — set the app to "In production" (the unverified-app warning is acceptable for personal use with read-only scopes).
- Add a graceful UI state when the env credentials are missing: the Integrations card explains setup and links to the doc instead of failing opaquely.
Out:
- Any change to `googleCalendarManager.js` sync logic, scopes, or token storage (all kept per 0007).
- EventKit/Apple Calendar — cancelled with 0002.

## Acceptance criteria
- [x] `grep -rn "openwhispr\.com\|OPENWHISPR_CHANNEL\|desktop-callback" src/helpers/googleCalendarOAuth.js` returns nothing.
- [x] OAuth scopes in the file are unchanged: `calendar.events.readonly` and `calendar.calendarlist.readonly` only.
- [x] `docs/google-calendar-oauth.md` exists and covers client creation, env vars, and the 7-day testing-mode caveat.
- [x] With no `GOOGLE_CALENDAR_CLIENT_ID` set, the Integrations UI shows the setup guidance state (not a crash or silent failure).
- [x] `npm run lint`, `npm run typecheck`, `node --test test/helpers/` all exit 0.

## Completion notes
- Verified no Google Calendar OAuth credentials are configured in local `.env`; the Integrations card now receives `configured: false` from `gcal-get-connection-status` and renders setup guidance with a docs action.
- Full browser OAuth flow was not run because no local `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` values are configured in this checkout.

## Verification
```bash
npm run lint && npm run typecheck && node --test test/helpers/
grep -rn "openwhispr\.com\|desktop-callback" src/helpers/googleCalendarOAuth.js && echo FAIL || echo PASS
```

## Handoff notes
Branch `local-first`. The loopback server already handles the code exchange before redirecting — the change is to end the response there with `res.writeHead(200, {"Content-Type": "text/html"})` + a minimal page, in both success and error paths (`_redirect` call sites at ~68, 84, 103, 118, 122). Test the full flow manually with real credentials once and record the observed result in the completion commit message.
