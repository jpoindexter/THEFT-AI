# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Read first
Source of truth lives at project root: `../BUILD-FROM-THIS/`. Read those before any code change.

## What this is
Next.js 16 app. AI-agent platform for running a company across 8 departments. Engine in `src/lib/agent/`. File-backed JSON store at `.theft-data/` via `lib/db/store.ts` — no DB yet.

**Visual fidelity is throwaway. Functional completeness is the bar.**

## Stack
- Next.js 16 App Router — `params: Promise<{...}>` always (breaking change from Next.js 15)
- Tailwind v4 with custom tokens: `bg-paper/canvas/cream`, `text-ink/ink-muted/ink-soft`, `border-line`, `bg-mustard`
- `@base-ui/react` for interactive primitives; shadcn/ui wrappers in `components/ui/`
- Anthropic SDK (primary), Ollama and claude CLI as fallbacks
- Lucide icons, `zod` at every API boundary

## Commands (run from `app/`)
```sh
pnpm dev              # dev server (Turbopack)
pnpm build            # production build
pnpm test             # vitest (all tests)
pnpm test -- src/lib/db/store.test.ts   # single test file
pnpm lint             # eslint
pnpm exec tsc --noEmit   # type-check — run after every change
pnpm gate             # local release gate: vitest + prod build + 9 route smoke checks + onboarding API validation
```

## Tests
- Unit tests: co-located in `src/lib/` (e.g. `store.test.ts` next to `store.ts`)
- API integration tests: `src/app/api/__tests__/` — test full route handlers against the live file store
- `vitest.config.ts` runs in `node` environment with `@` alias pointing to `src/`

## Routing
```
src/app/[org]/layout.tsx              # resolves org slug → redirects to /onboarding if no business_plan
src/app/[org]/(shell)/layout.tsx      # OrgShell wrapper (header + sidebar + canvas)
src/app/[org]/(shell)/[department]/page.tsx
src/app/[org]/(shell)/agents/[agent]/page.tsx
src/app/[org]/(shell)/tasks/[task]/page.tsx
src/app/[org]/(shell)/roadmap/page.tsx
src/app/[org]/(shell)/approvals/page.tsx
src/app/[org]/onboarding/page.tsx     # outside (shell) — full-page flow
```

All `[org]/api/...` routes are scoped to an org: `src/app/api/[org]/<resource>/route.ts`.

## Engine — actual files
- `src/lib/agent/run.ts` — main agent loop; returns `AgentTurn[]` and a possible `pause` state
- `src/lib/agent/tools.ts` — Anthropic tool definitions (server-exec + client-pause patterns)
- `src/lib/agent/anthropic.ts` — backend abstraction (Anthropic / Ollama / claude-cli)
- `src/lib/agent/compose-prompt.ts` — `composeAgentPromptForDept()`: resolves dept → agent → loads attached `SKILL.md` files
- `src/lib/engine/tool-dispatcher.ts` — `EngineToolDispatcher` class; the extension point for adding new agent tools. Call `.register({ descriptor, handler })` to add a tool; `executeEngineTool` / `listEngineTools` are the exported singletons used by `run.ts`
- `src/lib/orgs/bootstrap.ts` — seeds default depts + agents on org creation
- `src/lib/db/store.ts` — file-backed JSON store; `db.*` is the only way to read/write data
- `src/lib/db/agent-state.ts` — persists Operator conversation state (Anthropic history + `AgentTurn[]` + pause)
- `src/lib/db/task-state.ts` — same shape for per-task agent runs

## Auth
Dev-only cookie gate. `src/lib/auth/session.ts` exports `hasLocalSession()` — returns `true` if the `theft-dev-session` cookie equals `"dev"`. No real auth exists yet; route handlers call this to guard writes.

## Store types (defined in `lib/db/store.ts`)
`Org`, `Department`, `Agent`, `Task`, `Message`, `Artifact`, `TechTreeNode`, `TechTreeStatus`, `MemoryItem`, `ApiKey`, `Webhook`, `ApprovalRule`, `EvalSuite`, `Approval`, `TeamMember`, `Routine`, `UsageRecord`

## API response helpers
Always use `src/lib/api/responses.ts` in route handlers — never construct `NextResponse.json` directly:
```ts
ok(data)           // 200
err(404, "not_found", "message")
notFound("agent")
invalidInput(zodError)
```

## Skills to use (when relevant)
- `web-design-guidelines` — invoke for UI work
- `huashu-design` — for HTML prototypes/mockups only, NOT production app code
- `dev-workflow` — implementation discipline

Skills live at `/Users/jasonpoindexter/Documents/GitHub/THEFT AI/skills/` and `workspace-sync/skills/`.

## Rules
1. Type-check after every change: `pnpm exec tsc --noEmit`
2. No DB until v1. File-backed JSON store is truth.
3. Files >300 lines → split. No TODOs, stubs, or placeholders in shipped code.
4. One concern per file.
5. Check `BUILD-FROM-THIS/PRD.md` and `ROADMAP.md` before any new feature. If it's not on the v0 list, it goes in `PARKED.md`.

## Active work
See `../BUILD-FROM-THIS/ROADMAP.md` v0 slices.
