# GPT IMAGE SCREEN PROMPTS - THEFT MISSION CONTROL

> Created 2026-05-15. Use these prompts to generate visual directions for THEFT screens before implementation. These are image prompts only, not code prompts.

## Instant Or Pro

Use **Pro** for the main screens.

Reason: THEFT screens need dense UI hierarchy, readable panels, correct information architecture, and consistent product language. Instant is fine for quick mood exploration, but it will usually blur structure, over-decorate, or simplify the interface into a generic dashboard.

Use this split:

- **Pro:** final screen concepts, Mission Control, onboarding, task review, Library, Tech Tree, department workspace.
- **Instant:** quick 2-3 rough alternates only when exploring layout mood.

If you only want to run each screen once, use **Pro**.

## Shared Direction

Paste this shared direction before every screen prompt unless the image tool lets you save style memory:

```text
Design a high-fidelity desktop software UI mockup for THEFT AI, a local-first company operating system. THEFT is not a dashboard and not an agent admin console. It is Mission Control for building and operating a company.

Core mental model:
Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move.

Visual style:
dark premium operational interface, black/near-black canvas, slate panels, sharp rectangular panel edges, thin sand/ash borders, sand and ash text, acid-lime accent for selected/live/primary states, subtle purple/cyan signal accents, compact dense UI, no soft SaaS card pileup, no marketing hero layout, no purple AI gradient, no decorative blobs, no cartoon graphics.

Information architecture:
drive action, show hierarchy, surface constraints, guide decisions, tell context/state, scale complexity without chaos. Inspired by mission control UI, strategy execution platforms, executive cockpit UI, real-time strategy tech trees, OSINT relationship maps, build-order interfaces, Cofounder-style Canvas flow, and MagicPath-style prompt-to-canvas workflow. Do not copy any product branding.

Product objects:
Mission Control, Operator, company objective, departments, tasks, decisions, approvals, Library artifacts, Tech Tree, constraints, risks, outcomes, next move. Runtime/admin features exist but are secondary as System or Diagnostics, not the main focus.

Canvas rule:
The main surface should show the work and relationships. Operator/chat is persistent as a collapsible dock or side drawer, not always dominant. Screens should feel like a working product UI, not a poster.

Output:
single clean app screenshot, 16:9 desktop frame, no browser chrome, no phone unless explicitly requested, readable labels, realistic spacing, production-quality interface.
```

## Screen 01 - Local Entry

```text
Create THEFT AI local entry screen.

Purpose:
User opens the local app and starts or resumes a company.

Layout:
dark full-screen app shell, centered compact entry panel, minimal left product mark, local runtime status shown quietly, recent company list below the primary action.

Primary content:
- title: "Open Mission Control"
- subtitle: "Build and operate a company from your local runtime."
- primary button: "Open local company"
- secondary button: "Start new company"
- small status row: "Local runtime ready", "Embedded Postgres", "No cloud required"
- recent company row examples: "THEFT Studio", "Launch Lab", "Revenue Ops"

Do not show model setup, billing, pricing, generic auth SaaS layout, or Paperclip branding.
```

## Screen 02 - Onboarding Interview Canvas

```text
Create THEFT onboarding interview screen.

Purpose:
User answers setup questions while the company canvas begins forming.

Layout:
large pale/dark canvas area on the left with a single central company node and faint orbit rings. Right side has an Operator interview panel. The panel is structured like a concise mission brief, not a chatbot wall.

Operator panel:
- header: "Onboarding"
- company name: "THEFT Studio"
- Operator message asking a focused business question
- progress: "2 / 5"
- question card: "What is the primary business objective?"
- answer choices with short descriptions
- footer input: "Add context or ask for a different path..."
- action buttons: "Decide this one" and "Decide all"

Canvas:
- central node: company
- faint placeholder nodes labeled Brand, Product, Revenue, Operations, Library
- no dense dashboard cards yet

Mood:
Cofounder-style right interview panel plus Mission Control canvas. Calm, structured, directional.
```

## Screen 03 - Business Plan Review And Activation

