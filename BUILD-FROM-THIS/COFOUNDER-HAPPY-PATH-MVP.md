# COFOUNDER HAPPY PATH MVP

> Created 2026-05-19 after live dogfooding showed the app has too much shell and not enough product contract. This document overrides any "done" checkbox that claims MVP readiness without a visible artifact loop.

## Decision

THEFT should use Paperclip as the engine and emulate the captured Cofounder-style founder flow as the product UI.

Paperclip owns the runtime primitives:

- companies
- agents
- issues/tasks
- comments
- runs
- documents
- work products
- Library data
- approvals/interactions

THEFT owns the founder experience:

- onboarding
- persistent Operator guidance
- company map
- first task creation
- artifact-first task review
- Library/company memory
- next move

Do not rebuild Paperclip. Do not expose Paperclip's engine primitives as the main product. The founder should feel like they are moving through a guided company-building flow, not operating an issue tracker.

## What We Are Copying

We are copying the behavior and flow quality from the captured Cofounder frames, not the brand.

The flow contract is:

1. Founder starts with an idea.
2. Product asks only the context needed to move.
3. Product builds a company workspace/map.
4. Founder gives the first concrete task.
5. Operator routes the task to the right department.
6. Department produces a visible artifact.
7. Founder reviews the artifact.
8. Founder approves or asks for revision.
9. Approved artifact lands in Library/company memory.
10. Operator suggests the next move.

If any step ends in only a status, comment, run log, or task card, the flow is broken.

## MVP Acceptance Test

The first MVP is one path:

```text
Founder input:
Create a sales landing page for my design subscription business.

Expected product output:
A visible landing-page artifact appears on the task review page and in Library.

Founder actions:
Open artifact.
Ask for revision.
Approve artifact.
See the next recommended move.
```

This is the product gate. Until this path works, do not spend more effort on broad refactors, file splitting, dashboards, admin polish, cost pages, runtime screens, or visual cleanup.

## Required Screens

### 1. Cofounder-Style Onboarding

Purpose: turn founder context into a company workspace.

Must include:

- company name
- company stage
- short clarification interview
- first company task
- company map preview
- Operator/departments preview
- launch action

Must not include:

- engine jargon
- billing/credits
- adapter configuration as a primary step
- generic Paperclip create-company UX

### 2. Mission Control

Purpose: default founder home after onboarding.

Must include:

- current objective
- company map/departments
- visible first task
- constraints/blockers
- latest outputs
- persistent Operator dock
- next recommended move

Must not feel like:

- an admin dashboard
- an issue tracker home
- an agent management page

### 3. Persistent Operator

Purpose: keep the founder guided across the flow.

Operator must be reachable on founder-facing screens:

- onboarding
- Mission Control
- task review
- Library
- Tech Tree/roadmap
- department workspace

The current behavior where Operator appears on Mission Control and disappears on task detail is not acceptable for the copied flow.

### 4. Artifact-First Task Review

Purpose: show what was produced before showing runtime diagnostics.

Must include:

- artifact preview or direct open action
- output title
- output type
- owning department
- revision button
- approve button
- "where did this land?" fallback only when output is missing
- runtime diagnostics collapsed below the review

Task status cannot be the product output. A completed task without an artifact is an incomplete product experience.

### 5. Library / Company Memory

Purpose: durable home for approved outputs.

Must include:

- the artifact produced by the happy path
- source task
- department
- last updated time
- open/edit affordance
- approved/pinned state

The Library should answer: "What did the company learn or produce?"

## Paperclip Mapping

| Founder Concept | Paperclip Primitive |
|---|---|
| Company | `companies` |
| Operator | root/CEO-style `agents` |
| Department | agent templates and department metadata |
| Task | `issues` |
| Task discussion | issue comments |
| Department execution | heartbeat runs / adapters |
| Output artifact | issue documents or work products |
| Library item | issue documents, attachments, work products |
| Founder decision | approvals/interactions or task review action |
| Next move | goal/project/issue recommendation |

## Product Rules

1. Every generated task must declare an expected output type.
2. A task should not read as complete in the founder UI unless it has a visible artifact or a clear "no artifact because..." explanation.
3. The review page must show the artifact before comments, logs, or runtime detail.
4. Operator actions must either create a task, create/update an artifact, or prefill a concrete founder question. Dead buttons are not allowed.
5. If a route is only useful for engine/admin work, hide it from the happy path.
6. Do not call the product "Cofounder" in active UI. Use Operator, company, departments, tasks, Library, and Mission Control.
7. Do not continue design-system or architecture cleanup unless it directly unlocks this path.

## Current Known Breaks

These are not side bugs. They are MVP blockers.

- A task can say "done" while showing no Library artifact.
- The task review screen can ask "where did output land?" instead of showing the output.
- Operator is not persistent across task review.
- The flow creates tasks and statuses more reliably than it creates artifacts.
- Review buttons have historically looked real before they were wired.
- Existing roadmap/tasks docs overstate completion because smoke checks did not verify founder-perceived output.

## First Implementation Slice

Do this next, in order:

1. Add an artifact requirement to the sales landing page task path.
2. Create or update a deterministic landing-page artifact for the happy path.
3. Show that artifact directly on task review.
4. Save the same artifact into Library.
5. Make revision update the artifact, not just add a comment.
6. Make approve mark the artifact/task as approved only after artifact exists.
7. Add a browser smoke that starts from the happy path and asserts the artifact is visible.

## Non-Goals Until The Happy Path Works

- More oversized-file splitting.
- More scanner cleanup.
- More dashboard sections.
- More runtime/admin pages.
- More generic agent management UI.
- More visual polish without artifact behavior.
- More "all departments" work before one department produces one visible artifact.

## Codex Work Prompt

Use this prompt for the next implementation pass:

```text
Make the COFOUNDER-HAPPY-PATH-MVP real.

Read BUILD-FROM-THIS/COFOUNDER-HAPPY-PATH-MVP.md first.

Goal:
When the founder asks for a sales landing page, THEFT/Paperclip must create a visible landing-page artifact, show it on the task review page, and save it in Library.

Constraints:
- Do not split files.
- Do not do broad refactors.
- Do not polish unrelated UI.
- Do not touch runtime/admin pages unless required for this exact path.
- Work only on the artifact-production/review loop.
- Add a focused test and browser smoke for this path.
- Commit and push when done.
```

## Done Definition

The MVP slice is done only when a fresh local user can:

1. create or open a company;
2. ask for a sales landing page;
3. watch the task route to a department;
4. open the produced artifact from the task review screen;
5. find the same artifact in Library;
6. ask for a revision;
7. approve the artifact;
8. see a next move from Operator.

Anything less is still infrastructure, not the product.
