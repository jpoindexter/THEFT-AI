# UX BUILD TASKS - THEFT COMPANY OS

> Created 2026-05-14. Use this as the implementation checklist for the Paperclip-host UX pass. It converts `UX-DIRECTION.md` and `UX-SCREEN-PROMPTS.md` into a model-lane task list.

## Model Lanes

| Lane | Use For | Do Not Use For |
|---|---|---|
| `gpt-5.5 xhigh` | Product synthesis, anti-clone critique, acceptance gates, task planning, hard tradeoffs | Routine UI coding, copy polish, smoke loops |
| `gpt-5.5 high` | Main UI implementation, tests, data wiring, frontend architecture, code review | Tiny copy changes or repeated simple edits |
| `gpt-5.5 medium` | Screen variants, responsive polish, empty states, copy options, smaller component passes | Architecture decisions |
| `gpt-5.5 low` | Mechanical cleanup, labels, obvious docs updates | Product direction |
| `gpt-5.3-codex-spark` or `gpt-5.3-codex` | Runtime smoke after the build pass | Product synthesis |

## Execution Rules

- While on `gpt-5.5 xhigh`, finish only the synthesis and task-design work, then switch models.
- While on `gpt-5.5 high`, implement the first end-to-end happy path before expanding secondary screens.
- Keep all runtime data in `paperclip/`; do not build new final product surface in `app/`.
- Any new UI must make Paperclip feel like THEFT: company, Operator, departments, tasks, Library, Tech Tree, decisions.
- Agent roster, invocations, adapters, costs, tools, and skills belong in Admin, Advanced, or Diagnostics surfaces unless needed for the immediate task.
- Use `BUILD-FROM-THIS/VISUAL-UX-REFERENCES.md` for the current visual target: warm-white enterprise creation workspace, MagicPath-style command-to-canvas flow, Sana-like product restraint.

## Phase 0 - XHIGH Synthesis Gate

- [x] UX001 [XHIGH] Tie Paperclip, Cofounder, Hyperagent, THEFT skills, and the target happy path together in `BUILD-FROM-THIS/UX-DIRECTION.md`.
- [x] UX002 [XHIGH] Create reusable screen-generation and critique prompts in `BUILD-FROM-THIS/UX-SCREEN-PROMPTS.md`.
- [x] UX003 [XHIGH] Create the model-lane implementation checklist in `BUILD-FROM-THIS/UX-BUILD-TASKS.md`.
- [x] UX004 [XHIGH] Link UX direction, prompts, and task list from `BUILD-FROM-THIS/README.md`.
- [x] UX005 [XHIGH] Define anti-clone gates in `BUILD-FROM-THIS/UX-BUILD-TASKS.md` so the product does not drift into Paperclip, Cofounder, or Hyperagent mimicry.
- [x] UX006 [XHIGH] Add the UX execution gate to `BUILD-FROM-THIS/TASKS.md`.
- [x] UX007 [XHIGH] Document MagicPath frames, local Desktop refs, and Sana visual direction in `BUILD-FROM-THIS/VISUAL-UX-REFERENCES.md`.

## Phase 1 - HIGH Happy Path Implementation

Goal: a founder can create a company, see THEFT assemble it, land in Command Center, route work, review a task, and see output in Library.

- [x] UX010 [HIGH] [US1] Reshape the first-run flow in `paperclip/ui/src/components/OnboardingWizard.tsx` so the first screen is company creation and stage selection, not adapter/model setup.
- [x] UX011 [HIGH] [US1] Move model/adapter selection in `paperclip/ui/src/components/OnboardingWizard.tsx` behind an Advanced section with a sane local default.
- [x] UX012 [HIGH] [US1] Add a Company Assembly Preview in `paperclip/ui/src/components/OnboardingWizard.tsx` using `paperclip/ui/src/lib/onboarding-seed.ts` so the user sees Operator, 8 departments, starter tasks, and default skills before launch.
- [x] UX013 [HIGH] [US1] Persist any new assembly-preview metadata through `paperclip/ui/src/lib/onboarding-context.ts` and `paperclip/ui/src/lib/onboarding-launch.ts`.
- [x] UX014 [HIGH] [US1] Update focused onboarding tests in `paperclip/ui/src/lib/onboarding-context.test.ts`, `paperclip/ui/src/lib/onboarding-launch.test.ts`, and `paperclip/tests/e2e/onboarding.spec.ts`.
- [x] UX015 [HIGH] [US1] Verify `/onboarding` desktop and mobile rendering with the Browser plugin or Playwright screenshots.