```text
Create THEFT business plan review screen during onboarding.

Purpose:
User reviews the generated company plan before activating departments.

Layout:
left canvas shows the company node with early department nodes orbiting it. Right panel shows a structured "Business Plan" document with sections and an activation button.

Right panel:
- title: "Business Plan"
- small company label: "THEFT Studio"
- sections:
  - Objective
  - Customer
  - Constraints
  - Go-to-market
  - First outcomes
- each section appears as a dense, readable mini document card
- primary button: "Accept and activate departments"
- secondary text input: "I want to change the plan..."

Canvas:
- company node in center
- Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support as small orbit nodes
- subtle lines from objective to departments
- faint progress state that implies the workspace is being assembled

Do not make this look like an agent roster or setup wizard form.
```

## Screen 04 - Company Assembly Preview

```text
Create THEFT company assembly preview screen.

Purpose:
Before launch, the user sees what THEFT will create.

Layout:
Mission Control canvas with a left-side assembly list and a central hierarchy map.

Central map:
Objective at top -> strategic tracks -> 8 departments -> starter tasks -> expected Library artifacts.

Panels:
- "Operator" as top coordinator
- department lanes for Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support
- starter task chips under each lane
- Library artifact placeholders under each lane
- Tech Tree root node with 2-3 available next nodes

Right inspector:
- selected item: "Engineering"
- shows mission, starter task, default capabilities, expected output

Primary action:
"Launch company"

Secondary:
"Edit setup answers", "Advanced runtime"

Rule:
Make this feel like activating an operating company, not creating agents.
```

## Screen 05 - Mission Control Home, Operator Collapsed

```text
Create THEFT Mission Control home screen with Operator collapsed.

Purpose:
Default landing page after onboarding. It must answer "what should we do next, and why?"

Layout:
left compact navigation rail, top context bar, central strategy map/canvas, right intelligence panel, collapsed Operator dock in bottom-right or lower edge.

Primary panels:
- Objective: "Validate first paid UX subscription offer"
- Constraints: blocked decisions, customer risk, runway, missing proof
- Strategy Map: objective -> Tech Tree nodes -> department workstreams -> tasks -> artifacts
- Decisions: pending approvals and recommendations
- Execution State: department progress by outcome, not activity
- Outcomes: latest Library artifacts and evidence
- Next Move: highlighted recommendation with rationale

Navigation:
Mission Control, Tasks, Library, Tech Tree, Departments, System

Operator dock:
small compact input: "Ask Operator..."
icons for create task, explain, route, review

Visual:
dark mission-control canvas, thin grid/map lines, sharp panels, acid-lime next move highlight, no generic KPI dashboard.
```

## Screen 06 - Mission Control Home, Operator Expanded

```text
Create THEFT Mission Control home screen with Operator expanded.

Purpose:
Show how the collapsed Operator opens into a side drawer without replacing the canvas.

Layout:
same Mission Control canvas as Screen 05, but Operator drawer is open on the right or left as a resizable panel. Canvas remains visible and active.

Operator drawer:
- title: "Operator"
- context chip: "Mission Control"
- concise thread with:
  - user asks: "What should we do next?"
  - Operator response with recommended next move
  - rationale: constraints, evidence, tradeoffs
  - proposed task cards with departments and expected artifacts
- actions:
  - "Create recommended task"
  - "Compare options"
  - "Explain risk"
  - "Pin open"

Canvas reaction:
recommended path is highlighted in the strategy map.
Decision and constraint panels subtly link to the Operator recommendation.

Do not make this a full chat app. The canvas stays primary.
```

## Screen 07 - Strategy Map / Tech Tree

```text
Create THEFT Tech Tree / Strategy Map screen.

Purpose:
Show company build order, dependencies, evidence, and next unlocks.

Layout:
full-width dark map canvas with left filter/legend rail and right selected-node inspector.

Map:
staged tree with columns:
Idea -> Validation -> Build -> Go-to-market -> Launch -> Scale.
Nodes are connected with dependency lines. Some nodes are locked, available, in progress, complete.

Node examples:
- "Validate customer pain"
- "Define paid offer"
- "Build landing page"
- "Create sales script"
- "Ship first artifact"
- "Collect proof"

Right inspector:
selected node: "Define paid offer"
- why it matters
- prerequisites
- evidence required
- owner department
- linked tasks
- launch action: "Start this work"

Bottom strip:
recommended next move with rationale.

Do not make this a generic goals list. It should feel like a strategy game build order for a company.
```

