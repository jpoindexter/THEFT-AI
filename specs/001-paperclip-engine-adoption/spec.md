# Feature Specification: Paperclip Engine Adoption

**Feature Branch**: `codex-current-design-migration`

**Created**: 2026-05-13

**Status**: Draft

**Input**: User description: "Use Paperclip as the engine blueprint instead of redoing engine work; keep THEFT AI as the company-building product layer and use the repo skills."

## User Scenarios & Testing

### User Story 1 - Run Tasks Through An Engine Boundary (Priority: P1)

A founder completes onboarding, receives a company workspace, and every task run goes through a Paperclip-style engine boundary with registered tools, attached skills, durable run state, and clear pause/done outcomes.

**Why this priority**: This replaces scattered task execution with the runtime shape needed for all later department work.

**Independent Test**: Create a new company, complete onboarding, run one generated task with the local harness, and verify the run uses the central engine dispatcher, writes turns, and finishes or pauses explicitly.

**Acceptance Scenarios**:

1. **Given** a company with a task assigned to a department agent, **When** the task is run, **Then** the engine resolves the agent, skills, tools, business context, and adapter before executing.
2. **Given** a task run emits a tool action, **When** the action is handled, **Then** the result is routed through a central tool dispatcher rather than duplicated route-specific logic.
3. **Given** a task cannot continue without a founder decision, **When** the agent asks a question, **Then** the task pauses with a resumable pending tool state.

---

### User Story 2 - Represent Companies As Agent Company Packages (Priority: P2)

An operator can inspect a THEFT AI company as a portable Agent Company package composed of company, team, agent, task, and skill documents compatible with Paperclip's company specification.

**Why this priority**: THEFT AI needs a durable bridge between onboarding, departments, repo skills, and Paperclip-compatible runtime semantics.

**Independent Test**: Export a completed company package and verify it contains a company document, all 8 department teams, all agents with skill references, current tasks, and links to local skill packets.

**Acceptance Scenarios**:

1. **Given** a company with departments, agents, tasks, artifacts, and skills, **When** the package is built, **Then** each runtime entity has a stable slug/path identity rather than only database ids.
2. **Given** an agent has attached skills, **When** the package is built, **Then** each skill resolves by shortname to a local `skills/<slug>/SKILL.md` packet when available.

---

### User Story 3 - Adopt Paperclip Adapters Incrementally (Priority: P3)

An engineer can port Paperclip adapter behavior into THEFT AI one adapter at a time without changing product routes or department UI.

**Why this priority**: The app must support Claude, Codex, Gemini, OpenCode, and offline/local modes without route-specific execution hacks.

**Independent Test**: Switch an organization runtime backend in AI settings and verify task execution still uses the same engine contract and returns the same run-state shape.

**Acceptance Scenarios**:

1. **Given** an organization selects Codex CLI, Claude CLI, Gemini CLI, OpenCode, or offline mode, **When** a task runs, **Then** the adapter returns a normalized action stream to the engine.
2. **Given** a new adapter is added later, **When** it is registered, **Then** no task route or department page needs custom adapter logic.

### Edge Cases

- If a referenced skill packet is missing, the engine must report the missing skill while still allowing the run to proceed with available context.
- If a tool is not registered, the engine must return a structured tool error and keep the run state inspectable.
- If a local adapter is not installed or fails, the engine must fall back to deterministic offline behavior for local-first happy paths.
- If an agent emits malformed actions, the engine must produce a clear blocked run turn rather than silently hanging.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose a central engine boundary for task execution, tool dispatch, skill resolution, and adapter selection.
- **FR-002**: System MUST route all server-side tool calls through a registered dispatcher with tool descriptors and handlers.
- **FR-003**: System MUST keep THEFT AI's onboarding, departments, roadmap, and local file-backed store as the product layer during adoption.
- **FR-004**: System MUST represent a company using Paperclip-compatible package concepts: company, teams/departments, agents, tasks, artifacts, and skills.
- **FR-005**: System MUST resolve attached skills from the repo `skills/` directory by stable shortname before task execution.
- **FR-006**: System MUST normalize adapter output into the existing turn stream: text, tool_call, tool_result, pause, tool_answer, and done.
- **FR-007**: System MUST support local-first execution without paid services or production database requirements.
- **FR-008**: System MUST provide smoke tests for onboarding-to-task-run and package construction.
- **FR-009**: System MUST not modify or run the `paperclip/` reference repo as part of normal THEFT AI execution.

### Key Entities

- **Engine Run**: A task execution attempt with organization, agent, adapter, tools, history, turns, pause state, and terminal status.
- **Engine Tool**: A named capability with an agent-facing schema and server-side handler.
- **Agent Company Package**: A markdown-native representation of a THEFT AI company following Paperclip company package semantics.
- **Skill Reference**: A stable shortname/path reference to a `SKILL.md` packet used by an agent.
- **Adapter**: A normalized runtime backend that converts model/CLI output into engine actions.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new company can be created, onboarded, and run at least one task through the engine boundary in under 60 seconds locally.
- **SC-002**: All tool executions in Anthropic and local harness paths pass through one dispatcher implementation.
- **SC-003**: Exporting a completed company package includes 8 departments, 8 agents, attached skill references, and current tasks.
- **SC-004**: Adding one new engine tool requires changing only the tool registration module and tests, not every run route.
- **SC-005**: Test suite and production build pass after the first adoption slice.

## Assumptions

- Paperclip remains a read-only architectural reference in this repo.
- The first adoption slice targets in-process local execution, not Paperclip's full database, plugin worker, or sandbox-provider stack.
- THEFT AI keeps its current file-backed JSON store for v0.
- Existing CLI adapters remain available through the current local harness while their behavior is progressively aligned with Paperclip adapters.
