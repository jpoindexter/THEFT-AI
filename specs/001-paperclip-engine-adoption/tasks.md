# Tasks: Paperclip-First Engine Adoption

**Input**: Design documents from `/specs/001-paperclip-engine-adoption/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include focused Vitest coverage for company package construction and dispatcher behavior.

## Phase 1: Completed Initial Boundary Slice

- [x] T001 Create Spec Kit feature docs in `specs/001-paperclip-engine-adoption/`
- [x] T002 Update `AGENTS.md` plan pointer to the Paperclip engine adoption plan
- [x] T003 Create central engine tool dispatcher in `app/src/lib/engine/tool-dispatcher.ts`
- [x] T004 Create Agent Company package builder in `app/src/lib/engine/company-package.ts`
- [x] T005 Add tests for dispatcher and package builder in `app/src/lib/db/store.test.ts`
- [x] T006 [US1] Replace inline Anthropic tool execution in `app/src/lib/agent/run.ts` with `executeEngineTool`
- [x] T007 [US1] Replace duplicated local harness tool execution in `app/src/lib/agent/run-cli.ts` with `executeEngineTool`
- [x] T008 [US1] Keep pause/resume semantics unchanged in `app/src/app/api/[org]/tasks/[task]/run/route.ts`
- [x] T009 [US2] Implement package construction from org, departments, agents, tasks, artifacts, and skills in `app/src/lib/engine/company-package.ts`
- [x] T010 [US2] Expose package diagnostics for missing skills in `app/src/lib/engine/company-package.ts`
- [x] T011 [US3] Document adapter normalization boundary in `specs/001-paperclip-engine-adoption/contracts/engine-tools.md`
- [x] T012 [US3] Add follow-up tasks for Codex, Claude, Gemini, and OpenCode adapter parity
- [x] T013 Run `pnpm -C app test`
- [x] T014 Run `pnpm -C app build`
- [x] T015 Run localhost onboarding and one-task smoke test

## Phase 2: Paperclip Baseline Verification

**Goal**: Treat Paperclip as the first-running engine.

**Independent Test**: Start Paperclip, create a company/goal/agent/issue through its API, observe heartbeat checkout, and complete the issue.

- [x] T016 [US1] Start Paperclip unchanged with `pnpm -C paperclip dev`
- [x] T017 [US1] Verify `GET /api/health` returns `status: ok`
- [x] T018 [US1] Create dogfood company, company goal, Operator agent, and assigned issue through Paperclip API
- [x] T019 [US1] Verify Paperclip heartbeat can claim assigned work before manual checkout
- [x] T020 [US1] Complete the dogfood issue through Paperclip issue PATCH lifecycle

## Phase 3: THEFT To Paperclip Integration

**Goal**: THEFT onboarding creates real Paperclip engine state.

**Independent Test**: Finish THEFT onboarding, then verify Paperclip contains the company, goal, Operator, department agents, and first issues.

- [x] T021 [US2] Add `app/src/lib/paperclip-engine/client.ts` for local Paperclip API calls and health checks
- [x] T022 [US2] Add config/env defaults for Paperclip base URL with `http://127.0.0.1:3100` local default
- [x] T023 [US2] Update onboarding completion to create or link a Paperclip company
- [x] T024 [US2] Seed a Paperclip company goal from the onboarding brief
- [x] T025 [US2] Seed Operator plus department agents in Paperclip using desired skill references from `skills/`
- [x] T026 [US2] Seed first issues from THEFT roadmap/starter task generation
- [x] T027 [US2] Mark `initial idea` and `pick company name` roadmap nodes complete after onboarding when the user already provided them

## Phase 4: Product Surface Migration

**Goal**: Post-onboarding pages read executable work from Paperclip instead of hanging on THEFT-only state.

- [ ] T028 [US2] Map department task lists to Paperclip issues by company and agent/department
- [ ] T029 [US2] Map task detail status, comments, and done/close actions to Paperclip issue lifecycle
- [ ] T030 [US2] Add manual complete/skip with note for setup phases like business structure, naming, and existing-business setup
- [ ] T031 [US2] Replace LLC-specific roadmap language with business-structure-neutral setup language
- [ ] T032 [US2] Remove or hide credits/billing UX from local-first routes until real metering exists
- [ ] T033 [US3] Route adapter selection UI to Paperclip adapter types/config where available

## Phase 5: Verification

- [x] T034 Run `pnpm -C app test`
- [x] T035 Run `pnpm -C app build`
- [x] T036 Run Paperclip API smoke: health, companies, agents, issues
- [x] T037 Run THEFT onboarding-to-Paperclip smoke
- [ ] T038 Run post-onboarding route happy paths for dashboard, department, task detail, roadmap, and settings

## Dependencies

- T003 blocks T006 and T007
- T004 blocks T009 and T010
- T005 should land with T003/T004
- T013-T015 run after implementation tasks

## MVP Scope

Complete T021 through T027 first. This makes onboarding produce Paperclip-backed executable company state and fixes the core "past onboarding nothing works" failure.

## Adapter Parity Follow-Up

- Prefer Paperclip's built-in `codex_local`, `claude_local`, `gemini_local`, and `opencode_local` adapter config over porting code into THEFT.
- Only fork/import adapter code if THEFT needs behavior Paperclip cannot expose by API or plugin.
- Add one THEFT integration test per backend selection that proves the selected adapter maps to a Paperclip agent.
