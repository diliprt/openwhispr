# B-002 — Remove authentication and the account concept

- Status: done
- Depends on: —
- Screens: existing Onboarding flow, Settings page, Control Panel (no new screens)

## Goal
The app has no sign-in: no better-auth client, no session tokens, no account UI anywhere. Onboarding goes straight from welcome to local setup. Everything works with the network cable unplugged. (Decision 0003.)

## References
- Decisions: product/decisions/0003-remove-accounts-subscriptions-cloud.md (binding), 0001, 0004

## Scope
In:
- Delete `src/lib/auth.ts`, `src/hooks/useAuth.ts`, `src/components/AuthenticationStep.tsx`, `src/components/EmailVerificationStep.tsx`, `src/components/ForgotPasswordView.tsx`.
- Remove auth steps/gates from `src/components/OnboardingFlow.tsx`, `src/components/ControlPanel.tsx`, `src/components/SettingsPage.tsx`, `src/components/notes/UploadAudioView.tsx`, `src/components/notes/ShareNoteDialog.tsx` (the dialog itself falls in B-003; here only its auth imports must stop referencing deleted modules — coordinate if run in parallel, otherwise B-003 will finish it).
- Remove auth IPC: `auth-clear-session`, `auth-get-token`, `auth-set-token` handlers in `src/helpers/ipcHandlers.js` (~line 3557–3572), the `tokenStore`, matching `preload.js` bridges, and `src/types/electron.ts` entries.
- Remove `better-auth` and `@better-auth/sso` from `package.json` (lines ~143–144) and refresh the lockfile.
Out:
- Billing/usage/workspace UI and cloud services — B-003.
- `VITE_AUTH_URL` doc mentions in README/docs (B-006 sweep).

## Acceptance criteria
- [x] `grep -rn "better-auth" src package.json` returns nothing.
- [x] `grep -rn "authClient\|authGetToken\|authSetToken\|auth-get-token\|auth-set-token\|auth-clear-session" src main.js preload.js` returns nothing.
- [x] Onboarding flow compiles with the auth step removed and reaches local model setup directly.
- [x] No component renders a sign-in, sign-up, or sign-out affordance.
- [x] `npm run lint`, `npm run typecheck`, `node --test test/helpers/` all exit 0.

## Verification
```bash
npm run lint && npm run typecheck && node --test test/helpers/
grep -rn "better-auth\|authClient" src package.json && echo FAIL || echo PASS
```

## Handoff notes
Branch `local-first`. `SocialProvider` types ("google" | "microsoft" | "apple") in auth.ts are sign-in providers, unrelated to calendar work — delete with the file. Auth state may gate rendering in ControlPanel/SettingsPage; replace gates with the signed-out-equals-full-local behavior, not with a stub "signed in" object.
