# Build loop — local-first fork

Self-terminating loop for any build agent. All work happens on branch `local-first`
(branch from `main` if it doesn't exist). The director's gates run OUTSIDE this loop.

## One iteration

1. `git checkout local-first && git pull --rebase origin local-first || true`
2. Read `product/briefs/index.md`. Pick the topmost brief in the table whose status is `ready`
   and whose every "Depends on" entry is `done` (`superseded` briefs are never picked and
   never block). If none exists, go to **Exit check**.
3. Set that brief's status to `in-progress` in `index.md`. Read the brief file fully, plus every
   decision record it references. Comply with all "Constraints for agents".
4. Execute the brief's Scope. Touch nothing listed under Out.
5. Run the brief's Verification commands **in this same iteration**.
   - All pass → tick every acceptance checkbox in the brief file, set status `done` in
     `index.md`, commit everything (code + brief + index) as
     `B-NNN: <title> (Co-Authored-By line per repo convention)`, push.
   - Any fail → fix and re-run. If unfixable within the brief's scope, set status `blocked`
     with a one-line reason in `index.md`, commit, push, and STOP the loop with a report.
6. Next iteration.

## Exit check (all must hold — run the commands, don't assert)

```bash
# 1. No brief is ready, in-progress, or draft:
grep -E "\| (ready|in-progress|draft) \|" product/briefs/index.md && echo "NOT DONE" || echo "briefs done"
# 2. No unticked acceptance box in any done brief:
grep -rn "\[ \]" product/briefs/B-*.md && echo "NOT DONE" || echo "boxes done"
# 3. Quality gates green:
npm run lint && npm run typecheck && node --test test/helpers/
# 4. Decision-record grep gates (Google Calendar code is KEPT per decision 0007):
grep -rn "openwhispr\.com\|OPENWHISPR_API_URL\|better-auth\|telemetryEnabled" src main.js preload.js && echo "NOT DONE" || echo "gates clean"
```

All four green → the loop is complete. Print a final report (briefs done, commits made,
anything deferred) and stop. Any `blocked` brief → stop with the report instead; do not
work around blockers.

## Anti-early-victory rules

- Never set `done` without running that brief's Verification commands in the same iteration.
- Never tick an acceptance box the commands (or the stated manual check) did not prove.
- A brief with a manual runtime check (B-005, B-006) records the observed output in the
  completion commit message — "should work" is not evidence.
- Blockers are recorded and stop the loop; they are never silently narrowed out of scope.

## Paste-ready prompt (Codex / Composer / any coding agent)

> Open the repo diliprt/openwhispr. Read product/briefs/LOOP.md and follow it exactly:
> work on branch local-first, execute briefs from product/briefs/index.md in dependency
> order, verify each brief with its own Verification commands before marking it done,
> commit and push per brief, and stop only when LOOP.md's Exit check passes or a brief
> is blocked. Read product/decisions/index.md first; its constraints override convenience.

## Claude Code equivalent

```
/loop Read product/briefs/LOOP.md and run exactly one iteration of the loop (or the Exit check if no brief is available). Report which brief you completed or why you stopped.
```
