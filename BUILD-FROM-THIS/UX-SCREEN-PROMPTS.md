# UX SCREEN PROMPTS - THEFT COMPANY OS

> Use these prompts with a strong design/modeling model to generate flows, screens, and critique. These prompts are for design artifacts only. Do not implement from generated screens until they pass the anti-clone critique.

## How To Use

1. Start with Prompt 1 to load the product direction.
2. Generate one screen or flow at a time.
3. Run Prompt 9 against each result.
4. Keep only screens that clearly feel like THEFT, not Paperclip/Cofounder/Hyperagent.
5. Translate accepted screens into implementation tasks for `paperclip/`.

Recommended model split:

- Build/review/planning prompts: `gpt-5.5`
- Runtime smoke prompts/runs: `gpt-5.3-codex-spark` or `gpt-5.3-codex`

## Prompt 1 - Master Product Context

```text
You are designing THEFT AI, a local-first company operating system built on top of the Paperclip runtime.

Important distinction:
Paperclip provides runtime primitives: companies, agents, issues, goals, projects, runs, approvals, tools, skills, documents, attachments, work products, local adapters, and local embedded Postgres.
THEFT is the product experience: an Operator-led company-building OS with departments, roadmap/Tech Tree, tasks, review queue, and Library outputs.

Do not design a generic agent admin dashboard.
Avoid leading with agent roster, cost charts, model config, invocations, tool lists, or skills tabs.
Those are admin/diagnostic surfaces only.

THEFT must lead with:
- company stage
- Operator
- departments
- active business work
- current bottleneck
- decisions/approvals
- roadmap / Tech Tree
- Library outputs
- next action

Primary objects:
- Company
- Operator
- Departments
- Tasks
- Runs
- Decisions
- Roadmap / Tech Tree
- Library
- Skills

Core happy path:
1. User creates a company.
2. User picks company stage.
3. User marks what already exists, what is skipped, and what needs work.
4. THEFT assembles Operator plus 8 departments.
5. User launches into Command Center.
6. Operator routes work to departments.
7. Department agents run tasks.
8. User reviews decisions and outputs.
9. Outputs land in Library.
10. Tech Tree suggests next work.

Visual style:
- quiet operational SaaS
- dense but readable
- restrained color
- company-building language
- no generic AI dashboard hero
- no decorative card overload
- every screen should answer: "What should the company do next?"

Now create screen concepts and detailed UI layouts for THEFT.
```

## Prompt 2 - First-Run Onboarding

```text
Design the first-run onboarding flow for THEFT AI.

Goal:
The flow should feel like creating a company operating system, not configuring Paperclip agents.

Do not show model selection, adapter setup, billing, credits, or raw agent configuration unless the user opens Advanced.

Required company stages:
- pre-idea
- idea
- validating
- building
- launched
- revenue
- scaling
- existing business

Flow:
1. Name the company.
2. Pick company stage.
3. Ask what already exists for that stage.
4. Let user mark setup items as:
   - already done
   - skip for now
   - needs work
5. Ask for current bottleneck.
6. Generate a company structure preview:
   - Operator
   - Engineering
   - Design
   - Marketing
   - Sales
   - Operations
   - Finance
   - Legal
   - Support
7. Show starter roadmap / Tech Tree nodes.
8. Show starter department tasks.
9. Launch into Command Center.

Design requirements:
- The preview should make it visible that THEFT is assembling a company.
- Language should say Operator, departments, company stage, current bottleneck, next work.
- Avoid Paperclip/Cofounder copy.
- Avoid "create agent" framing.
- Make advanced runtime details secondary.

Produce:
- screen-by-screen layout
- main headings and copy
- primary actions
- empty/loading/error states
- what data each screen writes
- what should be hidden behind Advanced
```

## Prompt 3 - Company Assembly Preview

