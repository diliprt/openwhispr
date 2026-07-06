# B-001 — Remove telemetry setting

- Status: done
- Depends on: —
- Screens: existing Settings page (no new screens)

## Goal
The app has no telemetry concept at all: no setting, no UI toggle, no code path that could report usage off-device. Decision 0004 made structural — "not present", not "off by default".

## References
- Decisions: product/decisions/0004-no-telemetry.md (binding), 0001-fork-openwhispr-local-first-macos.md

## Scope
In:
- Remove `telemetryEnabled` / `setTelemetryEnabled` from `src/stores/settingsStore.ts` (lines ~118, ~927, ~1467) and any consumer in `src/hooks/useSettings.ts` and `src/components/SettingsPage.tsx`.
- Remove the telemetry toggle UI and its locale keys from `src/locales/*/translation.json` (all 9 locales share key names — remove by key, not by translated text).
- Check `src/helpers/localSpeechGate.js` and `src/helpers/audioManager.js` for telemetry-conditional behavior (grep hits exist); remove the conditional, keep the local-only behavior.
Out:
- Auto-update code (kept per 0004; separate concern).
- Any auth/cloud removal — that is B-002/B-003.

## Acceptance criteria
- [x] `grep -rn "telemetryEnabled\|setTelemetryEnabled\|sendLogs" src main.js preload.js` returns nothing (if `sendLogs` is telemetry-unrelated, document why in the commit message and exempt it).
- [x] Settings UI renders with no telemetry/analytics toggle.
- [x] `npm run lint`, `npm run typecheck`, and `node --test test/helpers/` all exit 0.

## Verification
```bash
npm run lint && npm run typecheck && node --test test/helpers/
grep -rn "telemetryEnabled" src && echo FAIL || echo PASS
```

## Handoff notes
Work on branch `local-first`. `npm ci --ignore-scripts` is enough for lint/typecheck/tests (full `npm install` triggers native compiles and model downloads you don't need). Existing tests reference localSpeechGate — run them after touching that file.
