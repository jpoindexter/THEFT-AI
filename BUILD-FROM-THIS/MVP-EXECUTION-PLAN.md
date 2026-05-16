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
- Use the `/Users/jasonpoindexter/Desktop/theft ai_` renders plus `/Users/jasonpoindexter/Desktop/099` as visual source of truth: black digital workbench, mono type, 10px radius, restrained borders, lime only for primary action/state.
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

Status: **implementation pass complete, visual review pending**

Rework task detail around:

- output/evidence first;
- decision panel second;
- comments/context third;
- runtime diagnostics collapsed.

Acceptance:

- User can approve, request revision, complete, or ask Operator without reading raw logs.

### M3 - Tasks / Needs Action

Status: **implementation pass complete, visual review pending**

Rework task list into founder review queue:

- Needs Action
- Ongoing
- Todo
- Done

Acceptance:

- Founder can clear approvals, questions, blocked work, and ready outputs from one page.

### M4 - Tech Tree

Status: **implementation pass complete, visual review pending**

Rework goals into build-order strategy map:

- stages;
- dependencies;
- evidence required;
- selected-node inspector;
- start-work action.

Acceptance:

- Tech Tree reads as company build order, not a generic goals list.

### M5 - Library / Outcomes

Status: **implementation pass complete, visual review pending**

Rework Library around durable company output:

- artifact grid/list;
- provenance;
- source task;
- owner department;
- selected artifact preview.

Acceptance:

- Artifacts clearly connect to work, evidence, and next tasks.

### M6 - Department Workspace

Status: **implementation pass complete, visual review pending**

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

Status: **implementation pass complete, visual review pending**

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
MVP visual alignment to 099/THEFT renders, then dogfood
```

Last completed slices:

- M1 Mission Control Home
- M2 Task Review
- M3 Tasks / Needs Action
- M4 Tech Tree
- M5 Library / Outcomes
- M6 Department Workspace
- M7 System / Diagnostics

M1 files:

- `paperclip/ui/src/pages/Dashboard.tsx`
- `paperclip/ui/src/pages/Dashboard.test.tsx`
- `paperclip/ui/src/index.css`

M2 files:

- `paperclip/ui/src/pages/IssueDetail.tsx`
- `paperclip/ui/src/pages/IssueDetail.test.tsx`

M3 files:

- `paperclip/ui/src/pages/Issues.tsx`
- `paperclip/ui/src/pages/Issues.test.tsx`

M4 files:

- `paperclip/ui/src/pages/Goals.tsx`
- `paperclip/ui/src/pages/GoalDetail.tsx`
- `paperclip/ui/src/pages/GoalDetail.test.tsx`

M5 files:

- `paperclip/ui/src/pages/Library.tsx`
- `paperclip/ui/src/lib/library-items.ts`
- `paperclip/ui/src/lib/library-items.test.ts`

M6 files:

- `paperclip/ui/src/pages/DepartmentWorkspace.tsx`
- `paperclip/ui/src/lib/theft-canvas.test.ts`

M7 files:

- `paperclip/ui/src/components/Sidebar.tsx`
- `paperclip/ui/src/components/Sidebar.test.tsx`

Visual pass files:

- `paperclip/ui/src/components/Layout.tsx`
- `paperclip/ui/src/pages/Dashboard.tsx`
- `paperclip/ui/src/pages/DepartmentWorkspace.tsx`
- `paperclip/ui/src/pages/Goals.tsx`
- `paperclip/ui/src/pages/Library.tsx`

Verified for M1:

1. `git diff --check`
2. `pnpm exec vitest run src/pages/Dashboard.test.tsx --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for M2:

1. `git diff --check`
2. `pnpm exec vitest run src/pages/IssueDetail.test.tsx --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for M3:

1. `git diff --check`
2. `pnpm exec vitest run src/pages/Issues.test.tsx --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for M4:

1. `git diff --check`
2. `pnpm exec vitest run src/pages/GoalDetail.test.tsx --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for M5:

1. `git diff --check`
2. `pnpm exec vitest run src/lib/library-items.test.ts --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for M6:

1. `git diff --check`
2. `pnpm exec vitest run src/lib/theft-canvas.test.ts --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for M7:

1. `git diff --check`
2. `pnpm exec vitest run src/components/Sidebar.test.tsx --config vitest.config.ts` from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`

Verified for visual pass:

1. `git diff --check`
2. Focused Vitest for Dashboard, GoalDetail, library-items, theft-canvas, and Layout from `paperclip/ui`
3. `pnpm -C paperclip --filter @paperclipai/ui typecheck`
4. Headless Chrome screenshots against the live host for Dashboard, Tasks, Tech Tree, Library, Department Workspace, System, mobile Dashboard, and tablet Dashboard
5. Mobile Dashboard overflow diagnostic: `documentElement.scrollWidth === clientWidth` and no right-edge offenders

Verified for 099/THEFT render alignment pass:

1. `pnpm -C paperclip --filter @paperclipai/ui typecheck`
2. Desktop MVP route smoke: `node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --company-prefix THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA --screenshot-dir /private/tmp/theft-mvp-route-smoke-desktop`
3. Mobile MVP route smoke: `node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --company-prefix THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA --mobile --screenshot-dir /private/tmp/theft-mvp-route-smoke-mobile`

Local smoke helper:

- `pnpm smoke:mvp-routes -- --company-prefix <prefix>`
- Add `--mobile` for phone overflow checks.
- This is a zero-quota browser smoke; it does not invoke agents or LLM adapters.

Next exact steps:

1. keep iterating against the render folder until Mission Control, onboarding, tasks, Library, Tech Tree, and Department Workspace match the intended shell;
2. dogfood the MVP happy path manually in the live app;
3. commit/tag locally after visual approval;
4. reserve heavier Playwright/live model smoke for pre-release signoff.
