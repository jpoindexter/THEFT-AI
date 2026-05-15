# UX DIRECTION - THEFT COMPANY OS

> Created 2026-05-14. This document ties together Paperclip, Cofounder, Hyperagent, THEFT skills, and the target happy path. Use it before designing or implementing screens.

## Core Decision

THEFT is not an agent admin dashboard.

THEFT is a local-first company operating system where a founder uses Mission Control, an Operator, departments, tasks, roadmap steps, approvals, and Library outputs to build and run a company.

Paperclip is the runtime. THEFT is the product experience.

The current interface target is `MISSION-CONTROL-UX.md`: streamline the interface without deleting Paperclip/runtime capability.

## Source Inputs

| Source | What It Contributes | Product Implication |
|---|---|---|
| Paperclip | Companies, agents, issues, goals, projects, runs, approvals, skills, tools, adapters, documents, attachments, local Postgres | Use it as the execution/control plane. Do not expose all of its internals as the primary UX. |
| Cofounder docs | Canvas, departments, Tech Tree, task review, Library, company memory, managed services, department agents | Use this as the product-flow reference: company workspace first, agent admin second. |
| Hyperagent screens | Polished agent admin, agent detail tabs, skills modal, invocation surfaces, Slack interaction, score/cost dashboards | Useful polish reference, but too close to generic agent-dashboard territory for THEFT's main surface. |
| MagicPath frames | Prompt-to-canvas flow, persistent thread, parallel generation, selectable artifacts, libraries, share/publish | Use this as the interaction loop: Operator command -> department plan -> artifacts appear on canvas/Library. |
| Local visual references | Light map/canvas layouts, dense SaaS panels, graph systems, premium white/cream workspaces | Use as visual direction for an operational company OS, not a decorative dashboard. |
| Strategy-interface reference image | Mission-control, strategy execution, hierarchy, constraints, decisions, execution state, next move | Use as the information architecture for Mission Control. The UI must drive action, show tradeoffs, and answer what to do next. |
| Sana | Bright enterprise AI tone, agents for real work, company-wide platform credibility | Use the restraint, clarity, and company-wide platform credibility. Do not copy marketing-page structure or light styling directly. |
| THEFT skills | Department-specific execution guidance and local skill packs | Skills are product data that make departments useful; surface them as department capabilities, not as a generic skills marketplace. |
| Existing THEFT prototype | Staged onboarding, 8 departments, roadmap/Tech Tree, Library concept | Port the product shape onto Paperclip data only. |

## Competitive Read

### Paperclip

Paperclip already has the real primitives:

- company model
- agent lifecycle
- org chart
- goals/projects/issues
- issue documents and work products
- heartbeat runs
- adapter registry
- approvals and interactions
- skills and desired skill sync
- local embedded Postgres

The risk is that Paperclip's native UX can feel like "configure an AI org/runtime" instead of "build a company."

### Cofounder

Cofounder's documented UX flow is stronger as a company-building product:

1. Onboarding creates a structured company workspace.
2. User lands on Canvas, not agent settings.
3. Canvas shows active work, departments, review queue, suggested next tasks, and Tech Tree progress.
4. Departments are business workspaces.
5. Tasks move through Needs Action, Ongoing, Done, and Todo.
6. Library is the shared file system and durable output shelf.
7. Agents, skills, tools, models, and schedules are secondary configuration.

THEFT should preserve this flow, but remove Cofounder branding/copy and avoid paid-service assumptions in local v0.

### Hyperagent

The Hyperagent screens show a polished version of the broader agent-dashboard pattern:

- left rail
- command center
- agent roster
- active operations
- score trends
- cost breakdown
- agent detail pages
- Config / Invocations / Tools / Skills / Knowledge
- Learn New Skill modal
- Slack thread interaction

This is useful as polish inspiration, but it is also a warning. If THEFT leads with these surfaces, it will look like another Paperclip/Hyperagent-style agent admin product.

### THEFT Differentiation

THEFT must lead with:

- objective and next move
- constraints, bottlenecks, risks, and tradeoffs
- company stage
- Operator
- departments
- active business work
- decisions/approvals
- roadmap/Tech Tree
- Library outputs
- local-first runtime confidence

Agent roster, model config, invocations, cost charts, tools, and skills are still needed, but they belong under Admin, Advanced, Diagnostics, or department capability drawers.

## Product Position

THEFT should feel like:

> "I am launching and operating a company with an AI Operator and specialized departments."

It should not feel like:

> "I am configuring a fleet of generic AI agents."