```text
Design the THEFT company assembly preview screen that appears before Launch Company.

This is the screen that differentiates THEFT from agent admin tools.

It should show that the user is creating a real operating company.

Required sections:
- company name and stage
- current bottleneck
- Operator card
- 8 department cards
- starter tasks by department
- starter roadmap / Tech Tree nodes
- default skill assignments summarized by department
- "Advanced runtime settings" collapsed

Department cards:
- Engineering
- Design
- Marketing
- Sales
- Operations
- Finance
- Legal
- Support

Each department card should show:
- mission
- starter task
- default owner agent
- key skill/capability labels
- expected first output

Primary action:
- Launch Company

Secondary actions:
- edit setup answers
- edit departments
- open Advanced runtime settings

Do not make this look like an agent roster table.
Make it feel like a company blueprint being activated.

Produce:
- desktop layout
- mobile layout
- exact labels/copy
- loading/progress state for launch
- error state if a department fails to seed
```

## Prompt 4 - Mission Control / Canvas

```text
Design THEFT's main Mission Control screen.

This is the default landing page after onboarding.

It should answer:
"What should we do next, and why?"

Use this mental model:
Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move

Primary sections:
- Objective and why it matters
- Constraints: bottlenecks, risks, blockers, tradeoffs
- Strategy map: objective to Tech Tree nodes, departments, tasks, dependencies, and artifacts
- Decisions: approvals, recommendations, pending choices
- Execution state by department
- Outcomes and Library evidence
- Recommended next move
- Collapsible Operator dock/drawer

Departments:
Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support.

Do not make this an agent roster dashboard.
Do not lead with cost, average score, total runs, or agent admin metrics.
Those can be small diagnostics elsewhere.
Do not remove access to runtime/admin features; streamline them behind System, Diagnostics, command palette, direct routes, or contextual advanced panels.

Operator dock should:
- accept a natural language instruction
- suggest next tasks
- route work to departments
- surface blockers
- summarize company state
- stay collapsed by default when the canvas needs priority
- expand into a side panel/drawer and support pin-open behavior

Department execution lanes should show:
- mission
- owner agent
- active task count
- blocked/review count
- latest output
- recommended next action

Decision/attention queue should show:
- approvals
- clarification questions
- failed/stopped runs
- ready-to-review outputs
- decisions waiting on founder

Produce:
- full desktop layout
- responsive mobile behavior
- component hierarchy
- exact labels/copy
- interaction states
- what opens when user clicks each region
```

## Prompt 5 - Department Workspace

```text
Design a THEFT Department Workspace screen.

Departments are business functions, not agent profiles.

Create a reusable layout for:
Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support.

Each department page should show:
- department mission
- department context/rules
- owner agent
- active tasks
- queued/todo tasks
- completed outputs
- blockers and review items
- related Library files
- relevant Tech Tree nodes
- relevant skills/tools, but secondary

Do not use tabs like Config / Invocations / Tools / Skills / Knowledge as the primary IA.
Those belong in Advanced Agent Admin.

The department should feel like:
"Here is what this business function owns and what it is doing now."

For each department, suggest:
- top 3 starter tasks
- common outputs
- useful Library artifact types
- common blockers
- key metrics only if real data exists

Produce:
- desktop layout
- empty state
- active-work state
- review-needed state
- completed-work state
- admin drawer for agent/tool config
```

## Prompt 6 - Task Detail / Review Flow

```text
Design THEFT's task detail and review flow.

Tasks are business work backed by Paperclip issues and heartbeat runs.

The screen should show:
- task objective
- department
- owner agent
- status
- original request
- context/files
- run timeline
- outputs
- decisions needed
- Library artifacts created
- comments/conversation
- approval or revision actions

Task states:
- Todo
- Waiting to start
- Running
- Needs Action
- Ready to Review
- Done
- Failed
- Blocked

The review flow should support:
- approve
- request changes
- ask follow-up
- mark complete
- reopen
- snooze
- dismiss if no action needed

Raw logs, adapter events, model details, and invocation metadata should be collapsed under Diagnostics.

Produce:
- task detail layout
- review mode layout
- state-specific UI
- action buttons
- timeline design
- Library artifact display
- diagnostics drawer
```

## Prompt 7 - Library

