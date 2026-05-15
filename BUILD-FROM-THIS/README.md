# BUILD FROM THIS

> Single source of truth. Read these in order. Don't build anything that isn't here.

## Read order

1. **`HANDOFF.md`** — resume state, pushed commits, current implementation status, next exact tasks
2. **`SOURCE-OF-TRUTH.md`** — canonical merge decision: THEFT product layer on a Paperclip runtime host
3. **`PARITY-DELTA.md`** — feature parity, product deltas, gaps, and build order
4. **`UX-DIRECTION.md`** — product UX direction tying Paperclip, Cofounder, Hyperagent, skills, and THEFT happy path together
5. **`MISSION-CONTROL-UX.md`** — current interface target: streamlining into Mission Control without removing Paperclip/runtime features
6. **`VISUAL-UX-REFERENCES.md`** — MagicPath, local reference board, cthdrl, Sana, and strategy-interface visual direction
7. **`STYLE-TARGET-099.md`** — final visual style target: 099 terminal workbench, black/white/gray, mono, no neon/HUD skin
8. **`GPT-IMAGE-SCREEN-PROMPTS.md`** — exact GPT Image prompts for Mission Control screens and visual acceptance criteria
9. **`GPT-IMAGE-RENDER-DECISIONS.md`** — reviewed render set, structure references, drift warnings, and implementation order
10. **`MVP-EXECUTION-PLAN.md`** — fastest path to a usable MVP, screen order, acceptance gates, and lightweight verification policy
11. **`UX-SCREEN-PROMPTS.md`** — reusable prompts for generating and critiquing screen flows before implementation
12. **`UX-POLISH-DECISIONS.md`** — accepted Phase 3 prompt outcomes and implementation deltas
13. **`UX-BUILD-TASKS.md`** — model-lane task list for the UX build and smoke handoff
14. **`ROADMAP.md`** — ordered slices. Sequential, not parallel.
15. **`TASKS.md`** — concrete task list. Working file.
16. **`STATUS.md`** — what actually exists vs is stubbed/broken (audit-derived)
17. **`DECISIONS.md`** — locked choices, append-only, no re-litigating
18. **`PAPERCLIP-HOST-PROMOTION.md`** — how Paperclip became tracked source in this repo
19. **`SKILL-AUDIT.md`** — THEFT skill packs and default department mappings

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
- `magic patch frames/` and `/Users/jasonpoindexter/Desktop/theft ai` — visual reference only. The synthesis is in `VISUAL-UX-REFERENCES.md`.
- Pre-existing UI shell at `app/src/app/[org]/...` — most pages are decorative, not wired. STATUS.md flags which ones are real.

## What IS source of truth (besides this folder)

- `cofounder-docs/` — feature spec (32 docs). What features must exist.
- `paperclip/` — tracked working engine/runtime host.
- `skills/<id>/SKILL.md` — instruction packets attached to agents.
