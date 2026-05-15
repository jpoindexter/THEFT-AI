# THEFT AI

Local-first company operating system built on the tracked Paperclip runtime host.

## Current Architecture

THEFT is one product:

```text
THEFT product layer
  onboarding, Operator, departments, Tech Tree, Company Memory, skills
on top of
Paperclip runtime/control plane
  companies, agents, issues, goals, documents, adapters, heartbeats, approvals
```

The active app lives in `paperclip/`. The old `app/` Next.js prototype is migration/reference material only and must not receive new product features.

Read these first for architecture work:

1. `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md`
2. `BUILD-FROM-THIS/PARITY-DELTA.md`
3. `BUILD-FROM-THIS/ROADMAP.md`
4. `BUILD-FROM-THIS/TASKS.md`
5. `BUILD-FROM-THIS/ARCHITECTURE-CLOSURE.md`

## Run

```sh
pnpm -C paperclip dev:once
```

Open `http://127.0.0.1:3100`.

Fast local health check against a running host:

```sh
node paperclip/scripts/smoke/theft-local-health.mjs
```

Deterministic no-quota department/runtime artifact smoke:

```sh
node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs --adapter process --require-library-artifacts
```

## Build And Verify

```sh
git diff --check
pnpm -C paperclip --filter @paperclipai/ui typecheck
pnpm -C paperclip build
```

Full live LLM department smoke is reserved for release signoff, not normal iteration.

## Active Product Surfaces

- Command Center
- Operator setup and routing
- Departments
- Task Review
- Company Memory
- Tech Tree
- Attention queue

Runtime/admin surfaces may still exist under the Paperclip host for diagnostics, but they are not the primary THEFT product model.
