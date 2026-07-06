# 0004 — No telemetry or analytics of any kind

- Status: accepted
- Date: 2026-07-05

## Context
Upstream contains no third-party analytics SDK, only a `telemetryEnabled` setting (default false) in the settings store. The director wants the guarantee to be structural: not "off by default" but "not present".

## Decision
Remove the `telemetryEnabled` setting and any code that reports usage, errors, or diagnostics off-device. The app collects nothing.

## Consequences
Buys a categorical privacy guarantee that is trivial to audit; costs the absence of crash reporting — debugging relies on local logs the user shares voluntarily. Rejected: opt-in telemetry (contradicts the fork's premise); local-only metrics dashboards (unneeded complexity for a personal tool).

## Constraints for agents
- No analytics, crash-reporting, or telemetry SDK may be added (PostHog, Sentry, Amplitude, Mixpanel, or similar), and no hand-rolled equivalent.
- The strings `telemetry`/`analytics` must not correspond to any runtime network call; the `telemetryEnabled` setting is removed from the settings store and UI.
- Error handling writes to local log files only.
- Auto-update checks, if kept, must be user-visible and disableable; they may hit GitHub releases only.
