# Implementation Plan: Task Review Output Finalization

**Branch**: `002-founder-happy-path` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

## Summary

Backfill and continue the founder task-review slice so the review surface can trigger execution, publish missing output into Library, and guide the founder into artifact finalization using existing Paperclip primitives.

## Technical Context

**Language/Version**: TypeScript, React 19, Vite in `paperclip/ui`.

**Primary Dependencies**: Existing `IssueDetail` flows, `issuesApi.upsertDocument`, issue chat/run tab controls, TanStack Query cache invalidation.

**Storage**: Existing Paperclip issue documents and issue runtime state.

**Testing**: Focused `IssueDetail.test.tsx`, UI typecheck, `pnpm design:gate`, MVP route smoke, `git diff --check`.

**Target Platform**: Paperclip host at `127.0.0.1:3100`.

**Constraints**: Keep Paperclip engine unchanged; deliver flow-level UX improvements only.

## Constitution Check

- Source of Truth First: PASS. Continues from `BUILD-FROM-THIS` architecture docs and completed founder specs.
- Engine Before Surface Area: PASS. Uses current issue chat/run/document APIs.
- Local-First Runtime: PASS. No hosted dependency introduced.
- Skills Are Execution Context: PASS. Retains Operator/departments/Library founder language.
- Verification Is Part Of The Work: PASS. Tests, gates, and smoke required.

## Project Structure

```text
paperclip/
├── ui/src/components/issue-detail/TaskReviewSummary.tsx
├── ui/src/components/issue-detail/IssueDetailReviewHeader.tsx
├── ui/src/components/issue-detail/IssueDetailContent.tsx
├── ui/src/components/issue-detail/useIssueDetailIssueActions.ts
└── ui/src/pages/IssueDetail.test.tsx
```

## Complexity Tracking

None.
