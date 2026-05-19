# Tasks: Operator Task Activation

**Input**: `specs/003-operator-task-activation/spec.md`

## Phase 1: Setup

- [x] T001 Confirm clean baseline with `git status --short`
- [x] T002 Review current Mission Control Operator drawer and Dashboard task mutation

## Phase 2: Foundational

- [x] T003 Add deterministic Operator draft helper copy in `paperclip/ui/src/components/theft/organisms/mission-control/operatorTaskDraft.ts`
- [x] T004 Move Mission Control task mutation/state into `paperclip/ui/src/pages/dashboard/useMissionControlOperatorTask.ts`

## Phase 3: User Story 1 - Turn Operator Guidance Into A Real Task

**Goal**: A founder can create a real Paperclip task from Operator and see where it went.

- [x] T005 [US1] Add focused Dashboard test coverage for helper draft population and task creation in `paperclip/ui/src/pages/Dashboard.test.tsx`
- [x] T006 [US1] Show created-task confirmation and task link in `paperclip/ui/src/components/theft/organisms/mission-control/OperatorDrawer.tsx`
- [x] T007 [US1] Wire helper actions, can-submit state, and created-task state through `paperclip/ui/src/pages/Dashboard.tsx`

## Final Phase: Verification

- [x] T008 Run focused Dashboard tests
- [x] T009 Run UI typecheck
- [x] T010 Run `pnpm design:gate`
- [x] T011 Run route smoke with bundled Chromium
- [x] T012 Run `git diff --check`
- [x] T013 Commit the slice