- [x] UX020 [HIGH] [US2] Reframe `paperclip/ui/src/pages/Dashboard.tsx` as THEFT Command Center / Canvas using `paperclip/ui/src/lib/theft-canvas.ts`.
- [x] UX021 [HIGH] [US2] Add Command Center sections in `paperclip/ui/src/pages/Dashboard.tsx`: company stage, current bottleneck, Operator tray, department status grid, attention queue, Tech Tree next steps, and latest Library outputs.
- [x] UX022 [HIGH] [US2] Keep agent roster, cost charts, model config, invocations, tools, and skills out of the primary Command Center by adjusting `paperclip/ui/src/components/Sidebar.tsx` and `paperclip/ui/src/App.tsx` only where needed.
- [x] UX023 [HIGH] [US2] Add or update tests for Command Center helpers in `paperclip/ui/src/lib/theft-canvas.test.ts` and page behavior in the nearest existing dashboard test file.

- [x] UX030 [HIGH] [US3] Reframe `paperclip/ui/src/pages/IssueDetail.tsx` as a THEFT Task Review surface: objective, owner department, run timeline, output, decisions, Library artifacts, and comments.
- [x] UX031 [HIGH] [US3] Keep diagnostics available but secondary in `paperclip/ui/src/components/IssueRunLedger.tsx`, `paperclip/ui/src/components/IssueDocumentsSection.tsx`, and `paperclip/ui/src/components/IssueRelatedWorkPanel.tsx`.
- [x] UX032 [HIGH] [US3] Add task-review coverage in `paperclip/ui/src/pages/IssueDetail.test.tsx`.

- [x] UX040 [HIGH] [US4] Reframe `paperclip/ui/src/pages/Library.tsx` as the durable company memory and output shelf, grouped by department and pinned work.
- [x] UX041 [HIGH] [US4] Ensure Library item mapping in `paperclip/ui/src/lib/library-items.ts` identifies generated work products from issue documents, attachments, and run outputs.
- [x] UX042 [HIGH] [US4] Verify smoke outputs become Library artifacts with a deterministic zero-quota adapter contract in `paperclip/scripts/smoke/theft-department-runtime-smoke.mjs`.

## Phase 2 - HIGH Department And Roadmap Surfaces

- [x] UX050 [HIGH] [US5] Add or refine department workspace routing in `paperclip/ui/src/App.tsx` and the relevant page/component files so each department has mission, active work, blocked items, review-ready outputs, related Library files, and secondary skills/tools info.
- [x] UX051 [HIGH] [US5] Use `buildDepartmentCanvasRows` from `paperclip/ui/src/lib/theft-canvas.ts` as the source for department summaries instead of duplicating issue filters.
- [x] UX052 [HIGH] [US5] Add tests for department row ownership and issue grouping in `paperclip/ui/src/lib/theft-canvas.test.ts`.

- [x] UX060 [HIGH] [US6] Reframe `paperclip/ui/src/pages/Goals.tsx` and `paperclip/ui/src/pages/GoalDetail.tsx` as Tech Tree / roadmap surfaces without breaking Paperclip goal data.
- [x] UX061 [HIGH] [US6] Make roadmap nodes show department owner, dependencies, state, evidence, and next action.
- [x] UX062 [HIGH] [US6] Add focused tests in `paperclip/ui/src/pages/GoalDetail.test.tsx` or helper tests for roadmap ordering.

- [x] UX063 [HIGH] [US6] Apply the visual reference decision to Tech Tree: warm-white canvas, left Operator/task context, selected-node inspector, and evidence-first roadmap nodes.

## Phase 3 - MEDIUM Screen Generation And Polish

