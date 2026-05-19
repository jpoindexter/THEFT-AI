# Implementation Plan: Founder Happy Path

**Branch**: `002-founder-happy-path` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-founder-happy-path/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build THEFT's founder-facing happy path on top of the existing Paperclip runtime: keep the current Mission Control shell, but make the post-onboarding state explain what Operator created, what happens next, where Library output will appear, and how the founder can ask/approve/revise. The first implementation should improve active Paperclip/THEFT UI surfaces rather than create a new app shell.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript with React 19 and Vite in `paperclip/ui`; Node runtime in `paperclip/server`.

**Primary Dependencies**: Paperclip shared models/APIs, TanStack Query, React Router, local THEFT UI atoms/molecules/templates, lucide-react icons.

**Storage**: Existing Paperclip embedded Postgres and API state; no new storage for this slice.

**Testing**: `pnpm -C paperclip --filter @paperclipai/ui typecheck`, focused Vitest where touched, `pnpm design:gate`, `git diff --check`, and THEFT route smoke.

**Target Platform**: Local browser app served by Paperclip host at `127.0.0.1:3100`.

**Project Type**: Web application UI over local runtime.

**Performance Goals**: Founder can identify the next action within 10 seconds; no horizontal overflow in compact desktop smoke.

**Constraints**: Keep Paperclip as engine; avoid runtime/adapter configuration in founder happy path; no visual copy of Cofounder; keep touched app modules under active design guardrails.

**Scale/Scope**: One focused MVP flow across onboarding outcome, Mission Control guidance, Operator affordance, and task artifact review.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Source of Truth First: PASS. This plan is derived from `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md`, `PARITY-DELTA.md`, and `COFOUNDER-FRAME-FLOW.md`.
- Engine Before Surface Area: PASS. Work improves active Paperclip/THEFT execution surfaces instead of decorative standalone screens.
- Local-First Runtime: PASS. No paid service or remote dependency is introduced.
- Skills Are Execution Context: PASS. Use `theft-ui-design`; keep Operator/departments/Library vocabulary intact.
- Verification Is Part Of The Work: PASS. Typecheck, design gate, focused tests, and route smoke are planned.

## Project Structure

### Documentation (this feature)

```text
specs/002-founder-happy-path/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
paperclip/
├── ui/src/pages/Dashboard.tsx
├── ui/src/components/theft/organisms/mission-control/
├── ui/src/components/onboarding/
├── ui/src/components/issue-detail/
├── ui/src/pages/Dashboard.test.tsx
└── ui/src/pages/IssueDetail.test.tsx
```

**Structure Decision**: Implement inside the active Paperclip UI host. Reuse existing Mission Control, onboarding, Operator dock, and issue-detail modules instead of adding a parallel app shell.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
