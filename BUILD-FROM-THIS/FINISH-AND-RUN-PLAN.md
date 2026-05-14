# FINISH AND RUN PLAN — THEFT x Paperclip

> Created 2026-05-14. This is the execution plan for turning the tracked Paperclip host into the local THEFT v0.

## Target

Ship one local app, run from `paperclip/`, where a founder can:

1. create a company through THEFT staged onboarding;
2. land in a useful company canvas;
3. see Operator plus 8 department agents;
4. run/review real Paperclip issues through local adapters;
5. find outputs in a Library/artifact surface;
6. continue work without the old JSON runtime.

## Operating Rule

Do not build more bridge code in `app/`. Use `app/` only as visual/reference material. New product behavior goes into `paperclip/`.

## Build Sequence

### 1. Make The Host Reliably Runnable

Goal: any contributor can start the final app without guessing.

- Run from `paperclip/` with `pnpm dev` or `pnpm dev:once`.
- Confirm the API/UI serves on `http://localhost:3100`.
- Fix embedded Postgres boot if it blocks local runs or browser tests.
- Document the one command and current URL in `BUILD-FROM-THIS/STATUS.md`.

Acceptance:

- `pnpm -C paperclip build` passes.
- `pnpm -C paperclip dev:once` starts.
- `curl http://localhost:3100` returns an app response.

### 2. Finish THEFT Onboarding In Paperclip

Goal: onboarding creates the actual Paperclip company state.

- Replace generic company creation as the primary entry route.
- Preserve local trusted entry/auth.
- Persist company profile metadata: stage, setup statuses, notes, existing assets, initial idea.
- Seed Operator, 8 department agents, first roadmap goal, and starter issue per department.
- Hide credits/billing during local onboarding.
- Add browser coverage for desktop and mobile happy paths.

Acceptance:

- Fresh local onboarding creates one Paperclip company.
- Company has Operator plus Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support.
- Each department has at least one assigned issue.
- No local onboarding screen presents fake billing/credits.

### 3. Build The THEFT Company Canvas

Goal: replace Paperclip dashboard-first UX with an operator workspace.

- Company overview reads Paperclip company/profile/goals/agents/issues.
- Department lanes read Paperclip agents and filtered issues.
- Attention queue reads approvals/interactions/reviewable work.
- Operator tray creates Paperclip issues/comments.
- Tech tree renders roadmap nodes from Paperclip goals/projects/issues.

Acceptance:

- After onboarding, the first screen is a useful company canvas.
- User can create a task from Operator tray and see it as a Paperclip issue.
- User can open a department and see its agent plus work queue.

### 4. Build Task Detail And Review Flow

Goal: real work is visible and reviewable.

- Task detail reads Paperclip issue, comments, documents, runs, and interactions.
- Status controls mutate Paperclip issue state only.
- Review actions use Paperclip approvals/interactions.
- Run logs/transcripts are visible enough for local dogfooding.

Acceptance:

- User can open a starter task, run/pause/review it, and change its state.
- A blocked approval appears in the attention queue.
- No active task path writes to THEFT JSON state.

### 5. Build Library v0

Goal: outputs become durable product assets.

- Map Paperclip issue documents, attachments, and work products to Library items.
- Add department grouping.
- Add pinned files.
- Add safe markdown/text editing for supported documents.
- Ensure agent output lands in Library by default.

Acceptance:

- Running a task creates or links a visible Library item.
- Library can filter by department.
- Pinned artifacts survive refresh/restart.

### 6. Eight Department Runtime Smoke

Goal: prove this is an agentic company, not only UI.

Run one task for each department through a real or deterministic local adapter:

- Engineering: repo/code task.
- Design: brand/design artifact.
- Marketing: positioning/content artifact.
- Sales: ICP/outreach artifact.
- Operations: process/status artifact.
- Finance: reporting/planning artifact.
- Legal: policy/document artifact.
- Support: knowledge/support artifact.

Acceptance:

- All 8 tasks produce a saved output.
- Failed adapter setup produces an actionable error, not a dead UI.
- Outputs appear in Library.

### 7. Remove Dead Product Surface

Goal: one product path remains.

- Archive active `app/` routes once Paperclip parity is proven.
- Remove duplicated JSON runtime routes from active product.
- Remove fake credits and unimplemented billing.
- Remove user-facing Cofounder copy.
- Remove LLC/service-company assumptions.

Acceptance:

- One dev command is the default product path.
- Old app is clearly marked reference/archive.
- No happy path depends on JSON runtime state.

## Model Plan

Use `gpt-5.5` as the default build/review model during the migration. It is the right fit for cross-cutting UI/runtime work.

For Paperclip agents after v0:

- Operator, Legal, Finance, architecture review: `gpt-5.5`.
- Engineering implementation: Codex local with `gpt-5.5` primary profile.
- Design/Marketing/Sales drafts: cheaper model lane only after runtime smoke passes.
- Routine follow-up tasks: cheap profile with review before external effects.

## Immediate Next Work Order

1. Start and verify the Paperclip host locally.
2. Fix any dev-server/Postgres blocker.
3. Complete onboarding route replacement and local billing removal.
4. Browser-test onboarding to company canvas.
5. Build canvas over Paperclip data.
6. Add Library v0.
7. Run the 8-department smoke.

## Run Commands

From the parent repo:

```bash
pnpm -C paperclip build
pnpm -C paperclip dev:once
node paperclip/scripts/smoke/theft-local-health.mjs
```

From inside `paperclip/`:

```bash
pnpm build
pnpm dev:once
node scripts/smoke/theft-local-health.mjs
```

Expected app URL:

```text
http://localhost:3100
```

## Verification Commands

Build:

```bash
pnpm -C paperclip build
```

Dev server:

```bash
pnpm -C paperclip dev:once
```

Health:

```bash
curl -fsS http://127.0.0.1:3100/api/health
```

Root route:

```bash
curl -fsS http://127.0.0.1:3100/ >/dev/null && echo root-ok
```

Local host smoke against an already-running server:

```bash
node paperclip/scripts/smoke/theft-local-health.mjs
```

Eight-department deterministic adapter runtime smoke against an already-running server:

```bash
node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs
```

Optional Codex-backed version when local Codex auth is ready:

```bash
THEFT_SMOKE_ADAPTER=codex_local THEFT_SMOKE_CODEX_MODEL=gpt-5.3-codex-spark node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs
```

THEFT onboarding e2e:

```bash
pnpm -C paperclip test:e2e -- tests/e2e/onboarding.spec.ts
```

Current limitation: deterministic `process` adapter smoke proves Paperclip
runtime dispatch, wakeups, and terminal runs across all 8 departments. The
remaining higher-fidelity pass is Codex/Claude-backed output creation with
Library artifact verification.
