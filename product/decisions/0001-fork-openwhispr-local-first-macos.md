# 0001 — Fork OpenWhispr as the base for a local-first macOS dictation app

- Status: accepted
- Date: 2026-07-05

## Context
Building a dictation app from scratch would repeat work OpenWhispr (MIT-licensed) has already done well: on-device whisper.cpp transcription, a local llama server for reasoning, local Qdrant vector search, and an Electron shell with native Swift helper binaries. The upstream app, however, ships a cloud account layer, a subscription business, and a Google Calendar integration that conflict with the director's goal of a fully private, local tool.

## Decision
Fork `OpenWhispr/openwhispr` to `diliprt/openwhispr` and evolve it into a local-first dictation app targeting macOS. Keep `upstream` as a git remote for pulling future fixes.

## Consequences
Buys a mature, working codebase and native-helper build system for free; costs ongoing merge friction with upstream as our tree diverges. Rejected: building from scratch (months of duplicated work); contributing toggles upstream (upstream's business model depends on the cloud layer).

## Constraints for agents
- The MIT `LICENSE` file and original copyright notice must remain in the repo at all times.
- Commits are authored as `diliprt <157265312+diliprt@users.noreply.github.com>` — never the session user email.
- macOS is the only supported target; do not spend effort keeping Windows/Linux code paths working, but do not gratuitously delete them either — leave them untouched unless they block a change.
- Keep the `upstream` remote intact; prefer surgical, well-isolated diffs to ease future upstream merges.
