# HANDOFF — THEFT x Paperclip Merge

> Last updated: 2026-05-13 (desiredSkills route verification checkpoint).
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
pnpm -C paperclip build
```

Results:

- `git diff --check` passed.
- Targeted Vitest needed escalated local bind permission; after that it started, but embedded Postgres tests skipped on this machine because the embedded Postgres init script exited with code 1.
- Route-level agent skills test passed after rerun with escalated local bind permission.
- `pnpm -C paperclip build` passed.
- Build only reports existing Vite chunk-size/dynamic-import warnings.

## Next Exact Tasks

1. Replace Paperclip generic onboarding with THEFT staged onboarding:
   - name company
   - choose stage: pre-idea, idea, validating, building, launched, revenue, scaling, existing business
   - adaptive setup questions
   - allow "already done", "skip", and note/name fields
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