## Screen 08 - Tasks / Needs Action

```text
Create THEFT Tasks screen focused on Needs Action.

Purpose:
User clears work waiting on founder decisions.

Layout:
left nav, central grouped task board, right summary/decision inspector.

Groups:
- Needs Action
- Ongoing
- Done
- Todo

Needs Action rows:
- ready to review output
- approval needed
- clarification question
- failed/stopped run
- blocked dependency

Each row shows:
task title, department, state, recommended action, linked artifact, updated time.

Right inspector:
selected task summary:
- objective
- why this needs attention
- recommended response
- buttons: "Approve", "Ask for revision", "Snooze", "Open task"

Do not make this look like Jira. It should feel like a founder review queue.
```

## Screen 09 - Task Review

```text
Create THEFT Task Review screen.

Purpose:
User reviews one task output and decides the next action.

Layout:
top task objective strip, central artifact/output preview, right decision panel, bottom collapsible runtime diagnostics.

Task header:
- title: "Create launch positioning brief"
- department: Marketing
- status: "Ready to review"
- owner: Marketing Agent

Main content:
- objective
- context
- generated Library artifact preview
- outcome summary
- comments/agent notes as concise thread

Decision panel:
- recommendation
- tradeoffs
- approve/revise/complete buttons
- "Ask Operator about this output"

Diagnostics:
collapsed section labeled "Runtime diagnostics"
contains run timeline, adapter, model, raw logs only when expanded.

Do not lead with chat logs. Lead with output, decision, and evidence.
```

## Screen 10 - Department Workspace

```text
Create THEFT Department Workspace screen for Marketing.

Purpose:
Show one department as a focused business lane, not an agent settings page.

Layout:
department mission header, left work lane, center task/outcome board, right department context/files/capabilities.

Header:
"Marketing"
mission: "Own positioning, launch content, campaigns, and demand generation."

Panels:
- Current objective
- Active work
- Blocked / needs review
- Latest outputs
- Related Library files
- Department context
- Capabilities / skills, secondary and compact

Work lane:
tasks grouped by Needs Action, Ongoing, Todo, Done.

Visual:
department color marker only as small accent, no full-color blocks. Keep Mission Control shell.

Do not make agent config, model settings, skills tabs, or invocation history the main content.
```

## Screen 11 - Library / Outcomes

```text
Create THEFT Library screen.

Purpose:
Shared company memory and durable output shelf.

Layout:
left department folder rail, center artifact grid/list, right artifact preview/inspector.

Left:
folders for Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support, Pinned, Recent.

Center:
artifact cards with type, department, source task, last updated, pinned state.
Examples:
- Business Plan
- Launch Positioning Brief
- Brand Direction
- Sales ICP
- Support FAQ
- Finance Snapshot

Right preview:
selected artifact with readable document preview, provenance, linked task, owner department, actions:
"Pin", "Edit", "Use as context", "Ask Operator"

Visual:
artifact-first, not file-manager clutter. Show outcomes/evidence clearly.
```

## Screen 12 - Selected Artifact Inspector

```text
Create THEFT selected artifact inspector state.

Purpose:
Show how clicking an artifact on Mission Control or Library opens contextual inspection.

Layout:
Mission Control canvas in background, selected artifact highlighted, right inspector open.

Inspector:
- artifact title: "Launch Positioning Brief"
- type: document
- department: Marketing
- source task
- evidence status
- summary
- preview snippet
- linked decisions
- next actions:
  - "Approve"
  - "Ask for revision"
  - "Use in next task"
  - "Open in Library"

Operator dock remains collapsed but context-aware:
"Ask Operator about Launch Positioning Brief..."

Do not navigate away from the canvas. This is an overlay/inspector pattern.
```

## Screen 13 - System / Diagnostics