- [x] UX070 [MEDIUM] Run Prompt 2 from `BUILD-FROM-THIS/UX-SCREEN-PROMPTS.md` for first-run onboarding variants.
- [x] UX071 [MEDIUM] Run Prompt 3 for Company Assembly Preview variants.
- [x] UX072 [MEDIUM] Run Prompt 4 for Command Center variants.
- [x] UX073 [MEDIUM] Run Prompt 5 for department workspace variants.
- [x] UX074 [MEDIUM] Run Prompt 6 for task detail and review variants.
- [x] UX075 [MEDIUM] Run Prompt 7 for Library variants.
- [x] UX076 [MEDIUM] Run Prompt 8 for Tech Tree / roadmap variants.
- [x] UX077 [MEDIUM] Run Prompt 9 against every accepted screen and reject anything that reads like a Paperclip, Cofounder, or Hyperagent clone.
- [x] UX078 [MEDIUM] Convert accepted screens into implementation deltas with Prompt 10 and save decisions back into `BUILD-FROM-THIS/UX-DIRECTION.md` or this file.
- [x] UX079 [MEDIUM] Verify desktop, tablet, and mobile layouts for onboarding, Command Center, Library, and task review.
- [x] UX080 [MEDIUM] Run a visual pass on Command Center, Department Workspace, Library, and Tech Tree against `VISUAL-UX-REFERENCES.md`: light/cream shell, canvas-first structure, artifact previews, restrained accents.

## Phase 4 - LOW Copy And Mechanical Cleanup

- [x] UX090 [LOW] Remove user-facing raw Paperclip language from primary UX copy in `paperclip/ui/src/components/OnboardingWizard.tsx`, `paperclip/ui/src/pages/Dashboard.tsx`, `paperclip/ui/src/pages/IssueDetail.tsx`, and `paperclip/ui/src/pages/Library.tsx`.
- [x] UX091 [LOW] Remove active user-facing Cofounder copy from the Paperclip host UI files.
- [x] UX092 [LOW] Move fake credits, billing, and cost-first labels out of the local v0 primary path in `paperclip/ui/src/components/Sidebar.tsx` and related pages.
- [x] UX093 [LOW] Keep route names and document titles aligned with THEFT language: Command Center, Departments, Tasks, Library, Tech Tree, Admin, Diagnostics.
- [x] UX094 [LOW] Update `BUILD-FROM-THIS/STATUS.md`, `BUILD-FROM-THIS/TASKS.md`, and `BUILD-FROM-THIS/ROADMAP.md` after each implemented slice.

## Phase 5 - 5.3 Runtime Smoke

Run this only after the `gpt-5.5 high` build pass has a working happy path.

- [x] UX100 [SMOKE] Run `node paperclip/scripts/smoke/theft-local-health.mjs` against the local host.
- [x] UX101 [SMOKE] Run `pnpm -C paperclip exec playwright test tests/e2e/onboarding.spec.ts --config tests/e2e/playwright.config.ts`.
- [x] UX102 [SMOKE] Run deterministic 8-department smoke with `node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs`.
- [x] UX103 [SMOKE] Run Codex local 8-department smoke with `THEFT_SMOKE_ADAPTER=codex_local THEFT_SMOKE_CODEX_MODEL=gpt-5.3-codex-spark` as a pre-release/signoff check only.
- [x] UX104 [SMOKE] Verify Engineering, Design, Marketing, Sales, Operations, Finance, Legal, and Support each produce a Library-visible artifact through the deterministic process artifact contract.
- [x] UX105 [SMOKE] Update `BUILD-FROM-THIS/STATUS.md` with company id, issue ids, run ids, and Library artifact ids from the smoke.

## Anti-Clone Acceptance Gates

Before any screen is accepted, it must pass these gates:

- The first viewport answers "what should this company do next?"
- The screen uses THEFT product objects: company, Operator, departments, tasks, decisions, Library, Tech Tree.
- Agent runtime objects are present only when they help the user act.
- It does not lead with Config, Invocations, Tools, Skills, Knowledge, cost charts, or agent rosters.
- It does not reuse Cofounder naming, branding, or paid-service assumptions.
- It does not look like Hyperagent's agent detail/admin pattern as the main product surface.
- It stays backed by Paperclip data and does not reintroduce the legacy JSON runtime.

## Next Model Handoff

After completing Phase 0 on `gpt-5.5 xhigh`, switch to:

```text
Model: gpt-5.5
Thinking: high
```

Start the next session with:

```text
Read BUILD-FROM-THIS/README.md, then BUILD-FROM-THIS/UX-BUILD-TASKS.md.
Continue from UX010 and implement the Phase 1 HIGH happy path in paperclip/.
Do not build in app/. Keep Paperclip as runtime and make the UX feel like THEFT, not an agent admin dashboard.
```
