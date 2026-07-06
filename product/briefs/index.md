# Delegation briefs

> Pipeline note: these briefs were written directly from the accepted decision records
> (product/decisions/) without a blueprint or design baseline stage, by director instruction.
> The work is subtraction of existing code plus one data-source swap behind existing UI —
> no new screens are designed. Visual acceptance is therefore "existing screens still render
> their states", checked by code and tests rather than mockups. The fidelity gate does not
> apply to this batch; the release gate (decision 0006 scope) still does.

| ID | Title | Status | Depends on | Assigned to |
|---|---|---|---|---|
| B-001 | [Remove telemetry setting](B-001-remove-telemetry.md) | ready | — | |
| B-002 | [Remove authentication and the account concept](B-002-remove-auth-accounts.md) | ready | — | |
| B-003 | [Remove vendor cloud services: sync, billing, usage, workspaces, sharing](B-003-remove-vendor-cloud-services.md) | ready | B-002 | |
| B-004 | [Remove Google Calendar integration](B-004-remove-google-calendar.md) | ready | — | |
| B-005 | [Apple Calendar via a read-only EventKit Swift helper](B-005-eventkit-apple-calendar.md) | ready | B-004 | |
| B-006 | [Final sweep: dead code, locales, dependencies, unsigned build](B-006-final-sweep-and-build.md) | ready | B-001, B-002, B-003, B-004, B-005 | |

## Parallelism

Three independent chains: {B-001}, {B-002 → B-003}, {B-004 → B-005}; B-006 joins them.
A single agent should run them in ID order. Parallel agents need separate worktrees and
must expect merge friction in the shared files `src/helpers/ipcHandlers.js`, `preload.js`,
`main.js`, `src/types/electron.ts`, `src/components/SettingsPage.tsx`,
`src/components/OnboardingFlow.tsx`, and `src/locales/*` — sequential is simpler and safe.
