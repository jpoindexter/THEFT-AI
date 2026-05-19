# Tasks: Founder Happy Path

**Input**: Design documents from `specs/002-founder-happy-path/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-flow.md`, `quickstart.md`

**Tests**: Focused tests are included where the story touches existing tested surfaces.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

**Purpose**: Confirm the current product flow context and preserve the committed baseline.

- [x] T001 Confirm current branch and clean baseline with `git status --short`
- [x] T002 [P] Review `BUILD-FROM-THIS/COFOUNDER-FRAME-FLOW.md` and `specs/002-founder-happy-path/contracts/ui-flow.md` before UI edits

---

## Phase 2: Foundational

**Purpose**: Define reusable founder-flow language and derived next-step model before changing Mission Control rendering.

- [x] T003 [P] Add Mission Control next-step copy/model helper in `paperclip/ui/src/components/theft/organisms/mission-control/missionControlNextStep.ts`
- [x] T004 [P] Add or extend focused Mission Control expectations in `paperclip/ui/src/pages/Dashboard.test.tsx`

**Checkpoint**: Mission Control guidance can be implemented without embedding all logic directly in `Dashboard.tsx`.

---

## Phase 3: User Story 1 - Guided First Mission Control (Priority: P1)

**Goal**: A founder opening Mission Control sees what happened, what Operator created, and what to do next.

**Independent Test**: Open a newly onboarded or starter company dashboard and verify the current objective, guided next step, and Operator/departments/Library workflow are visible.

### Tests for User Story 1

- [x] T005 [P] [US1] Update Dashboard focused test assertions in `paperclip/ui/src/pages/Dashboard.test.tsx` for guided next-step panel and Operator restore language

### Implementation for User Story 1

- [x] T006 [US1] Add guided next-step panel component in `paperclip/ui/src/components/theft/organisms/mission-control/GuidedNextStepPanel.tsx`
- [x] T007 [US1] Integrate guided next-step panel into `paperclip/ui/src/pages/Dashboard.tsx`
- [x] T008 [US1] Make collapsed Operator affordance obvious in `paperclip/ui/src/components/theft/organisms/mission-control/OperatorDock.tsx`
- [x] T009 [US1] Run focused Dashboard test and compact route smoke for Mission Control

**Checkpoint**: US1 should be demoable as the MVP slice.

---

## Phase 4: User Story 2 - Plan Artifact Activation (Priority: P2)

**Goal**: The accepted onboarding plan reads as a durable company artifact and explains why departments/tasks are active.

**Independent Test**: Complete onboarding through plan review and confirm Mission Control references the accepted plan and activated starter roadmap.

### Implementation for User Story 2

- [ ] T010 [P] [US2] Review onboarding plan section data in `paperclip/ui/src/components/onboarding/useOnboardingPlanSections.ts`
- [ ] T011 [US2] Surface accepted plan summary on Mission Control in `paperclip/ui/src/components/theft/organisms/mission-control/GuidedNextStepPanel.tsx`
- [ ] T012 [US2] Connect plan context from company onboarding description in `paperclip/ui/src/pages/Dashboard.tsx`

---

## Phase 5: User Story 3 - Artifact Review Loop (Priority: P3)

**Goal**: A founder can tell whether task output exists, where it is stored, and how to approve or request changes.

**Independent Test**: Open task detail with and without Library output and verify missing output vs approvable output states.

### Tests for User Story 3

- [ ] T013 [P] [US3] Extend IssueDetail focused tests in `paperclip/ui/src/pages/IssueDetail.test.tsx` for missing output language and Library artifact language

### Implementation for User Story 3

- [ ] T014 [US3] Refine missing-output and artifact-ready states in `paperclip/ui/src/components/issue-detail/TaskReviewSummary.tsx`
- [ ] T015 [US3] Ensure ask/revise actions focus Operator/chat with draft context through `paperclip/ui/src/components/issue-detail/IssueDetailContent.tsx`

---

## Final Phase: Polish & Verification

**Purpose**: Validate the finished MVP slice and capture the checkpoint.

- [x] T016 Run `pnpm -C paperclip --filter @paperclipai/ui typecheck`
- [x] T017 Run `pnpm design:gate`
- [x] T018 Run `git diff --check`
- [x] T019 Run `THEFT_CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --short --company-prefix THFT`
- [ ] T020 Commit the founder happy-path slice with spec artifacts and implementation

---

## Dependencies & Execution Order

- Phase 1 precedes all code work.
- Phase 2 precedes US1 implementation.
- US1 is the MVP and should be completed before US2 or US3.
- US2 can build on the US1 panel after US1 is validated.
- US3 is mostly independent and may be completed after US1 if task review remains a visible pain point.

## Parallel Opportunities

- T002, T003, and T004 touch separate files and can run in parallel.
- T005 and T006 can be prepared in parallel if the panel contract is agreed.
- T010 can be done while US1 verification runs.
- T013 can be done independently from Mission Control work.

## Implementation Strategy

1. Deliver US1 first: guided Mission Control next step and visible Operator affordance.
2. Validate US1 with focused Dashboard test and route smoke.
3. Add US2 only if the plan context is available without new storage.
4. Keep US3 refinements scoped to existing task review surfaces.
