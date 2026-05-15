# TASKS — Paperclip-Host Product Merge

> Working task list. Update status (`☐ todo` / `▶ doing` / `✅ done` / `🚫 blocked`) as work progresses.

## Slice 0.0 — Source Of Truth Cleanup

| ID | Title | Status |
|---|---|---|
| T000 | Read `BUILD-FROM-THIS/`, `cofounder-docs/`, key Paperclip docs, and frame samples | ✅ done |
| T001 | Create `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md` | ✅ done |
| T002 | Create `BUILD-FROM-THIS/PARITY-DELTA.md` | ✅ done |
| T003 | Append new locked decisions | ✅ done |
| T004 | Update `README.md` read order | ✅ done |
| T005 | Update constitution and `AGENTS.md` to stop saying Paperclip is reference-only | ✅ done |
| T006 | Decide host promotion path: tracked subtree vs Paperclip fork repo | ✅ done |

## Slice 0.1 — Promote A Single Host

| ID | Title | Status |
|---|---|---|
| T010 | Create Paperclip-host branch/repo plan with exact git operations | ✅ done |
| T011 | Promote Paperclip into tracked source or move work to Paperclip fork | ✅ done |
| T012 | Copy/port `BUILD-FROM-THIS/` and `skills/` into the host | ✅ done |
| T013 | Add THEFT design tokens/brand shell to Paperclip UI | ✅ done |
| T014 | Add one host dev command and document it | ✅ done |
| T015 | Mark current `app/` as migration reference after host boots | ✅ done |

## Slice 0.2 — Skill Library Import

| ID | Title | Status |
|---|---|---|
| T020 | Audit all `skills/*/SKILL.md` packets and classify by department | ✅ done |
| T021 | Add local skill import command/API for THEFT skill packs | ✅ done |
| T022 | Register skills as Paperclip company skills | ✅ done |
| T023 | Map default department agents to imported skills | ✅ done |
| T024 | Verify `desiredSkills` works with THEFT skill slugs | ✅ done |

## Slice 0.3 — Staged Onboarding

| ID | Title | Status |
|---|---|---|
| T030 | Replace Paperclip generic company creation with THEFT entry route | ✅ done |
| T031 | Add company name step | ✅ done |
| T032 | Add company stage picker: pre-idea, idea, validating, building, launched, revenue, scaling, existing business | ✅ done |
| T033 | Add adaptive setup interview per stage | ✅ done |
| T034 | Add "already done", "skip", and note/name fields for setup items | ✅ done |
| T035 | Create Paperclip company profile metadata from onboarding | ✅ done |
| T036 | Seed Operator, 8 departments/agents, roadmap goals/issues, and first tasks | ✅ done |
| T037 | Hide local credits/billing prompts during onboarding | ✅ done |
| T038 | Browser-test onboarding desktop/mobile | ✅ done |
| T039 | Add verification smoke helper/checklist for Paperclip host run readiness | ✅ done |

## Slice 0.4 — Canvas / Tasks / Roadmap On Paperclip

| ID | Title | Status |
|---|---|---|
| T040 | Build THEFT company canvas using Paperclip company/goals/agents/issues | ✅ done |
| T041 | Build department workspace view over Paperclip agents/issues | ✅ done |
| T042 | Build task list/detail over Paperclip issues/comments/documents/runs | ✅ done |
| T043 | Build attention queue from Paperclip approvals/interactions/reviewable work | ✅ done |
| T044 | Build Operator tray that writes Paperclip issues/comments | ✅ done |
| T045 | Map Tech Tree to Paperclip goals/projects/issues | ✅ done |

## Slice 0.5 — Library

| ID | Title | Status |
|---|---|---|
| T050 | Map issue documents/attachments/work products to Library items | ✅ done |
| T051 | Add department folders and pinned files | ✅ done |
| T052 | Add safe markdown/text edit flow | ✅ done |
| T053 | Ensure agent outputs land in Library by default | ✅ done |

## Slice 0.6 — Department Runtime Smoke

