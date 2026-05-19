# Tasks: Task Review Output Finalization

**Input**: `specs/004-task-review-output-finalization/spec.md`

## Phase 1: Setup

- [x] T001 Confirm active branch and clean baseline intent
- [x] T002 Confirm Paperclip-engine-only scope for the next founder slice

## Phase 2: Backfilled Completed Work

- [x] T003 [US1] Add `Start execution` task-review shortcut into existing issue chat/run flow in `paperclip/ui/src/components/issue-detail/TaskReviewSummary.tsx` and related issue-detail wiring
- [x] T004 [US1] Add focused regression coverage for review-to-chat execution handoff in `paperclip/ui/src/pages/IssueDetail.test.tsx`
- [x] T005 [US2] Add direct `Publish to Library` action for missing output using `issuesApi.upsertDocument` in `paperclip/ui/src/components/issue-detail/useIssueDetailIssueActions.ts`
- [x] T006 [US2] Add focused regression coverage for direct publish action in `paperclip/ui/src/pages/IssueDetail.test.tsx`
- [x] T007 [US1] Preserve runtime label compatibility while adding `Ready to run` state in `paperclip/ui/src/components/issue-detail/TaskReviewSummary.tsx`
- [x] T008 [US1] Verify `IssueDetail` focused tests, typecheck, design gate, and route smoke

## Phase 3: Next Pending Slice

**Goal**: founder lands directly in artifact finalization after publish.

- [ ] T009 [US3] Focus artifact/docs workflow on newly created `output` draft after publish in `paperclip/ui/src/components/issue-detail/IssueDetailContent.tsx` and tab/state helpers
- [ ] T010 [US3] Add focused test coverage for publish-success artifact focus behavior in `paperclip/ui/src/pages/IssueDetail.test.tsx`
- [ ] T011 [US3] Run focused IssueDetail tests and active UI verification gates

## Final Phase: Process Integrity

- [x] T012 Update `.specify/feature.json` to point to `specs/004-task-review-output-finalization`
- [x] T013 Update `AGENTS.md` read-first pointers to this spec plan
- [x] T014 Commit this process backfill checkpoint