```text
Design THEFT Library.

The Library is the company memory and output shelf.
It is not just file storage.

Every generated output should land here by default.

Group files by department:
- Engineering
- Design
- Marketing
- Sales
- Operations
- Finance
- Legal
- Support
- Company / Operator

Artifact types:
- business plan
- launch plan
- ICP
- outreach sequence
- campaign brief
- design system
- brand kit
- product spec
- PR/test notes
- financial model
- legal checklist
- support knowledge base
- operating procedure
- reusable script

Library should support:
- department folders
- pinned files
- recent outputs
- search
- open file preview
- markdown/text edit
- artifact provenance: task, agent, department, date
- "use this as context" action
- "ask Operator about this" action

Design:
- first screen should show the highest-value company artifacts
- department folder browsing should be obvious
- generated outputs should feel durable and reusable

Produce:
- Library home layout
- department folder layout
- file preview layout
- edit state
- pinned files behavior
- empty states
```

## Prompt 8 - Tech Tree / Roadmap

```text
Design THEFT Tech Tree.

The Tech Tree is a guided company-building roadmap.
It should not feel like a generic project board.

Stages:
- pre-idea
- idea
- validating
- building
- launched
- revenue
- scaling
- existing business

Tracks:
- Product
- Engineering
- Brand
- Research
- Operations
- Revenue
- Support
- Finance
- Legal

Node states:
- locked
- available
- in progress
- completed
- needs review

Each node should show:
- why this matters
- department owner
- prerequisites
- output expected
- launch task action
- evidence that marks it complete
- what it unlocks

The Tech Tree should feed Command Center suggested next steps.

Produce:
- full layout
- node detail panel
- launch task modal
- completion evidence UI
- stage progress summary
```

## Prompt 9 - Anti-Clone Critique

```text
Review this proposed THEFT screen against the product direction.

THEFT should not look like Paperclip, Cofounder, or Hyperagent agent-admin UI.

Check whether the screen overemphasizes:
- agent roster
- model settings
- tool lists
- skills tabs
- invocation history
- cost metrics
- generic dashboard cards
- raw agent configuration

Check whether the screen clearly emphasizes:
- company stage
- Operator
- departments
- active work
- decisions
- roadmap / Tech Tree
- Library outputs
- what should happen next

Give a verdict:
- Keep
- Revise
- Reject

Then give concrete changes to make it more THEFT-specific.
```

## Prompt 10 - Implementation Translation

```text
Convert this accepted THEFT screen design into implementation tasks for the Paperclip-host codebase.

Constraints:
- Build only in `paperclip/`.
- Do not add new runtime state in the old `app/` prototype.
- Use Paperclip data primitives:
  - companies
  - agents
  - goals
  - projects
  - issues
  - heartbeat runs
  - approvals/interactions
  - issue documents
  - attachments
  - work products
  - company skills
- Hide runtime/admin details unless the screen is explicitly Advanced/Admin/Diagnostics.
- Preserve local-first behavior.

Output:
- file/module targets
- data queries required
- UI components needed
- mutations/actions needed
- empty/error/loading states
- Playwright or Vitest coverage
- acceptance criteria
```

## Prompt 11 - Department-Specific Screen Variant

```text
Create a department-specific variant of the THEFT Department Workspace for this department:

[DEPARTMENT NAME]

Department mission:
[MISSION]

Default skills:
[SKILL LIST]

Starter tasks:
[TASK LIST]

Common outputs:
[OUTPUT LIST]

Design the page so it feels like a business function with a working queue, not an agent profile.

Include:
- header
- mission/context
- active tasks
- blockers/review items
- latest Library outputs
- relevant Tech Tree nodes
- next suggested work
- collapsed Advanced admin drawer

Avoid:
- Config / Invocations / Tools / Skills / Knowledge tabs as primary navigation
- generic agent roster
- cost/score-first layout
```

## Prompt 12 - Founder Happy Path Storyboard

```text
Create a storyboard for the THEFT founder happy path.

Story:
A founder starts with a company idea, launches THEFT locally, creates a company, picks stage, marks existing setup items, launches the company, asks Operator what to do next, starts a department task, reviews the output, sees it saved in Library, and follows the next Tech Tree recommendation.

Produce:
- 10 to 14 storyboard frames
- frame title
- screen shown
- user action
- system response
- Paperclip runtime object created or updated
- UX success criteria

The storyboard must prove THEFT feels like a company OS, not an agent admin console.
```