```text
Create THEFT System / Diagnostics screen.

Purpose:
Advanced users can still access Paperclip runtime/admin capabilities without making them the default product.

Layout:
dark system page with clear warning that these are runtime controls. Not scary, just secondary.

Sections:
- Agents
- Projects / Workstreams
- Skills
- Models and adapters
- Routines
- Costs / usage
- Activity / logs
- Instance settings

Each section is a compact row/card with:
what it controls, status, last updated, open button.

Top note:
"Mission Control is the default workflow. System is for runtime configuration and diagnostics."

Visual:
same THEFT shell, but more technical. No raw dump, no clutter, no fake billing emphasis.
```

## Screen 14 - Mobile Mission Control

```text
Create mobile THEFT Mission Control screen.

Output:
single 9:16 mobile app screenshot, no desktop frame.

Purpose:
Show how Mission Control works on phone without losing hierarchy.

Layout:
top company/status bar, stacked priority cards, bottom navigation, floating Operator button/input.

Stack order:
1. Next Move card
2. Objective card
3. Constraints card
4. Decisions card
5. Execution state by department, compact horizontal lanes
6. Outcomes / latest Library artifacts

Bottom nav:
Mission, Tasks, Operator, Library, Tech Tree

Operator:
collapsed center action or floating compact input. Tapping expands to full-height drawer.

Do not copy generic mobile banking/dashboard UI. It should feel like compact mission control.
```

## Screen 15 - Mobile Operator Drawer

```text
Create mobile THEFT Operator drawer screen.

Output:
single 9:16 mobile app screenshot.

Purpose:
Show Operator expanded on mobile as a full-height drawer over Mission Control.

Layout:
Mission Control dimmed behind. Operator drawer occupies most of the screen with handle at top.

Drawer content:
- context: "Mission Control"
- user asks "What should we do next?"
- Operator recommends one next move
- evidence chips: constraint, decision, artifact, department
- proposed task card with department and expected output
- action buttons: "Create task", "Compare options", "Dismiss"
- input at bottom

Rule:
Chat is powerful but not the product. The drawer is temporary and context-aware.
```

## Screen 16 - Empty / Fresh Company Mission Control

```text
Create THEFT fresh company Mission Control screen with very little data.

Purpose:
Show the empty state after onboarding before work has started.

Layout:
same Mission Control shell, but canvas has a clean first objective and suggested first paths.

Content:
- Objective: "Choose the first company outcome"
- Constraints: "No customer proof yet", "No Library artifacts yet", "No active work"
- Options:
  - Validate customer pain
  - Create positioning brief
  - Build first landing page
  - Draft outreach list
- Next Move: "Start validation task"
- Operator dock: "Ask Operator to pick the best first move..."

Visual:
not empty, not blank dashboard. It should guide the user into action immediately.
```

## Screen 17 - Review Mode

```text
Create THEFT Review Mode screen.

Purpose:
User processes multiple decisions/outputs without hunting through tasks.

Layout:
Mission Control shell with review queue rail on left, selected review item in center, decision panel on right.

Queue:
items categorized by Approval, Clarification, Ready output, Failed run, Blocked dependency.

Center:
selected output preview with task context and artifact preview.

Right:
recommendation, tradeoffs, buttons:
"Approve", "Request revision", "Ask Operator", "Snooze", "Mark done"

Bottom:
progress through queue: "2 of 7 review items"

Do not make it a notification inbox. Make it a decision cockpit.
```

## Prompt Review Checklist

After GPT Image creates a screen, reject it if:

- it looks like a generic SaaS dashboard;
- it leads with agent cards, model config, costs, or logs;
- the first viewport does not answer "what should we do next?";
- it removes runtime/admin capability instead of streamlining access;
- Operator/chat takes over the whole product by default;
- departments look like decorative cards rather than execution lanes;
- Library artifacts are not visible as outcomes/evidence;
- Tech Tree is just a goals list instead of a build-order strategy map;
- it uses purple/blue AI gradients, decorative blobs, or marketing hero layout.

Accept it only if:

- Mission Control is clearly the product center;
- the Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move chain is visible;
- the UI feels dense, operational, and calm;
- the image gives enough structure to translate into implementation tasks in `paperclip/`.