## Visual Product Direction

Use `BUILD-FROM-THIS/VISUAL-UX-REFERENCES.md` as the visual synthesis.

Primary direction:

- dark, premium, operational, and artifact-first
- Mission Control canvas as the primary surface
- Operator available persistently as a collapsed dock/drawer, not necessarily an always-open panel
- visible artifacts, tasks, departments, and decisions in the first viewport
- dense but calm panels with sharp borders and restrained depth
- lime/green accents used sparingly for selected, live, and primary action states
- graph/map/tech-tree visuals used to show hierarchy, constraints, and dependencies

Avoid:

- generic dashboard/KPI home screen
- Figma clone/tool chrome as the core identity
- Paperclip runtime/admin tabs as the primary product
- purple/blue AI gradients and decorative sci-fi styling

## Primary UX Objects

| Object | User Meaning | Paperclip Backing |
|---|---|---|
| Company | The business being built or operated | `companies` plus THEFT onboarding profile metadata |
| Operator | Top-level company agent that routes work and keeps the founder oriented | root/CEO Paperclip agent |
| Department | Business function with context, tasks, files, and agents | agents, projects, goals, issue filters, skill defaults |
| Task | Unit of business work | Paperclip issue |
| Run | Agent execution attempt | heartbeat run |
| Decision | Founder input required | approval, interaction, failed run, reviewable output |
| Roadmap / Tech Tree | Guided company-building path | goals, projects, issues, task evidence |
| Library | Durable company memory and output shelf | issue documents, attachments, work products |
| Skill | Reusable execution guidance | Paperclip company skill imported from `skills/*/SKILL.md` |

## Happy Path

### 1. Start

User opens THEFT locally and starts a new company.

What the user sees:

- "Name your company"
- company-stage choices
- no model setup
- no billing
- no raw Paperclip language

What the system does:

- prepares Paperclip company creation
- stores stage/setup answers in THEFT onboarding metadata

### 2. Stage And Setup

User selects a stage:

- pre-idea
- idea
- validating
- building
- launched
- revenue
- scaling
- existing business

User marks setup items:

- already done
- needs work
- skip for now

User adds notes about existing assets and current bottleneck.

What the system does:

- builds a company profile
- creates stage-aware roadmap goals
- prepares starter tasks

### 3. Company Assembly Preview

Before launch, user sees the company being assembled:

- Operator
- Engineering
- Design
- Marketing
- Sales
- Operations
- Finance
- Legal
- Support
- starter roadmap nodes
- starter department tasks
- default skill assignments

This is a key THEFT screen. It should feel like creating an operating company, not "creating agents."

### 4. Launch

User clicks Launch Company.

What Paperclip creates:

- company
- company goal
- Operator agent
- 8 department agents
- onboarding project
- initial Operator task
- starter issue per department
- skill assignments
- Library-output instructions in starter tasks

### 5. Mission Control

User lands on Mission Control / Canvas.

Must show:

- objective
- constraints, bottlenecks, risks, and tradeoffs
- strategy map from objective to departments/tasks/artifacts
- pending decisions and approvals
- execution state by department
- outcomes and Library evidence
- recommended next move
- company stage
- Tech Tree next steps
- collapsible Operator dock/drawer

Must not lead with:

- agent roster
- cost dashboard
- model config
- invocation logs
- skills/tools tabs

### 6. Route Work

User asks Operator:

> "What should we do next?"

Operator suggests or creates tasks and routes them to departments.

The user can also open a department directly and create work there.

### 7. Department Work

Department workspace shows:

- department mission
- owner agent
- active tasks
- blocked items
- review-ready outputs
- related Library files
- relevant skills/tools as secondary capability info

Department page should answer:

> "What does this business function own, and what is it doing now?"

### 8. Task Run And Review

User starts or reviews a task.

Task detail shows:

- objective
- context
- owner
- state
- run timeline
- output
- decisions required
- Library artifacts
- comments

Diagnostics show:

- raw logs
- model
- adapter
- invocation metadata

Diagnostics are collapsed by default.

### 9. Library Output

Agent output lands in Library.

User can:

- browse by department
- pin important files
- open artifacts
- edit markdown/text
- use a file as context
- ask Operator about an artifact

### 10. Continue Through Tech Tree

Tech Tree suggests next available work based on evidence:

- completed tasks
- approved outputs
- created Library artifacts
- connected integrations
- setup items

The loop becomes:

```text
Mission Control -> Operator/Department -> Task -> Run -> Review -> Library -> Tech Tree -> next move
```

