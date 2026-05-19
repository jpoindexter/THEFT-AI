# Feature Specification: Operator Task Activation

**Feature Branch**: `002-founder-happy-path`

**Created**: 2026-05-19

**Status**: Draft

**Input**: "Execute the next slice after founder happy path: make the visible Operator guide turn founder intent into real Paperclip work instead of passive UI."

## User Scenarios & Testing

### User Story 1 - Turn Operator Guidance Into A Real Task (Priority: P1)

A founder opens the Operator guide from Mission Control, clarifies or accepts the recommended work, creates a real task, and can immediately open that task.

**Why this priority**: The product should not feel like a static dashboard. The first useful action must write to the Paperclip issue system and show where the work went.

**Independent Test**: Open Mission Control, open Operator, enter a founder request, create the task, and confirm a created-task confirmation and task link appear.

**Acceptance Scenarios**:

1. **Given** a founder is on Mission Control, **When** they open Operator and enter a request, **Then** the create action creates a Paperclip issue assigned to the selected department.
2. **Given** the task is created, **When** the mutation succeeds, **Then** the Operator guide shows the issue identifier or title and an action to open the task.
3. **Given** the founder wants help wording the work, **When** they click a helper action like compare or risk, **Then** the draft field is populated with a concrete Operator request rather than doing nothing.

### Edge Cases

- Empty drafts must not create a task.
- If no department is available, task creation should fail with clear language.
- A created task should invalidate Mission Control issue/activity data.
- Long founder requests must remain readable and must not overflow the Operator guide.

## Requirements

- **FR-001**: System MUST create real Paperclip issues from Mission Control Operator actions.
- **FR-002**: System MUST route created tasks to the selected department's lead agent when available.
- **FR-003**: System MUST include founder intent, selected department, Operator context, and expected Library output in the created issue description.
- **FR-004**: System MUST show a success state with a link to the created task after task creation.
- **FR-005**: System MUST make helper actions populate useful draft prompts instead of acting as inert buttons.
- **FR-006**: System MUST keep the active Mission Control UI under file-size and design guardrails.

## Key Entities

- **Operator Task Draft**: The founder's current ask plus helper-generated prompt content.
- **Created Operator Task**: The Paperclip issue created from the Operator guide.
- **Department Route**: The selected department and its lead agent used for task assignment.

## Success Criteria

- **SC-001**: A founder can create a task from Mission Control Operator in under 30 seconds.
- **SC-002**: After task creation, the founder can identify where the task went without leaving Mission Control.
- **SC-003**: Existing Mission Control tests and route smoke continue to pass.

## Assumptions

- This slice does not run the assigned agent automatically; it creates the concrete task that the existing Paperclip runtime can execute.
- This slice uses existing Paperclip issue APIs and does not add server storage.
- Helper actions are deterministic prompt builders, not model calls.
