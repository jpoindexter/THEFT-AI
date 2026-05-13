# Tasks: Paperclip Engine Adoption

**Input**: Design documents from `/specs/001-paperclip-engine-adoption/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include focused Vitest coverage for company package construction and dispatcher behavior.

## Phase 1: Setup

- [x] T001 Create Spec Kit feature docs in `specs/001-paperclip-engine-adoption/`
- [x] T002 Update `AGENTS.md` plan pointer to the Paperclip engine adoption plan

## Phase 2: Foundational

- [x] T003 Create central engine tool dispatcher in `app/src/lib/engine/tool-dispatcher.ts`
- [x] T004 Create Agent Company package builder in `app/src/lib/engine/company-package.ts`
- [x] T005 Add tests for dispatcher and package builder in `app/src/lib/db/store.test.ts`

## Phase 3: User Story 1 - Run Tasks Through An Engine Boundary (Priority: P1)

**Goal**: Both Anthropic and local harness task execution use one tool dispatcher.

**Independent Test**: Run a local/offline task and verify tool actions produce turns through the dispatcher and the task can finish.

- [x] T006 [US1] Replace inline Anthropic tool execution in `app/src/lib/agent/run.ts` with `executeEngineTool`
- [x] T007 [US1] Replace duplicated local harness tool execution in `app/src/lib/agent/run-cli.ts` with `executeEngineTool`
- [x] T008 [US1] Keep pause/resume semantics unchanged in `app/src/app/api/[org]/tasks/[task]/run/route.ts`

## Phase 4: User Story 2 - Represent Companies As Agent Company Packages (Priority: P2)

**Goal**: THEFT companies can be represented with Paperclip-compatible package semantics.

**Independent Test**: Build a package for an onboarded company and verify 8 teams, 8 agents, starter tasks, and skill references.

- [x] T009 [US2] Implement package construction from org, departments, agents, tasks, artifacts, and skills in `app/src/lib/engine/company-package.ts`
- [x] T010 [US2] Expose package diagnostics for missing skills in `app/src/lib/engine/company-package.ts`

## Phase 5: User Story 3 - Adopt Paperclip Adapters Incrementally (Priority: P3)

**Goal**: Adapter internals can be swapped later without route changes.

**Independent Test**: Switch org backend and verify route-facing task run contract is unchanged.

- [x] T011 [US3] Document adapter normalization boundary in `specs/001-paperclip-engine-adoption/contracts/engine-tools.md`
- [x] T012 [US3] Add follow-up tasks for Codex, Claude, Gemini, and OpenCode adapter parity

## Final Phase: Verification

- [x] T013 Run `pnpm -C app test`
- [x] T014 Run `pnpm -C app build`
- [x] T015 Run localhost onboarding and one-task smoke test

## Dependencies

- T003 blocks T006 and T007
- T004 blocks T009 and T010
- T005 should land with T003/T004
- T013-T015 run after implementation tasks

## MVP Scope

Complete T003 through T010 first. This gives THEFT AI a Paperclip-style engine boundary without replacing every adapter at once.

## Adapter Parity Follow-Up

- Port Paperclip Codex local adapter semantics into a dedicated THEFT adapter module.
- Port Paperclip Claude local adapter semantics into the same adapter registry contract.
- Port Paperclip Gemini local adapter semantics, including installed-tool detection and model selection.
- Port Paperclip OpenCode local adapter semantics, keeping provider/model registry behavior intact.
- Add one adapter contract test per backend that proves normalized actions reach `executeEngineTool`.
