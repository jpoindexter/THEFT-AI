# AGENTS.md

Conventions for any coding agent or human working in this repo.

## Project Purpose

THEFT AI is a local-first company operating system built on the tracked
Paperclip runtime host. The active product layer is THEFT: onboarding, Operator,
departments, Tech Tree, Company Memory, skills, and task review.

## Active Code Paths

- `paperclip/` - active runtime/control plane and THEFT product host.
- `BUILD-FROM-THIS/` - current architecture, parity, roadmap, and task source of
  truth.
- `specs/004-task-review-output-finalization/` - active task-review output finalization spec.
- `specs/003-operator-task-activation/` - completed Operator task activation spec.
- `specs/002-founder-happy-path/` - supporting active founder flow spec.
- `app/` - old Next.js prototype and migration/reference material only.
- `_reference/` - reference repos only. Do not edit unless explicitly asked.

## Commands

Run root commands from `/Users/jasonpoindexter/Documents/GitHub/THEFT AI`.

```bash
pnpm dev:once
pnpm dev:list
pnpm dev:stop
pnpm typecheck
pnpm build
pnpm test
pnpm smoke:health
pnpm smoke:mvp-routes
pnpm smoke:departments
pnpm verify:active-ui
```

Run Paperclip-specific commands from `paperclip/` only when the root script does
not cover the task.

```bash
pnpm run typecheck
pnpm run test:run
pnpm run build
```

## Required Verification

- Small code edit: `pnpm typecheck`
- Runtime/Paperclip behavior edit: `pnpm test`
- Active UI edit: `pnpm verify:active-ui`
- Department/runtime edit: `pnpm smoke:departments`
- Pre-ship gate: `git diff --check`, `pnpm typecheck`, `pnpm build`, plus
  relevant smoke tests.

Full live LLM department smoke is for release signoff, not normal iteration.

## Forbidden Actions

- Do not add new product features to `app/`.
- Do not edit `_reference/` unless explicitly asked.
- Do not commit secrets, `.env`, auth files, local databases, or generated cache.
- Do not run destructive database operations without approval.
- Do not force push.
- Do not bypass tests or hooks.

## Architecture Notes

THEFT is one product:

```text
THEFT product layer
  onboarding, Operator, departments, Tech Tree, Company Memory, skills
on top of
Paperclip runtime/control plane
  companies, agents, issues, goals, documents, adapters, heartbeats, approvals
```

Runtime/admin surfaces may exist under the Paperclip host for diagnostics, but
they are not the primary THEFT product model.

## Spec Kit

GitHub Spec Kit is installed as a shared CLI (`specify`) from the sibling repo at
`/Users/jasonpoindexter/Documents/GitHub/spec-kit`. This repo has adopted Spec
Kit with Codex skills in `.agents/skills` and governance in
`.specify/memory/constitution.md`.

Use `$speckit-*` skills for substantial feature work that needs a durable
spec/plan/tasks trail.

## Read First

For active task-review output finalization work, read:

1. `specs/004-task-review-output-finalization/plan.md`
2. `specs/003-operator-task-activation/plan.md`
3. `specs/002-founder-happy-path/plan.md`
4. `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md`
5. `BUILD-FROM-THIS/PARITY-DELTA.md`
6. `BUILD-FROM-THIS/COFOUNDER-FRAME-FLOW.md`
7. `BUILD-FROM-THIS/ROADMAP.md`
8. `BUILD-FROM-THIS/TASKS.md`

The older `specs/001-paperclip-engine-adoption/` files are historical bridge
context, not the final architecture.

## Next.js Note

This repo includes modern Next.js surfaces. APIs, conventions, and file
structure may differ from model training data. Read the relevant guide in
`node_modules/next/dist/docs/` before changing Next.js-specific behavior.

## Harness Notes

Codex:

- Use `deep` for architecture and migration work.
- Use `frontend` for active UI work and run `pnpm verify:active-ui`.
- Use `ship` for final verification.

Claude Code:

- Mirror this file into `CLAUDE.md` if Claude needs a dedicated compatibility
  file. If there is a conflict, prefer `AGENTS.md`.

Pi:

- Use the same active paths and verification gates as Codex.
