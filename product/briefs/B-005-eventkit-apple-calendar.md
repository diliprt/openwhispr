# B-005 — Apple Calendar via a read-only EventKit Swift helper

> WITHDRAWN 2026-07-05: decision 0002 was superseded by 0007 (keep Google Calendar).
> Do not execute this brief.

- Status: superseded
- Depends on: B-004
- Screens: existing Integrations view (Apple Calendar card), Upcoming Meetings surface

## Goal
Calendar data comes from Apple Calendar through a small compiled Swift helper — covering every account macOS syncs (iCloud, Google, Exchange) with zero app-level OAuth. Upcoming meetings and meeting detection work again, backed by EventKit. (Decision 0002.)

## References
- Decisions: product/decisions/0002-apple-calendar-eventkit.md (binding — read-only constraint), 0006-unsigned-personal-builds.md
- Interface inventory: `product/briefs/notes/B-004-ipc-shapes.md` (written by B-004)

## Scope
In:
- New Swift helper source (suggest `native/calendar-helper/main.swift`) using EventKit: subcommands `status` (authorization state), `request-access`, `list-calendars`, `events --from ISO8601 --to ISO8601 [--calendar ID]`; JSON on stdout; read-only (no create/modify/delete — decision 0002 constraint).
- Build script `scripts/build-macos-calendar-helper.js` copied from the pattern in `scripts/build-macos-mic-listener.js`; wire into the `compile:native` chain in `package.json`.
- `src/helpers/appleCalendarManager.js` implementing the seam B-004 left (start/stop/syncOnFocus/onWakeFromSleep + event queries), shelling out to the helper and caching events in the existing SQLite tables the Google manager used (see B-004 notes).
- IPC handlers `calendar-get-status`, `calendar-request-access`, `calendar-get-calendars`, `calendar-set-calendar-selection`, `calendar-get-upcoming-events`, `calendar-get-event` mirroring the shapes B-004 recorded; `preload.js` and `src/types/electron.ts` bridges.
- Re-back `useUpcomingEvents.ts`, `UpcomingMeetings.tsx`, and `src/helpers/meetingDetectionEngine.js` with the new IPC.
- Apple Calendar card in `IntegrationsView.tsx`: shows permission state, a "grant access" action (triggers `request-access`), and calendar selection — no OAuth language.
- Add `NSCalendarsUsageDescription` and `NSCalendarsFullAccessUsageDescription` to the mac plist config in `electron-builder.json`.
Out:
- Event creation/modification (forbidden by 0002 without a new decision record).
- Windows/Linux calendar support (0001: macOS only; other platforms get the empty state from B-004).
- Signing/notarization changes (0006).

## Acceptance criteria
Superseded by decision 0007. Do not execute these obsolete checks:
- `node scripts/build-macos-calendar-helper.js` compiles the helper binary with exit 0.
- Helper `status` subcommand prints valid JSON on a machine without calendar permission (a structured `notDetermined`/`denied` state, not a crash).
- With access granted, `events --from <now> --to <+24h>` prints a JSON array (manual runtime check — document the observed output in the brief-completion commit message).
- Renderer shows upcoming events when permission is granted, and a clear grant-access state when not.
- `grep -n "NSCalendarsUsageDescription" electron-builder.json` matches.
- `grep -rn "googleapis\|oauth" src/helpers/appleCalendarManager.js` returns nothing.
- `npm run lint`, `npm run typecheck`, `node --test test/helpers/` all exit 0; add a `test/helpers/appleCalendarManager.test.js` covering event-window filtering logic with the helper mocked.

## Verification
```bash
node scripts/build-macos-calendar-helper.js
npm run lint && npm run typecheck && node --test test/helpers/
grep -n "NSCalendarsUsageDescription" electron-builder.json
```

## Handoff notes
Branch `local-first`. Swift compiles with `swiftc` directly (see how `build-macos-mic-listener.js` invokes it — same flags, output into `resources/bin/`). EventKit full-access on macOS 14+ needs `requestFullAccessToEvents`; fall back to `requestAccess(to:)` pre-14. TCC permission is per-binary: during development the helper binary itself prompts, so the first `request-access` run must happen from a terminal or the packaged app, not be assumed.
