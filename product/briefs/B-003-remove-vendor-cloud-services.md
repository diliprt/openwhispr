# B-003 — Remove vendor cloud services: sync, billing, usage, workspaces, sharing

- Status: ready
- Depends on: B-002, B-007 (B-007 removes the openwhispr.com reference inside googleCalendarOAuth.js — this brief's grep gate cannot pass before it)
- Screens: existing Settings page (Workspace/Billing tabs removed), Notes views (share-to-cloud removed)

## Goal
No runtime code path reaches openwhispr.com. The SQLite database is the sole store for notes, folders, snippets, dictionary, conversations, and transcriptions — no sync, no workspace, no plan, no usage meter. BYO-key AI providers (OpenAI, Anthropic, Groq, Azure, Mistral, Gemini) remain untouched per decision 0005. (Decision 0003.)

## References
- Decisions: product/decisions/0003-remove-accounts-subscriptions-cloud.md (binding), 0005-cloud-ai-providers-opt-in.md (defines what must NOT be removed)

## Scope
In:
- Delete `src/services/cloudApi.ts`, `SyncService.ts`, `NotesService.ts`, `FoldersService.ts`, `SnippetService.ts`, `DictionaryService.ts`, `ConversationsService.ts`, `TranscriptionsService.ts`, `TeamsService.ts`, `WorkspacesService.ts`, `InvitationsService.ts`, `WorkspaceApiKeysService.ts`, `ApiKeysService.ts`, `NoteSharingService.ts` (all call `cloudApi`; verify each before deleting — `LocalReasoningService`, `BaseReasoningService`, `ReasoningService` stay).
- Remove their callers' cloud paths: `src/components/settings/WorkspaceBillingTab.tsx`, `src/components/UsageDisplay.tsx`, `src/hooks/useUsage.ts`, `src/components/notes/ShareNoteDialog.tsx`, sync triggers in `ControlPanel.tsx`, `NoteEditor.tsx`, `SettingsPage.tsx`, `useFolderManagement.ts`, `noteStore.ts`, `settingsStore.ts`, `services/tools/createNoteTool.ts`, `updateNoteTool.ts`, and `OnboardingFlow.tsx`.
- Remove vendor IPC in `src/helpers/ipcHandlers.js`: `cloud-api-request` (~6377), `cloud-transcribe` (~3678), `cloud-reason` (~5966), `cloud-usage` (~6239), `cloud-checkout` (~6305), `cloud-health-check` (~3768) — each provably hits `getApiUrl()`; remove `getApiUrl`/`getAuthHeader` helpers, `OPENWHISPR_API_URL` in `src/config/constants.ts` (~117), matching `preload.js` bridges and `src/types/electron.ts` entries, and any "OpenWhispr Cloud" provider option in transcription/reasoning settings UI (`McpIntegrationCard.tsx`, `CliIntegrationCard.tsx`, `SupportDropdown.tsx` references included).
Out:
- BYO-key provider code (`api.openai.com`, `api.anthropic.com`, Azure, Groq, Mistral, `@ai-sdk/*`) — protected by 0005.
- Local `db-*-from-cloud` / `db-mark-*-synced` handlers and `cloud_id` columns in `src/helpers/database.js` — dead but local-only; swept in B-006. Never write a schema migration that drops columns.

## Acceptance criteria
- [ ] `grep -rn "openwhispr\.com\|OPENWHISPR_API_URL" src main.js preload.js` returns nothing.
- [ ] `grep -rn "cloud-api-request\|cloud-transcribe\|cloud-reason\|cloud-usage\|cloud-checkout\|cloud-health-check" src main.js preload.js` returns nothing.
- [ ] No billing, plan, upgrade, usage-meter, workspace, team, or invitation UI renders anywhere.
- [ ] Note create/edit/delete, folders, snippets, and dictionary work against local SQLite (existing behavior — verify nothing regressed by exercising the note tools' code paths in tests).
- [ ] The BYO-key provider settings still list OpenAI/Anthropic/Groq/Azure/Mistral/Gemini with local as default.
- [ ] `npm run lint`, `npm run typecheck`, `node --test test/helpers/` all exit 0.

## Verification
```bash
npm run lint && npm run typecheck && node --test test/helpers/
grep -rn "openwhispr\.com\|OPENWHISPR_API_URL\|cloudApi" src main.js preload.js && echo FAIL || echo PASS
```

## Handoff notes
Branch `local-first`. This is the largest brief; the safe order is services → their UI callers → IPC handlers → constants. `SyncService.ts` (1052 lines) is invoked from settingsStore — remove the invocation sites cleanly rather than stubbing. If a caller mixes local and cloud logic (NoteEditor, noteStore), keep the local branch as the only branch.
