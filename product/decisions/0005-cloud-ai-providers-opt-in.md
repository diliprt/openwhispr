# 0005 — Cloud AI providers remain available as explicit opt-in; all defaults local

- Status: accepted
- Date: 2026-07-05

## Context
Upstream supports optional cloud transcription/reasoning backends (OpenAI, Anthropic, Groq, Azure, Mistral) using user-supplied API keys, off by default. Stripping them was considered for a literal "no cloud paths" posture, but the director chose to keep the flexibility.

## Decision
Keep the cloud AI provider integrations as opt-in. Local whisper.cpp and the local llama server are the defaults; the app never contacts a cloud AI endpoint unless the user has entered their own API key and selected that provider.

## Consequences
Buys flexibility to use frontier models occasionally without maintaining a patch; costs the continued presence of outbound network code paths, so "fully local" is a default rather than an invariant. Rejected: full removal (chosen against — reduces utility; the accounts/telemetry removals in 0003/0004 already cover the involuntary cloud surface).

## Constraints for agents
- Every fresh-install default must resolve to a local backend; no cloud provider may ever be auto-selected, suggested as a fallback, or required by onboarding.
- API keys live only in local storage on the user's machine; never proxy AI requests through any intermediary server.
- No cloud AI request may fire without a user-entered key AND an explicit provider selection; silent failover from local to cloud is forbidden.
- Build-time model downloads (Hugging Face, whisper.cpp binaries) are permitted; they fetch artifacts that run locally.
