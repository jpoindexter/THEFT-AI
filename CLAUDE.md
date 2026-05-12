# CLAUDE.md

Root-level guidance for Claude Code. Read on every session start.

## Read first, before any code

**`BUILD-FROM-THIS/`** — source of truth, in this read order:
1. `BUILD-FROM-THIS/PRD.md` — what we're building, v0 done criteria
2. `BUILD-FROM-THIS/ROADMAP.md` — ordered slices for v0/v1/v2
3. `BUILD-FROM-THIS/STATUS.md` — what actually exists vs what's stubbed/broken
4. `BUILD-FROM-THIS/DECISIONS.md` — locked choices, no re-litigating
5. `BUILD-FROM-THIS/PARKED.md` — deferred ideas, not v0 work

If a feature isn't in `cofounder-docs/` or `paperclip/`, don't build it.

## What this repo is

THEFT AI — an AI-agent platform that runs a real company across 8 departments (Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support). Working app lives in `app/`. Other top-level dirs are reference material.

**Visual fidelity to cofounder.co is NOT a goal.** Engine + functional completeness is. (See `BUILD-FROM-THIS/DECISIONS.md`.)

## Repo layout

```
BUILD-FROM-THIS/    Source of truth for what to build. Read first.
_archive/           Old docs (BUILD-MAP.md, PLAN.md, CLONE-GAPS.md, etc.) — do NOT use as source.
app/                Next.js 16 app. All code changes happen here.
paperclip/          Read-only agent-platform reference. Never modify, never run. (not tracked in git)
cofounder-docs/     32 MD files mirroring docs.cofounder.co. Feature spec.
skills/             Skill packets attached to agents (SKILL.md per skill).
frames/, frames2/   Visual reference (~4300 frames). NOT a pixel spec — visual hint only. (not tracked in git)
screenshots/        Earlier visual reference. Same status as frames. (not tracked in git)
dev.sh, reset.sh    Helpers. dev.sh starts the app from project root.
```

## Commands (run from `app/`)

```sh
pnpm dev              # dev server (Turbopack)
pnpm build            # production build
pnpm test             # vitest
pnpm lint             # eslint
pnpm exec tsc --noEmit   # type-check — run after every change
```

No database. App data writes to `app/.theft-data/*.json` (gitignored). Delete to reset.

For real Claude replies, set `ANTHROPIC_API_KEY` in `app/.env.local`. Otherwise falls back to claude CLI subprocess.

## Hard rules

1. **Source of truth = `BUILD-FROM-THIS/` + `cofounder-docs/` + `paperclip/`.** If a feature isn't documented there, don't build it.
2. **Engine before features.** Real tools (shell, web search, file ops, email) come before dept-specific UI flows.
3. **Type-check after every change.** `pnpm exec tsc --noEmit` must be clean.
4. **No DB until v1.** File-backed JSON store is truth.
5. **`paperclip/` is read-only.** Never modify, never run.
6. **No pixel-matching cofounder.co frames.** Visual layer is throwaway, redone post-v0.
7. **`app/CLAUDE.md`** has app-specific stack info. Read before touching app code.
