# 0006 — Distribution: unsigned local builds for personal use

- Status: accepted
- Date: 2026-07-05

## Context
The app is for the director's own Mac(s), not public distribution. Signing and notarization require a $99/yr Apple Developer account and CI secrets, none of which buy anything for personal use.

## Decision
Build unsigned macOS binaries locally via `npm run build:mac`. No code signing, no notarization, no auto-update server, no store submission.

## Consequences
Buys zero cost and zero signing infrastructure; costs a one-time Gatekeeper bypass (right-click → Open) per machine and means the .app cannot be casually shared with others. Rejected: signed & notarized (unneeded expense now — can be revisited with a superseding record if the fork is ever distributed).

## Constraints for agents
- Do not add signing identities, notarization steps, or provisioning profiles to the build config; `electron-builder` runs with signing disabled.
- Do not wire release-publishing CI (GitHub Actions release workflows may be removed or left dormant, but must not be extended).
- Build outputs stay out of git.