| ID | Title | Status |
|---|---|---|
| T060 | Engineering smoke through Paperclip adapter | ✅ done |
| T061 | Design smoke through Paperclip adapter | ✅ done |
| T062 | Marketing smoke through Paperclip adapter | ✅ done |
| T063 | Sales smoke through Paperclip adapter | ✅ done |
| T064 | Operations smoke through Paperclip adapter | ✅ done |
| T065 | Finance smoke through Paperclip adapter | ✅ done |
| T066 | Legal smoke through Paperclip adapter | ✅ done |
| T067 | Support smoke through Paperclip adapter | ✅ done |
| T068 | Convert 8-department smoke checklist into automated Playwright/API coverage | ✅ done |
| T069 | Run 8-department smoke with an LLM adapter | ✅ done |
| T069A | Verify department smoke outputs become Library artifacts with zero model quota | ✅ done |

## Slice 0.7 — Subtract Dead Surface

| ID | Title | Status |
|---|---|---|
| T070 | Archive duplicated JSON runtime routes | ✅ done |
| T071 | Remove or hide fake credits/billing | ✅ done |
| T072 | Remove user-facing Cofounder copy from active product | ✅ done |
| T073 | Remove LLC/service-company assumptions from setup | ✅ done |
| T074 | Verify one app/server happy path | ✅ done |

## Slice 0.8 — UX Execution Gate

| ID | Title | Status |
|---|---|---|
| T080 | Create UX direction doc tying Paperclip, Cofounder, Hyperagent, THEFT skills, and happy path together | ✅ done |
| T081 | Create reusable UX screen prompts for onboarding, assembly, Command Center, departments, task review, Library, Tech Tree, critique, and implementation translation | ✅ done |
| T082 | Create model-lane UX build task list in `BUILD-FROM-THIS/UX-BUILD-TASKS.md` | ✅ done |
| T083 | Execute xhigh synthesis gate and prepare handoff to `gpt-5.5 high` | ✅ done |
| T084 | Switch to `gpt-5.5 high` and complete `UX010`-`UX015` onboarding happy path in `paperclip/` | ✅ done |
| T085 | Continue `UX020` Command Center / Canvas implementation from `BUILD-FROM-THIS/UX-BUILD-TASKS.md` | ✅ done |
| T086 | Continue `UX030` Task Review implementation from `BUILD-FROM-THIS/UX-BUILD-TASKS.md` | ✅ done |
| T087 | Continue `UX040` Library implementation from `BUILD-FROM-THIS/UX-BUILD-TASKS.md` | ✅ done |
| T088 | Verify `UX042` deterministic artifact smoke outputs become Library artifacts | ✅ done |
| T089 | Complete `UX050`-`UX052` department workspace routing and shared department summaries | ✅ done |
| T090 | Complete `UX060`-`UX063` Tech Tree roadmap surfaces with owner/dependency/evidence/next-action mapping | ✅ done |
| T091 | Complete `UX070`-`UX078` prompt critique and `UX080` warm-white visual pass | ✅ done |
| T092 | Verify desktop/tablet/mobile layouts for onboarding, Command Center, Library, and task review | ✅ done |

## Slice 0.9 — Mission Control Streamlining

| ID | Title | Status |
|---|---|---|
| T093 | Document Mission Control target and "streamline, not remove" rule | ✅ done |
| T094 | Rebuild `/dashboard` as Mission Control using existing Paperclip company/goals/issues/agents/documents | ☐ todo |
| T095 | Convert Operator tray into collapsible dock/drawer with pin-open behavior | ☐ todo |
| T096 | Add Objective, Constraints, Strategy Map, Decisions, Execution State, Outcomes, and Next Move panels | ☐ todo |
| T097 | Preserve access to departments, tasks, Library, Tech Tree, runtime/admin routes, and diagnostics | ☐ todo |
| T098 | Add tests proving streamlining did not remove core runtime/product capabilities | ☐ todo |
| T099 | Verify Mission Control desktop/tablet/mobile screenshots | ☐ todo |
