# Feature Specification: Founder Happy Path

**Feature Branch**: `002-founder-happy-path`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "Build the THEFT founder happy path on top of Paperclip: keep Paperclip as the engine, preserve the current Mission Control shell, but make the post-onboarding experience guide a founder from rough idea to plan artifact, visible next work, Library output, and approve/revise actions without copying Cofounder UI."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided First Mission Control (Priority: P1)

A founder finishes onboarding and lands in Mission Control with a clear explanation of what happened, what Operator created, and the next action to take.

**Why this priority**: This fixes the current moment where the founder feels dropped into an empty or confusing dashboard after entering an idea.

**Independent Test**: Create or open a newly onboarded company and confirm Mission Control shows a guided next-step panel, the current objective, and the next task without requiring the founder to understand Paperclip internals.

**Acceptance Scenarios**:

1. **Given** a company created through onboarding, **When** the founder opens Mission Control, **Then** the screen shows the current objective, the first recommended next action, and a plain-language explanation of the Operator workflow.
2. **Given** no department work has produced output yet, **When** the founder reviews Mission Control, **Then** the interface explains that departments will create work and Operator will save durable output into Library.
3. **Given** the founder wants help, **When** they use the Operator affordance, **Then** they can ask for explanation, routing, review, or task creation without hunting for the hidden bar.

---

### User Story 2 - Plan Artifact Activation (Priority: P2)

A founder can see the first business plan as a product artifact, accept it, and understand that accepting it activates departments and the starter roadmap.

**Why this priority**: The documented Cofounder flow works because the plan is a visible object. THEFT needs that clarity without copying the UI.

**Independent Test**: Complete onboarding through plan review and verify the resulting dashboard shows the accepted plan as company context and the starter roadmap as active next work.

**Acceptance Scenarios**:

1. **Given** the founder has entered a rough company idea, **When** Operator summarizes it into a plan, **Then** the plan is readable as a durable business artifact rather than a transient form field.
2. **Given** the founder accepts the plan, **When** Mission Control loads, **Then** departments and starter tasks are presented as activated from that plan.

---

### User Story 3 - Artifact Review Loop (Priority: P3)

A founder reviewing a task can tell whether work exists, where it is stored, and how to approve or request changes.

**Why this priority**: A task marked complete without a visible output makes the product feel fake.

**Independent Test**: Open a task with and without Library output and verify the review screen clearly distinguishes missing output from approvable output.

**Acceptance Scenarios**:

1. **Given** a task has no Library artifact, **When** the founder opens task review, **Then** approving is unavailable and the screen asks Operator to publish or explain the missing output.
2. **Given** a task has Library output, **When** the founder opens task review, **Then** the founder can open the artifact, approve it, or ask for revision.

### Edge Cases

- A company may have no active tasks yet; Mission Control must still show one useful next move.
- A task may be marked done by runtime state without a Library artifact; founder review must not present that as fully approved output.
- Operator controls may collapse on small screens; a visible restore/open affordance must remain available.
- Long company names, issue prefixes, and rough founder text must not overflow core workflow surfaces.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST keep Paperclip as the underlying company, task, comment, document, and agent engine.
- **FR-002**: System MUST preserve the current THEFT Mission Control shell and visual direction while improving the flow content.
- **FR-003**: System MUST show a guided post-onboarding next-step panel for companies with setup gaps, no output, or only starter tasks.
- **FR-004**: Users MUST be able to understand the path from idea to plan to department task to Library artifact from visible interface copy and actions.
- **FR-005**: Users MUST be able to open or restore the Operator affordance from Mission Control after it collapses.
- **FR-006**: System MUST present missing task output as a recoverable state, not as an approvable completed artifact.
- **FR-007**: Users MUST be able to ask Operator to publish missing output or revise output from the task review surface.
- **FR-008**: System MUST avoid introducing model, adapter, runtime, or integration configuration into the founder happy path unless required to complete the action.

### Key Entities *(include if feature involves data)*

- **Founder Company**: The active Paperclip company with onboarding context, setup state, issue prefix, departments, and tasks.
- **Business Plan Artifact**: The accepted company plan or summary that explains what the founder is building and why departments are activated.
- **Mission Control Next Step**: A visible recommendation that tells the founder what to do next and where it leads.
- **Library Output**: Durable work product attached to a task or company and suitable for founder review.
- **Operator Affordance**: The persistent ask/explain/route/review/task control available during the company workflow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A founder can complete onboarding and identify the next action on Mission Control within 10 seconds.
- **SC-002**: A founder can distinguish "no output yet" from "output ready to review" on a task detail screen without reading runtime diagnostics.
- **SC-003**: The guided Mission Control, task review, and Operator affordance render without horizontal overflow at compact desktop and mobile widths.
- **SC-004**: Existing route smoke coverage for Mission Control, Tasks, Library, and Department Workspace continues to pass.

## Assumptions

- The first implementation should improve the existing Paperclip/THEFT UI rather than build a separate app shell.
- The current onboarding and Mission Control routes remain the delivery surface for the MVP.
- Real LLM-generated plan quality is outside this slice; the feature focuses on product flow, state clarity, and next actions.
- Cofounder frame review is directional only. THEFT should borrow the flow, not copy visual layout or branding.
