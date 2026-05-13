# Feature Specification: Paperclip Engine Adoption

**Feature Branch**: `codex-current-design-migration`

**Created**: 2026-05-13

**Status**: Pivoted to Paperclip-first

**Input**: User description: "Use Paperclip as the engine blueprint instead of redoing engine work; keep THEFT AI as the company-building product layer and use the repo skills."

**Pivot Update 2026-05-13**: Paperclip is the first-running baseline engine, not only an architectural reference. THEFT AI should boot Paperclip locally, prove the company/agent/issue heartbeat happy path, and then adapt THEFT onboarding, roadmap, skills, and UI surfaces around Paperclip primitives.

## User Scenarios & Testing

### User Story 1 - Run Paperclip As The Baseline Engine (Priority: P1)

A founder/operator can start Paperclip locally, create a company, attach goals and agents, create work, and see Paperclip heartbeats or board actions advance the work lifecycle.

**Why this priority**: THEFT should stop recreating orchestration that Paperclip already has: companies, agents, adapters, issues, checkouts, heartbeats, approvals, skills, and local workspaces.

**Independent Test**: Start Paperclip with embedded Postgres, hit `/api/health`, create a dogfood company, create a company goal, create an Operator agent, create an assigned issue, observe heartbeat checkout behavior, and mark the issue done.

**Acceptance Scenarios**:

1. **Given** Paperclip is installed in `paperclip/`, **When** `pnpm -C paperclip dev` starts, **Then** the UI and API are available at `http://127.0.0.1:3100`.
2. **Given** a Paperclip company with an active agent, **When** a todo issue is assigned, **Then** Paperclip may immediately claim it by heartbeat before a manual checkout.
3. **Given** a running Paperclip issue, **When** the board/operator marks it done with a valid run id, **Then** the issue records completion and a comment.

---

### User Story 2 - Make THEFT Onboarding Create Paperclip Companies (Priority: P2)

An operator completes THEFT onboarding and the app creates or links a real Paperclip company, goal, Operator/department agents, and first issues instead of only writing THEFT-local JSON state.

**Why this priority**: The app currently gets stuck after onboarding because the product surface and execution engine are split. Paperclip should be the source of truth for executable work.

**Independent Test**: Complete THEFT onboarding, then verify the Paperclip API contains the created company, company goal, Operator, department agents, and first tasks.

**Acceptance Scenarios**:

1. **Given** a founder already has a business, **When** onboarding asks about business structure or company naming, **Then** the founder can mark that step done and optionally name the existing structure rather than being forced through LLC/service-company assumptions.
2. **Given** THEFT creates starter work, **When** the work appears in departments, **Then** each visible task maps to a Paperclip issue and lifecycle status.
3. **Given** repo skills exist in `skills/`, **When** agents are created, **Then** their desired skills or instruction bundles reference those skill packets where applicable.

---

### User Story 3 - Use Paperclip Adapter Harnesses (Priority: P3)

An operator can select Claude, Codex, Gemini, OpenCode, or other local adapters through Paperclip-backed configuration instead of THEFT maintaining a separate harness per route.

**Why this priority**: Paperclip already models local CLI adapters and heartbeats. THEFT should configure and present that system, not rebuild it.

**Independent Test**: Create an agent with a safe local process adapter, then verify the same path can later use Paperclip's `claude_local`, `codex_local`, `gemini_local`, or `opencode_local` adapters without changing department task routes.

**Acceptance Scenarios**:

1. **Given** an organization selects Codex CLI, Claude CLI, Gemini CLI, OpenCode, or process mode, **When** a task runs, **Then** the work is represented as a Paperclip agent heartbeat/run.
2. **Given** a new adapter is added later, **When** Paperclip registers it, **Then** THEFT surfaces it without route-specific execution logic.

### Edge Cases

- If Paperclip is not running, THEFT must show an actionable local engine status instead of silently hanging.
- If a referenced skill packet is missing, THEFT must report the missing skill while still allowing the company to be created.
- If a local adapter is not installed or fails, Paperclip's adapter error must be surfaced in THEFT.
- If Paperclip heartbeats claim work before a manual action, THEFT must reflect the real issue status instead of treating it as stuck.

## Requirements

### Functional Requirements

- **FR-001**: System MUST treat local Paperclip as the first-running engine during adoption.
- **FR-002**: System MUST expose Paperclip engine health in local development and fail clearly when it is unavailable.
- **FR-003**: System MUST make THEFT onboarding create or link a Paperclip company, company goal, Operator agent, department agents, and starter issues.
- **FR-004**: System MUST map THEFT departments and tasks to Paperclip agents and issues.
- **FR-005**: System MUST resolve attached skills from the repo `skills/` directory by stable shortname when creating agents or instruction bundles.
- **FR-006**: System MUST support local-first execution without paid services, credits, or production database requirements.
- **FR-007**: System MUST let the operator manually complete/skips business setup phases that do not apply, with a note/name for the existing business structure when useful.
- **FR-008**: System MUST remove or hide credit/billing UX that implies unimplemented paid metering in the local-first build.
- **FR-009**: System MUST keep `paperclip/` source changes out of THEFT feature work until an explicit fork/import decision is made.

### Key Entities

- **Paperclip Company**: The source-of-truth executable company record used by the engine.
- **Paperclip Agent**: A runnable employee with adapter config, skills/instructions, hierarchy, status, and budgets disabled for local-first THEFT.
- **Paperclip Issue**: The source-of-truth task record with status, checkout, comments, documents, and hierarchy.
- **THEFT Onboarding State**: The product-specific setup flow that gathers founder intent and seeds Paperclip entities.
- **Skill Reference**: A stable shortname/path reference to a `SKILL.md` packet used by an agent.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Paperclip starts locally at `http://127.0.0.1:3100` and `/api/health` returns `ok`.
- **SC-002**: A dogfood company can be created in Paperclip with a company goal, Operator agent, assigned issue, heartbeat checkout, and done completion.
- **SC-003**: THEFT onboarding creates Paperclip-backed company data visible through `/api/companies`, `/api/companies/{id}/agents`, and `/api/companies/{id}/issues`.
- **SC-004**: Post-onboarding department task pages load from Paperclip issues instead of hanging on THEFT-only run state.
- **SC-005**: Local happy paths do not require credits, paid billing setup, or LLC-specific setup assumptions.

## Assumptions

- Paperclip remains unmodified while used as a local runtime service.
- The next adoption slice targets API integration with Paperclip's existing server on port 3100.
- THEFT can keep file-backed JSON temporarily as a product cache, but Paperclip becomes source of truth for executable work.
- CLI adapter configuration should move toward Paperclip's adapter model instead of expanding THEFT route-local harnesses.
