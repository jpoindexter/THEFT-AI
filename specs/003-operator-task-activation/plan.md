# Implementation Plan: Operator Task Activation

**Branch**: `002-founder-happy-path` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

## Summary

Make the existing Mission Control Operator guide active: helper buttons populate concrete founder requests, creating a task writes a real Paperclip issue with route/output context, and success leaves a visible link to the created task.

## Technical Context

**Language/Version**: TypeScript, React 19, Vite in `paperclip/ui`.

**Primary Dependencies**: Paperclip `issuesApi`, TanStack Query, existing THEFT Mission Control components, router link helpers.

**Storage**: Existing Paperclip issue API only; no new storage.

**Testing**: Focused `Dashboard.test.tsx`, UI typecheck, design gate, route smoke with bundled Playwright Chromium, `git diff --check`.

**Target Platform**: Paperclip host at `127.0.0.1:3100`.

**Constraints**: Preserve Paperclip as engine, avoid Cofounder visual copying, keep route modules under the active file guardrail, and keep helper actions deterministic.

## Constitution Check

- Source of Truth First: PASS. Builds on `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md`, `PARITY-DELTA.md`, and the completed founder happy path.
- Engine Before Surface Area: PASS. Uses Paperclip issues rather than new state.
- Local-First Runtime: PASS. No paid service or remote dependency.
- Skills Are Execution Context: PASS. Uses THEFT Operator/departments/Library vocabulary.
- Verification Is Part Of The Work: PASS. Focused tests and route smoke planned.

## Project Structure

```text
paperclip/
├── ui/src/pages/Dashboard.tsx
├── ui/src/pages/dashboard/useMissionControlOperatorTask.ts
├── ui/src/components/theft/organisms/mission-control/OperatorDrawer.tsx
├── ui/src/components/theft/organisms/mission-control/operatorTaskDraft.ts
└── ui/src/pages/Dashboard.test.tsx
```

## Complexity Tracking

None.
