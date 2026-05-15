# MVP EXECUTION PLAN - THEFT

> Created 2026-05-15. This is the fastest path to a usable MVP without burning quota on live agent smoke during UI iteration.

## MVP Goal

Ship a local-first THEFT MVP on the Paperclip runtime where a founder can:

1. open a company;
2. understand the current objective;
3. see constraints, decisions, work lanes, and outcomes;
4. ask Operator to route work;
5. review task output;
6. find artifacts in Library;
7. keep runtime/admin features reachable under System.

This MVP is not a visual prototype. It must run on `paperclip/` data.

## Non-Negotiables

- Build only in `paperclip/` for the active product.
- Keep Paperclip runtime/admin capability; streamline it behind System/diagnostics.
- Use Mission Control structure from the GPT renders.
- Use 099 visual style: black/white/gray, mono, 10px radius, no neon/HUD skin.
- Avoid full live LLM smoke while iterating. Use deterministic/local checks until pre-release.

## MVP Screen Order

### M1 - Mission Control Home

Status: **implementation pass complete, visual review pending**

Build `/dashboard` into the primary product surface:

- Objective
- Constraints
- Strategy map
- Decisions
- Execution state
- Outcomes
- Next Move
- Operator dock/drawer

Acceptance:

- First viewport answers "what should we do next?"
- Operator is available but not dominant.
- Department cards read as execution lanes.
- Library artifacts appear as outcomes.
- No agent/admin dashboard feel.

### M2 - Task Review

Status: **next**

Rework task detail around:

- output/evidence first;
- decision panel second;
- comments/context third;
- runtime diagnostics collapsed.

Acceptance:

- User can approve, request revision, complete, or ask Operator without reading raw logs.

### M3 - Tasks / Needs Action

Status: **next**

Rework task list into founder review queue:

- Needs Action
- Ongoing
- Todo
- Done

Acceptance:

- Founder can clear approvals, questions, blocked work, and ready outputs from one page.

### M4 - Tech Tree

Status: **next**

Rework goals into build-order strategy map:

- stages;
- dependencies;
- evidence required;
- selected-node inspector;
- start-work action.

Acceptance:

- Tech Tree reads as company build order, not a generic goals list.

### M5 - Library / Outcomes

Status: **next**

Rework Library around durable company output:

- artifact grid/list;
- provenance;
- source task;
- owner department;
- selected artifact preview.

Acceptance:

- Artifacts clearly connect to work, evidence, and next tasks.

### M6 - Department Workspace

Status: **next**

Rework department pages as business lanes:

- mission;
- current objective contribution;
- active work;
- blocked/review items;
- latest outputs;
- context and skills secondary.

Acceptance:

- Department pages do not feel like agent settings.

### M7 - System / Diagnostics

Status: **next**

Contain advanced runtime features:

- agents;
- projects/workstreams;
- skills;
- models/adapters;
- routines;
- costs/usage;
- activity/logs;
- instance settings.

Acceptance:

- Advanced capability remains reachable but stops defining the happy path.

## Verification Strategy

Use lightweight checks during MVP build:

1. `git diff --check`
2. focused Vitest for changed component/page
3. targeted UI typecheck only when TS surfaces changed
4. one browser screenshot pass only after the screen is visually coherent

Avoid during iteration:

- full Playwright onboarding suite;
- full build on every small edit;
- live 8-department Codex smoke;
- LLM artifact smoke.

Reserve heavy checks for pre-release signoff.

## Current Execution

Current active slice:

```text
M2 - Task Review
```

Last completed slice:

- `paperclip/ui/src/pages/Dashboard.tsx`
- `paperclip/ui/src/pages/Dashboard.test.tsx`
- `paperclip/ui/src/index.css`

Verified for M1:

1. `git diff --check`
2. `pnpm exec vitest run src/pages/Dashboard.test.tsx --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Next exact steps:

1. commit, tag, push M1 checkpoint;
2. start M2 Task Review;
3. keep verification focused to changed files until the MVP screen set is coherent.
