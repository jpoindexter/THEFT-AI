# BUILD FROM THIS

> Single source of truth. Read these in order. Don't build anything that isn't here.

## Read order

1. **`SOURCE-OF-TRUTH.md`** — canonical merge decision: THEFT product layer on a Paperclip runtime host
2. **`PARITY-DELTA.md`** — feature parity, product deltas, gaps, and build order
3. **`PRD.md`** — what THEFT AI is, who it's for, what "v0 done" means
4. **`ROADMAP.md`** — ordered slices. Sequential, not parallel.
5. **`TASKS.md`** — concrete task list. Working file.
6. **`STATUS.md`** — what actually exists vs is stubbed/broken (audit-derived)
7. **`DECISIONS.md`** — locked choices, append-only, no re-litigating
8. **`PARKED.md`** — deferred ideas, never deleted, promoted later

## How to use this folder

- **Before building anything**, check PRD + ROADMAP. If it's not in v0 scope, park it.
- **Before claiming work is done**, check STATUS. Update STATUS when status changes.
- **Before re-debating an architecture choice**, check DECISIONS. If it's locked, don't re-litigate without new info.
- **When tempted by a side feature**, write it in PARKED. Don't build it.

## What's NOT source of truth

- `_archive/` — old docs (BUILD-MAP.md, PLAN.md, CLONE-GAPS.md, cofounder-how-to.md, RECORDING-NEEDED.md). Kept for reference only. Building from them caused the drift this folder fixes.
- `frames2/` and `screenshots/` — visual reference only. NOT a pixel spec.
- Pre-existing UI shell at `app/src/app/[org]/...` — most pages are decorative, not wired. STATUS.md flags which ones are real.

## What IS source of truth (besides this folder)

- `cofounder-docs/` — feature spec (32 docs). What features must exist.
- `paperclip/` — working engine/runtime baseline. Currently ignored/untracked; must be promoted or forked before it becomes final tracked host.
- `skills/<id>/SKILL.md` — instruction packets attached to agents.
