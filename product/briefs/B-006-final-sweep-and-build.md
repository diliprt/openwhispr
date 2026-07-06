# B-006 — Final sweep: dead code, locales, dependencies, unsigned build

- Status: done
- Depends on: B-001, B-002, B-003, B-007
- Screens: none (cleanup + build proof)

## Goal
The fork is coherent after the removals: no orphaned strings, dead handlers, or unused dependencies, and an unsigned macOS build compiles end to end. (Decisions 0003, 0004, 0006.)

## References
- Decisions: product/decisions/0003, 0004, 0006 (binding); 0005 (protects BYO-key deps); 0007 (protects Google Calendar code)

## Scope
In:
- Remove now-dead local sync plumbing: `db-*-from-cloud`, `db-mark-*-synced`, `db-clear-*-cloud-id`, `db-update-*-cloud-id` handlers in `src/helpers/ipcHandlers.js` and their database.js methods. Leave `cloud_id` columns in the SQLite schema untouched (existing user data; dropping columns needs a migration nobody needs).
- Remove orphaned locale keys (auth, billing, workspace, telemetry) from all 9 `src/locales/*/translation.json` files — match by key, verify each key has no remaining `t("...")` caller. Google Calendar keys stay (decision 0007).
- Prune `package.json`: any dependency with zero remaining imports (candidates: better-auth remnants, google OAuth libs; protected: `@ai-sdk/*` per 0005). Refresh lockfile.
- Update `README.md` / `CLAUDE.md` feature lists: no accounts, no cloud sync, Google Calendar via self-owned OAuth client (link docs/google-calendar-oauth.md), unsigned local builds.
- Prove the build: `CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac` completes; the .app launches (manual check).
Out:
- Any feature work or refactoring beyond deletion of provably dead code.
- Removing GitHub Actions release workflows (leave dormant per 0006 unless they break CI).

## Acceptance criteria
- [x] All B-001…B-003 and B-007 grep gates still pass (run them all; they are the regression net):
      `grep -rn "openwhispr\.com\|OPENWHISPR_API_URL\|better-auth\|telemetryEnabled" src main.js preload.js` returns nothing.
- [x] `grep -rn "from-cloud\|mark-.*-synced" src/helpers/ipcHandlers.js` returns nothing.
- [x] No locale file contains a key with zero callers among the removed feature areas (spot-check script or manual grep per removed key group).
- [x] `npm run lint`, `npm run typecheck`, `node --test test/helpers/` all exit 0.
- [x] `CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac` exits 0 and produces an unsigned .app under `dist/`.

## Verification
```bash
npm run lint && npm run typecheck && node --test test/helpers/
grep -rn "openwhispr\.com\|OPENWHISPR_API_URL\|better-auth\|telemetryEnabled" src main.js preload.js && echo FAIL || echo PASS
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

## Handoff notes
Branch `local-first`. `build:mac` runs the full native compile + model download prechain — expect a long first run and several GB of downloads; that is normal. If electron-builder attempts signing despite the env var, set `"identity": null` under the mac section of `electron-builder.json` (allowed by 0006).