## Screen System To Build

### Priority 1 - Core Product Flow

1. First-run onboarding
2. Company assembly preview
3. Mission Control / Canvas
4. Department workspace
5. Task detail/review
6. Library
7. Tech Tree

### Priority 2 - Supporting Product Surfaces

1. Attention queue review mode
2. Operator side panel
3. Create task flow
4. Create department/custom agent flow
5. Company memory/context
6. Stage/setup editor

### Priority 3 - Admin/Diagnostics

1. Agent admin
2. Model/adapter config
3. Tools
4. Skills
5. Invocations/runs
6. Cost/evals
7. Logs

Admin surfaces should exist, but they should not be the default happy path.

## Department UX Requirements

| Department | Mission | Starter Work | Default Skills |
|---|---|---|---|
| Operator | Orient the founder, route work, manage company-level decisions | clarify bottleneck, create next task, summarize company state | `company-naming`, `gic-skills`, `last30days-research`, `dev-workflow`, `ai-cost-routing` |
| Engineering | Build product, app, infrastructure, database, deploys | app flow, repo task, test notes, PR/preview | `dev-workflow`, `gic-coding-agent-skills`, `supabase`, `debugging-vercel-builds` |
| Design | Brand, visual systems, UI kits, decks, assets | brand kit, design direction, UI review | `web-design-guidelines`, `huashu-design`, `favicon-pack-maker`, `hyperframes` |
| Marketing | Positioning, launch, content, SEO, campaigns | campaign brief, positioning, content plan | `content-engine`, `last30days-research`, `company-naming`, `hyperframes` |
| Sales | ICP, outbound, customer research, pipeline | ICP, target accounts, outreach drafts | `last30days-research`, `content-engine`, `stripe-app-builder` |
| Operations | Process, reporting, recurring workflows, cleanup | operating cadence, handoff, status report | `ops-agent-skills`, `debugging-vercel-builds`, `supabase` |
| Finance | Billing ops, reporting, collections, financial planning | cash/reporting artifact, pricing or collections plan | `finance-agent-skills`, `stripe-app-builder`, `stripe-payment-debugging` |
| Legal | Contracts, policy, compliance, legal ops | policy checklist, contract review notes | `gic-skills` until dedicated legal skill exists |
| Support | Support replies, triage, knowledge base, customer success | support KB, triage workflow, reply template | `gic-skills`, `content-engine` |

## Anti-Clone Guardrails

Do not make THEFT's primary screens resemble:

- Paperclip generic dashboard
- Hyperagent command center with agent roster and score/cost first
- agent detail page with Config / Invocations / Tools / Skills / Knowledge as the central IA
- generic AI automation console

### Main Screen Must Not Lead With

- total runs
- average score
- total cost
- agent roster
- model picker
- tool list
- skill list
- invocation history

### Main Screen Must Lead With

- company stage
- current bottleneck
- Operator recommendation
- department work
- decisions needed
- roadmap progress
- outputs produced
- next action

## Interaction Rules

- Use natural language for business actions.
- Keep runtime details one click away.
- Every screen should show what changed, what is blocked, and what is next.
- Empty states should create useful work, not just explain missing data.
- Generated outputs should always point back to their task, agent, department, and Library artifact.
- If an LLM/run fails, show the business impact and next fix, with diagnostics collapsed.

## Visual Direction

THEFT should feel:

- calm
- operational
- precise
- local-first
- founder-focused
- company-building oriented

Avoid:

- oversized marketing hero layouts in-app
- decorative gradient-heavy admin pages
- generic purple AI SaaS palette
- card piles with no hierarchy
- tabs that expose runtime internals too early

## Open UX Questions

- How much of model/adapter setup should be shown during first run in local trusted mode?
- How should the collapsed Operator dock behave across desktop, tablet, and mobile?
- Should Tech Tree be a full page, a Mission Control module, or both?
- How should Library artifact provenance be displayed without cluttering the file view?
- How should cost/eval data be shown without turning the main UX into Hyperagent-style agent analytics?

## Implementation Order

1. Write screen prompts from `UX-SCREEN-PROMPTS.md`.
2. Generate first-pass designs for onboarding, Mission Control, department, task review, Library, and Tech Tree.
3. Run every generated screen through the anti-clone critique prompt.
4. Update this doc with accepted screen decisions.
5. Implement screens in `paperclip/` only.
6. Verify the happy path with Playwright:
   - onboarding
   - company assembly
   - Mission Control landing
   - department task
   - run/review
   - Library output
   - Tech Tree next step
