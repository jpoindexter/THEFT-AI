# MISSION CONTROL UX - THEFT

> Created 2026-05-15. This locks the next product direction from the latest strategy-interface reference image, Cofounder docs, MagicPath frames, and the current Paperclip-host reality.

## Core Decision

THEFT is not losing features. THEFT is streamlining the interface.

Paperclip runtime features stay available. The product experience should stop exposing them as the primary mental model.

The default interface should feel like:

```text
Mission Control for building and operating a company
```

Not:

```text
Dashboard of agent/admin objects
```

## Mental Model

Every primary THEFT surface should help the founder move through this chain:

```text
Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move
```

The first viewport must answer:

```text
What should we do next, and why?
```

## What Streamlining Means

Streamlining means:

- Product surfaces lead with company work, strategy, constraints, decisions, and artifacts.
- Runtime/admin features remain reachable through System, Diagnostics, command palette, direct routes, and contextual advanced panels.
- Agents, projects, skills, models, adapters, runs, costs, and logs remain in the system because Paperclip needs them.
- The happy path should not require the user to understand Paperclip internals.

Streamlining does not mean:

- deleting Paperclip runtime features;
- removing departments, agents, tasks, Library, Tech Tree, or approvals;
- hiding real capability from advanced users;
- creating a fake simplified app over a broken runtime.

## Interface Pattern

### Mission Control Home

`/dashboard` should become the Mission Control canvas.

It should show:

- current objective;
- why it matters;
- constraints, bottlenecks, risks, and tradeoffs;
- strategy map from objective to departments, tasks, dependencies, and artifacts;
- pending decisions and approvals;
- execution state by department;
- outcomes and Library evidence;
- recommended next move.

It should not lead with:

- generic KPI cards;
- agent roster;
- project list;
- model setup;
- raw run logs;
- cost dashboard;
- generic admin tabs.

### Operator

Operator remains persistent as capability, not necessarily as an always-open panel.

Default behavior:

- collapsed dock or compact input on Mission Control;
- opens into a side panel/drawer when the user asks, routes work, reviews recommendations, or explains a decision;
- context-aware on task, department, Library file, and Tech Tree node pages;
- can be pinned open by power users;
- never replaces the Mission Control canvas as the main product.

### Canvas

The central surface should behave like a company execution map.

It should show hierarchy:

```text
Company Objective
  -> Strategic Tracks / Tech Tree Nodes
    -> Department Workstreams
      -> Tasks
        -> Outputs / Library Artifacts
```

The user should be able to see dependencies, blocked paths, review-ready work, and the next recommended action without opening five separate admin pages.

## Reference Translation

### Cofounder

Use Cofounder for product flow:

- onboarding creates a structured company workspace;
- Canvas is the default landing page;
- departments are workspaces;
- Tasks group into Needs Action, Ongoing, Done, and Todo;
- Library is shared company memory;
- Tech Tree guides next steps through evidence.

Do not copy Cofounder branding or paid-service assumptions.

### MagicPath

Use MagicPath for interaction:

- prompt/thread is persistent but secondary to the canvas;
- a user goal becomes a visible plan;
- multiple work lanes produce artifacts in parallel;
- outputs become selectable, inspectable, reusable canvas objects;
- the artifact being created is the product focus, not the worker config.

### Strategy Interface Reference

Use the reference image for information architecture:

- drive action, not just report status;
- show hierarchy from strategy to execution;
- surface constraints and tradeoffs;
- guide decisions;
- tell the story/context/state;
- scale complexity without visual chaos.

Study patterns from:

- mission control UI;
- command center UI;
- strategy execution platforms;
- executive cockpits;
- real-time strategy/tech-tree UI;
- decision cockpits;
- OSINT/relationship maps;
- build-order interfaces.

## Primary Panels To Build

Mission Control should consolidate the current dashboard into these panels:

| Panel | Purpose | Paperclip Data |
|---|---|---|
| Objective | State the current company objective and desired outcome | company profile, top goal |
| Constraints | Make blockers, risks, bottlenecks, and tradeoffs impossible to miss | blocked issues, failed/stopped runs, pending approvals, missing setup |
| Strategy Map | Show hierarchy and dependencies from company objective to work | goals, projects, issues, departments, issue relations |
| Decisions | Queue founder choices and recommendations | approvals, interactions, reviewable outputs |
| Execution State | Show department progress by outcome, not activity vanity | agents, issues, runs, documents |
| Outcomes | Show shipped work and durable evidence | issue documents, attachments, work products |
| Next Move | Recommend the next action with rationale | bottleneck helper, Tech Tree evidence, attention queue |
| Operator Dock | Let the founder ask, route, explain, or revise | Operator agent, issue creation, comments/interactions |

## Navigation Rule

Primary navigation should be minimal:

- Mission Control
- Tasks / Needs Action
- Library
- Tech Tree
- Departments

Secondary navigation:

- Search
- System / Diagnostics
- Settings

Runtime/admin routes may remain:

- `/agents/*`
- `/projects/*`
- `/skills/*`
- `/routines/*`
- `/costs`
- `/activity`
- `/company/*`
- `/instance/*`

But they must not define the default product path.

## Acceptance Gates

Before accepting the next UI pass:

- The first viewport answers "what should we do next?"
- The user can understand objective, constraint, decision, execution, and outcome without opening admin pages.
- Operator is always available but not always visually dominant.
- Departments read as work lanes, not agent cards.
- Tasks read as company work, not issue tracker rows.
- Library artifacts are visible as outcomes/evidence.
- Tech Tree reads as strategy/build order, not a generic goals list.
- Runtime/admin features still exist and are reachable.
- No feature is removed solely to simplify the interface.

## Implementation Order

1. Update docs and tests so "streamline, not remove" is explicit.
2. Rebuild `/dashboard` into Mission Control using existing Paperclip data.
3. Convert Operator tray into a collapsible Operator dock/drawer.
4. Add Objective, Constraints, Decisions, Execution State, Outcomes, and Next Move panels.
5. Replace department grid emphasis with a strategy/dependency map plus department execution lanes.
6. Keep current department, task, Library, Tech Tree, and runtime routes functional.
7. Verify desktop/tablet/mobile with screenshots before calling the pass done.
