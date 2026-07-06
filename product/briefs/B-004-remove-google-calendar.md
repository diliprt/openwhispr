# B-004 — Remove Google Calendar integration

> WITHDRAWN 2026-07-05: decision 0002 was superseded by 0007 (keep Google Calendar).
> Do not execute this brief. Replacement work: B-007.

- Status: superseded
- Depends on: —
- Screens: existing Integrations view, Upcoming Meetings surface (temporarily empty until B-005)

## Goal
No code calls googleapis.com or any Google OAuth endpoint. The calendar feature's renderer surfaces (upcoming meetings, meeting detection) remain compiling and rendering their empty states, backed by a provider-neutral seam that B-005 fills with EventKit. (Decision 0002.)

## References
- Decisions: product/decisions/0002-apple-calendar-eventkit.md (binding), 0001

## Scope
In:
- Delete `src/helpers/googleCalendarManager.js` (501 lines) and `src/helpers/googleCalendarOAuth.js` (244 lines).
- Remove `gcal-start-oauth`, `gcal-disconnect`, `gcal-get-connection-status`, `gcal-get-calendars`, `gcal-set-calendar-selection`, `gcal-set-primary-only`, `gcal-sync-events`, `gcal-get-upcoming-events`, `gcal-get-event` handlers (`src/helpers/ipcHandlers.js` ~7591–7668) and their `preload.js` / `src/types/electron.ts` bridges. Keep `join-calendar-meeting` (~7801) if it only consumes stored events; adapt its event lookup to the neutral seam.
- Remove `GoogleCalendarManager` construction and lifecycle from `main.js` (~282, 312, 395–397, 435, 499, 934, 939–940, 1613); leave a nullable `calendarManager` slot with the same lifecycle hooks (start/stop/syncOnFocus/onWakeFromSleep) for B-005.
- Update `src/helpers/meetingDetectionEngine.js` to treat the calendar source as optional/absent.
- Remove the Google Calendar card and OAuth UI from `src/components/IntegrationsView.tsx`; `UpcomingMeetings.tsx` / `useUpcomingEvents.ts` render their empty state when no provider exists.
- Keep `src/types/calendar.ts` if provider-neutral; strip Google-specific fields.
Out:
- The EventKit replacement — B-005. Do not start it here; the seam (nullable manager with the four lifecycle hooks + event-query methods) is this brief's deliverable.
- Google as a BYO-key AI provider (Gemini via `@ai-sdk/google`) — protected by 0005; do not touch.

## Acceptance criteria
Superseded by decision 0007 and B-007. Do not execute these obsolete checks:
- `grep -rn "googleCalendar\|googleapis.com/calendar\|gcal-" src main.js preload.js` returns nothing.
- `grep -rn "googleCalendarOAuth\|GoogleCalendarManager" src main.js` returns nothing.
- Upcoming-meetings UI and meeting detection compile and show empty/disabled states with no calendar provider.
- `@ai-sdk/google` and `@ai-sdk/google-vertex` remain in package.json.
- `npm run lint`, `npm run typecheck`, `node --test test/helpers/` all exit 0.

## Verification
```bash
npm run lint && npm run typecheck && node --test test/helpers/
grep -rn "gcal-\|googleCalendar" src main.js preload.js && echo FAIL || echo PASS
```

## Handoff notes
Branch `local-first`. The `gcal-*` handler set is the interface inventory for B-005 — record the exact request/response shapes you delete (a short section in the commit message or a `product/briefs/notes/B-004-ipc-shapes.md`) so B-005 can re-implement them as `calendar-*` without archaeology.
