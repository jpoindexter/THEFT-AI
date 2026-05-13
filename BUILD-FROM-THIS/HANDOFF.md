# HANDOFF — THEFT x Paperclip Merge

> Last updated: 2026-05-14 (settings happy-path route fix).
> Branch: `codex-current-design-migration`.
> Read this first if continuing in Claude, Codex, Gemini, or another local agent.

## One Sentence

THEFT should become one Paperclip-hosted local app: Paperclip provides the runtime/control plane, while THEFT provides onboarding, company-stage flow, departments, design, and the expanded skill library.

## Product Decision

- Do not keep `app/` and `paperclip/` as two competing products.
- The long-term host is `paperclip/`.
- The old Next app under `app/` is now a migration reference/prototype.
- Paperclip runtime concepts should power THEFT concepts:
  - Paperclip company = THEFT company
  - Paperclip agents = Operator and department agents
  - Paperclip goals/issues = roadmap/tasks
  - Paperclip issue documents/attachments = Library/work products
  - Paperclip skills = THEFT skill execution context

## Current Checkpoints

Already committed and pushed:

- `b1811de Define Paperclip-host merge source of truth`
- `55efe73 Promote Paperclip as tracked runtime host`

Current working slice:

- Register root `skills/*/SKILL.md` as read-only THEFT bundled Paperclip company skills.
- Stable key format: `theft/skills/<skill-slug>`.
- Paperclip bundled skills remain `paperclipai/paperclip/<skill-slug>`.

## Current Files To Know

- `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md` — canonical architecture decision.
- `BUILD-FROM-THIS/PARITY-DELTA.md` — what Paperclip has, what THEFT adds, what is missing.
- `BUILD-FROM-THIS/TASKS.md` — active task board.
- `BUILD-FROM-THIS/ROADMAP.md` — milestone slices.
- `BUILD-FROM-THIS/SKILL-AUDIT.md` — root skill classification by department.
- `BUILD-FROM-THIS/PAPERCLIP-HOST-PROMOTION.md` — how Paperclip was promoted into tracked source.
- `paperclip/THEFT.md` — Paperclip-local product override.
- `paperclip/AGENTS.md` — Paperclip host instructions.

## Current Implementation State

Done:

- `paperclip/` is tracked source in the parent repo.
- Nested upstream Paperclip git metadata was moved to ignored `paperclip/.git-upstream/`.
- `paperclip/.gitignore` rules now ignore Paperclip generated/runtime folders without ignoring the whole host.
- Paperclip build passes after promotion.
- Root THEFT skills are detected from Paperclip service code.
- THEFT bundled skills get read-only source labels in Paperclip skill lists.
- Skill audit maps each root skill pack to a department/default agent set.

In progress:

- `paperclip/server/src/services/company-skills.ts`
  - now searches both Paperclip bundled skill roots and root `../skills`.
  - marks root skills as `sourceKind: "theft_bundled"`.
  - derives canonical keys as `theft/skills/<slug>`.
- `paperclip/server/src/__tests__/company-skills-service.test.ts`
  - includes a regression test for `theft/skills/company-naming`.
- `paperclip/server/src/routes/agents.ts`
  - now applies THEFT default `desiredSkills` by role when no skills are explicitly provided.
  - this runs for both `POST /agent-hires` and `POST /agents`.
- `paperclip/server/src/services/theft-default-skills.ts`
  - central role-to-`theft/skills/*` mapping used by agent creation routes.
- `paperclip/server/src/__tests__/agent-skills-routes.test.ts`
  - verifies `POST /agents` and `POST /agent-hires` seed role-based THEFT defaults when `desiredSkills` is omitted.
- `paperclip/ui/src/components/OnboardingWizard.tsx`
  - Step 1 now includes company stage picker and setup-item status controls (`done`, `skipped`, `todo`) with notes.
  - onboarding context is persisted into company description on create.
- `paperclip/ui/src/lib/onboarding-context.ts`
  - shared parser/formatter for persisted onboarding context block.
  - includes per-stage task/interview templates for adaptive onboarding.
- `paperclip/ui/src/components/OnboardingWizard.tsx`
  - Step 3 now auto-prefills stage-specific task title/description.
  - Step 3 now asks one stage-specific interview question and appends the answer to the launched issue description.
- `paperclip/ui/src/lib/onboarding-seed.ts`
  - defines 8 department seed specs (role/title/desiredSkills + stage-specific starter task templates).
