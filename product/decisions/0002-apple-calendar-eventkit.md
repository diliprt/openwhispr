# 0002 — Replace Google Calendar with Apple Calendar via a native EventKit helper

- Status: accepted
- Date: 2026-07-05

## Context
Upstream's calendar features (upcoming-meetings view, meeting detection) are backed by Google Calendar, with OAuth proxied through openwhispr.com — a cloud dependency on both Google and the vendor. The director wants calendar data sourced from Apple Calendar, which already syncs whatever accounts the user has configured in macOS, with no app-level OAuth at all.

## Decision
Remove the Google Calendar integration entirely and read events from Apple Calendar (EventKit) via a small compiled Swift helper binary, following the repo's existing native-helper pattern (`scripts/build-macos-*.js` + Swift sources).

## Consequences
Buys zero-OAuth, zero-cloud calendar access covering every account the Mac syncs (iCloud, Google, Exchange) via the OS; costs a new Swift helper to write and maintain, and makes the calendar feature macOS-only (acceptable per 0001). Rejected: Google Calendar API direct with user-owned OAuth client (still a cloud path, painful client setup); AppleScript/osascript bridge (slow, fragile).

## Constraints for agents
- No code may call `googleapis.com` or any Google OAuth endpoint; `src/helpers/googleCalendarManager.js` and `src/helpers/googleCalendarOAuth.js` are removed, not conditionally disabled.
- Calendar reads go exclusively through the EventKit Swift helper, compiled by a `scripts/build-macos-*.js` script like the other native helpers.
- The build must declare `NSCalendarsUsageDescription` (and `NSCalendarsFullAccessUsageDescription` for macOS 14+) in the Electron builder config.
- The helper is read-only: it may list calendars and events; it must not create, modify, or delete events without a new decision record.
