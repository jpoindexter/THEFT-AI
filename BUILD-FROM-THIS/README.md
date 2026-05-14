# BUILD FROM THIS

> Single source of truth. Read these in order. Don't build anything that isn't here.

## Read order

1. **`HANDOFF.md`** — resume state, pushed commits, current implementation status, next exact tasks
2. **`SOURCE-OF-TRUTH.md`** — canonical merge decision: THEFT product layer on a Paperclip runtime host
3. **`PARITY-DELTA.md`** — feature parity, product deltas, gaps, and build order
4. **`UX-DIRECTION.md`** — product UX direction tying Paperclip, Cofounder, Hyperagent, skills, and THEFT happy path together
5. **`UX-SCREEN-PROMPTS.md`** — reusable prompts for generating and critiquing screen flows before implementation
6. **`UX-BUILD-TASKS.md`** — model-lane task list for the UX build and smoke handoff
7. **`ROADMAP.md`** — ordered slices. Sequential, not parallel.
8. **`TASKS.md`** — concrete task list. Working file.
9. **`STATUS.md`** — what actually exists vs is stubbed/broken (audit-derived)
10. **`DECISIONS.md`** — locked choices, append-only, no re-litigating
11. **`PAPERCLIP-HOST-PROMOTION.md`** — how Paperclip became tracked source in this repo
12. **`SKILL-AUDIT.md`** — THEFT skill packs and default department mappings

## How to use this folder

- **Before building anything**, check HANDOFF + SOURCE-OF-TRUTH + ROADMAP.
- **Before claiming work is done**, check STATUS. Update STATUS when status changes.
- **Before re-debating an architecture choice**, check DECISIONS. If it's locked, don't re-litigate without new info.
- **When tempted by a side feature**, add it to TASKS or archive it. Don't build it outside the roadmap.

## Host dev command

- Run the Paperclip host from repo root with:
  - `pnpm run dev:host`
- The old Next.js prototype remains available as:
  - `pnpm run dev:prototype`

## What's NOT source of truth

- `_archive/` — old docs and pre-Paperclip build prompts. Kept for reference only. Building from them caused the drift this folder fixes.
- `frames2/` and `screenshots/` — visual reference only. NOT a pixel spec.
- Pre-existing UI shell at `app/src/app/[org]/...` — most pages are decorative, not wired. STATUS.md flags which ones are real.

## What IS source of truth (besides this folder)

- `cofounder-docs/` — feature spec (32 docs). What features must exist.
- `paperclip/` — tracked working engine/runtime host.
- `skills/<id>/SKILL.md` — instruction packets attached to agents.