- `paperclip/ui/src/components/OnboardingWizard.tsx`
  - launch step now hires the 8 department agents under Operator, auto-approves onboarding hire approvals, and seeds one starter issue per department.
- `app/src/components/org-top-bar.tsx`
  - org switcher trigger changed from a `<button>` to an accessible `role="button"` container to prevent nested `<button>` hydration errors when the org menu is open.
- `app/src/components/org-onboarding-flow.tsx`
  - if `/api/:org/brief/generate` fails, onboarding now continues with client fallback questions instead of resetting to the first prompt.
- `app/src/components/org-onboarding-plan.tsx`
  - activation request failures now show inline error feedback instead of silent stall.
- `app/src/app/api/[org]/brief/generate/route.ts`
  - marks roadmap nodes `initial-idea` and `pick-company-name` complete when idea submission starts.
- `app/src/components/org-onboarding-flow.tsx`
  - onboarding now auto-redirects to `/:org` shortly after activation, so the flow does not stall in an intermediate design step.
- `app/src/components/org-onboarding-plan.tsx`
  - activation UI copy now reflects completion/redirect instead of a forced next design phase.
- `app/src/app/[org]/(shell)/settings/page.tsx`
  - settings root now redirects to `/:org/settings/organization` (implemented page) instead of missing `/settings/preferences`.
- `app/src/app/[org]/(shell)/settings/nav.tsx`
  - removed links to unimplemented sections (`preferences`, `notifications`, `advanced`) and aligned nav to implemented settings routes only.

Not started yet:

- Onboarding is not yet replaced with THEFT staged onboarding.
- Current `app/` prototype is not archived.
- Fake credits/billing are not fully hidden in the Paperclip host.
- End-to-end happy path is not proven yet.

## Verification Status

Commands run:

```bash
git diff --check
pnpm -C paperclip exec vitest run server/src/__tests__/company-skills-service.test.ts
pnpm -C paperclip exec vitest run server/src/__tests__/agent-skills-routes.test.ts
pnpm -C paperclip exec vitest run ui/src/lib/onboarding-context.test.ts
pnpm -C paperclip build
```

Results:

- `git diff --check` passed.
- Targeted Vitest needed escalated local bind permission; after that it started, but embedded Postgres tests skipped on this machine because the embedded Postgres init script exited with code 1.
- Route-level agent skills test passed after rerun with escalated local bind permission.
- Onboarding context utility test passed.
- Department seed implementation compiles in `pnpm -C paperclip build`.
- `pnpm -C paperclip build` passed.
- Build only reports existing Vite chunk-size/dynamic-import warnings.
- `pnpm -C app build` passed after topbar fix.
- `pnpm -C app exec vitest run src/lib/db/store.test.ts` passed (18/18).
- `pnpm -C paperclip exec playwright test tests/e2e/onboarding.spec.ts --config tests/e2e/playwright.config.ts` is currently blocked in this environment by embedded Postgres init failure during ephemeral `paperclipai onboard --yes --run` startup.

## Next Exact Tasks

1. Replace Paperclip generic onboarding with full THEFT staged onboarding:
   - name company
   - choose stage: pre-idea, idea, validating, building, launched, revenue, scaling, existing business
   - adaptive setup questions by stage (now partially done: step-3 interview)
   - complete "already done", "skip", and note/name fields across all setup steps
2. Seed one Paperclip company with:
   - Operator
   - Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support
   - first roadmap goals/issues
   - imported THEFT skill selections
3. Hide or remove local-only fake credits/billing UX.
4. Browser-test the full happy path from onboarding to task execution.

## Important Product Rules

- Do not force LLC/business-formation assumptions.
- If a user already has a business, setup items must be markable as done with a label/note.
- The first onboarding node, "Initial idea", and "Pick company name" should be marked finished once the user completes those steps.
- Keep the Cofounder flow quality from `frames2/`, but remove Cofounder branding/copy from the active product.
- Use local CLI harnesses through Paperclip adapters: Claude Code, Codex CLI, Gemini CLI, OpenCode, Cursor Agent, etc.
- The local build should not pretend credits/billing exist.

## Resume Commands

```bash
git status --short
git log --oneline -5
pnpm -C paperclip build
pnpm -C paperclip dev
```

If the dev server binds fail in a sandbox, rerun with permission. The app target is the Paperclip host, not the old Next app.
