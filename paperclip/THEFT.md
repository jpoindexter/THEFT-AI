# THEFT AI HOST NOTES

This directory is the tracked runtime host for THEFT AI.

## What This Means

- Paperclip supplies companies, agents, goals, issues, heartbeats, adapters, approvals, activity, local Postgres, and skill primitives.
- THEFT supplies product language, staged onboarding, Operator, 8 departments, roadmap/canvas, Library, and the root `../skills/` library.
- User-facing work should move into this host over time.
- The older `../app` Next.js app is migration/reference material, not the final runtime source.

## Active Source Files

- `../BUILD-FROM-THIS/SOURCE-OF-TRUTH.md`
- `../BUILD-FROM-THIS/PARITY-DELTA.md`
- `../BUILD-FROM-THIS/PAPERCLIP-HOST-PROMOTION.md`
- `../BUILD-FROM-THIS/TASKS.md`

## First Product Targets

1. Import root THEFT skills into Paperclip company skills.
2. Add Operator and 8 department templates.
3. Replace generic company creation with THEFT staged onboarding.
4. Persist company stage/setup metadata.
5. Create goals/issues/agents from onboarding in Paperclip only.
6. Render THEFT canvas and Library over Paperclip data.

## Local UX Rules

- Hide fake credits and billing enforcement in local-first UX.
- Do not force LLC/service-company assumptions.
- Allow existing businesses to mark setup items done, skip them, or name what already exists.
- Keep Codex, Claude, Gemini, OpenCode, and local adapters available through Paperclip's adapter model.
