# Feature Specification: Task Review Output Finalization

**Feature Branch**: `002-founder-happy-path`

**Created**: 2026-05-19

**Status**: Draft

**Input**: "Backfill the next founder slices into a strict spec trail and continue from the task review path so execution and Library output feel real."

## User Scenarios & Testing

### User Story 1 - Founder Can Start Execution From Task Review (Priority: P1)

A founder opens task review and can immediately start execution from that screen without learning internal runtime tabs.

**Why this priority**: Founder momentum dies when task review is static. A direct execution action is needed on the review surface.

**Independent Test**: Open a task with missing output, click start execution, and confirm the issue switches into the existing chat/run surface with a seeded execution prompt.

**Acceptance Scenarios**:

1. **Given** a task is not blocked and has no active run, **When** the founder clicks start execution, **Then** the UI opens the existing issue chat/run flow with a concrete execution prompt.
2. **Given** a task already has an active run, **When** review loads, **Then** diagnostics indicate live execution and start execution is not the primary action.

### User Story 2 - Founder Can Publish Missing Output To Library (Priority: P1)

A founder reviewing a task with no output can directly create a Library output draft from the task review area.

**Why this priority**: Tasks marked done with no artifact feel fake. Founders need a direct bridge to durable output.

**Independent Test**: Open a task with no documents, click publish to Library, and confirm an issue document is created and review state updates.

**Acceptance Scenarios**:

1. **Given** a task has no output, **When** the founder clicks publish to Library, **Then** the app creates an issue document draft using existing Paperclip issue document APIs.
2. **Given** publish succeeds, **When** the review panel refreshes, **Then** the founder sees output/evidence state move toward a real artifact path.

### User Story 3 - Finalization UX (Priority: P2)

After creating a Library output draft, the founder lands directly in the artifact editing flow to finalize and approve.

**Why this priority**: Draft creation alone is better than nothing, but finalization still has one extra navigation step.

**Independent Test**: After publish succeeds, confirm the issue detail lands on the artifact/documents surface focused on the output draft.

**Acceptance Scenarios**:

1. **Given** a publish action creates an output draft, **When** success returns, **Then** task detail focuses the artifact/documents workflow for immediate editing.

### Edge Cases

- Route-based issue IDs (`PAP-1`) and canonical IDs (`issue-1`) must both produce correct document writes.
- Publish should fail cleanly with an actionable error when issue context is unavailable.
- Review labels should preserve existing semantics for active runs and attached runs.

## Requirements

- **FR-001**: Task review MUST offer a direct start execution action that routes through existing Paperclip issue chat/run mechanics.
- **FR-002**: Task review MUST offer a direct publish to Library action when output is missing.
- **FR-003**: Publish to Library MUST use existing Paperclip issue document APIs and MUST target canonical issue IDs.
- **FR-004**: Review labels for runtime status MUST remain backward compatible (`Live run active`, `Run attached`) while adding `Ready to run` where appropriate.
- **FR-005**: The flow MUST remain purely UI/orchestration over Paperclip engine with no new backend runtime path.

## Key Entities

- **Execution Shortcut Prompt**: Founder-facing text that seeds the existing task run conversation.
- **Output Draft Document**: The issue-scoped Library artifact created under key `output`.
- **Review Runtime Status**: Founder-level status labels derived from existing issue/live run state.

## Success Criteria

- **SC-001**: Founders can trigger execution from task review in one click.
- **SC-002**: Founders can create an output draft from task review in one click.
- **SC-003**: Focused IssueDetail tests and active route smoke remain green.

## Assumptions

- Existing Paperclip issue chat/run and issue document APIs remain the execution and artifact primitives.
- This slice does not alter server runtime orchestration behavior.
