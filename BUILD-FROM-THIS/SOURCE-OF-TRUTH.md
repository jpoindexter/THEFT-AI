# SOURCE OF TRUTH — THEFT x Paperclip Merge

> Canonical as of 2026-05-13. This file supersedes older wording that treated Paperclip as reference-only or THEFT's JSON app as the final host.

## Product Decision

THEFT AI will be **one product**, not two apps connected by a long-term bridge.

The target is:

```text
THEFT product/design/onboarding/skill library
            on top of
Paperclip company runtime/control plane
```

Paperclip is the starting chassis because it already has the hard runtime primitives: companies, agents, org chart, goals, issues, checkout, heartbeats, adapters, approvals, activity, local embedded Postgres, and skills. THEFT contributes the product layer: Cofounder-style onboarding, company stage flow, 8 real departments, better operator UX, roadmap/tech-tree guidance, local-first language, and the larger `skills/` library.

## Code Source Of Truth

### Final Host

The final host should be a **tracked Paperclip-based app** with THEFT product surfaces ported into it.

The current `app/` Next.js app is now a **migration reference and product prototype**, not the long-term runtime host.

### Current Repo Reality

- `paperclip/` currently runs and has the runtime we need.
- `paperclip/` is currently ignored by `.gitignore`, so changes inside it are not tracked by this repo.
- `app/` is tracked, but it duplicates Paperclip concepts and still uses a local JSON store.

This means the next cleanup step is not more bridge code. It is choosing and executing the host promotion path.

## Host Promotion Options

| Option | What It Means | Pros | Cons | Decision |
|---|---|---|---|---|
| Track `paperclip/` in this repo | Remove the ignore, add Paperclip as a tracked subtree/fork, then port THEFT UI into it | One repo, direct local work | Large import, possible history/vendor noise | Viable |
| Move THEFT work into a Paperclip fork repo | Treat Paperclip fork as the app repo; copy THEFT docs/skills/design into it | Cleanest runtime base | Splits current repo unless migrated carefully | Preferred if GitHub repo ownership is flexible |
| Keep bridge from `app/` to `paperclip/` | Current temporary path | Fast smoke testing | Violates "one app"; duplicates state forever | Not final |

**Recommended:** promote Paperclip into a tracked THEFT host, then archive/deprecate `app/` once parity is reached.

## Source Materials And Authority

| Source | Authority | Notes |
|---|---|---|
| `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md` | Highest | This merge architecture and repo cleanup direction |
| `BUILD-FROM-THIS/PARITY-DELTA.md` | Highest | What maps, what is missing, what to build/subtract |
| `cofounder-docs/` | Product behavior | Departments, tasks, library, managed services, settings, agent roles |
| `frames2/` | Flow/visual reference | Sign-in, name company, setup interview, brand kit, canvas, tech tree, task review |
| `paperclip/` | Runtime implementation | Control plane, adapters, skills, companies, goals, issues, heartbeats |
| `skills/` | Product data | THEFT's differentiating skill library; must be imported into Paperclip skill system |
| `app/` | Prototype/reference | Current THEFT visual and flow implementation; not final source once host is promoted |

## Product Shape

### Entry Flow

1. Sign in or local trusted entry.
2. Name company.
3. Pick company stage:
   - pre-idea
   - idea
   - validating
   - building
   - launched
   - revenue
   - scaling
   - existing business
4. Guided setup adapts to stage.
5. User can mark setup items done, skip, or name what already exists.
6. System creates Paperclip company, company goal, Operator, departments, agents, roadmap goals/issues, and skill assignments.
7. User lands in a working company canvas, not a blank dashboard.

### Company Runtime

- Paperclip `companies` are THEFT companies.
- Paperclip `agents` are THEFT department agents and Operator.
- Paperclip `goals/projects/issues` are THEFT roadmap, tasks, and department work.
- Paperclip `heartbeat_runs` are THEFT task runs.
- Paperclip `issue_documents`, attachments, and work products become the basis of THEFT Library.
- Paperclip skills are the runtime mechanism for THEFT `skills/`.

### Language

- User-facing THEFT language: **Operator**, **company**, **departments**, **agents**, **roadmap**, **Library**, **tasks**, **approvals**.
- Do not ship Cofounder branding/copy except in reference docs.
- Paperclip may remain internal/runtime language where it is not user-facing.

## What To Subtract

Remove or hide until real:

- fake credits
- fake billing/cost UX in local-first build
- generic Paperclip dashboard-first onboarding
- THEFT JSON task/agent/org store as runtime source
- duplicate route trees that are not wired to Paperclip
- LLC/service-company assumptions
- forced setup steps that block users who already have a business

## What Must Be Preserved

- 8 departments: Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support.
- Agentic company loop: setup -> roadmap -> department work -> review/approval -> artifacts -> next work.
- Local-first run with no paid services required.
- Claude/Codex/Gemini/OpenCode/local adapters via Paperclip.
- Skills as first-class execution context.

## Next Milestone

Create a tracked Paperclip-host migration branch and port the first THEFT product surface:

1. promote or fork Paperclip into tracked source;
2. add THEFT skill library import path;
3. replace Paperclip generic company creation with THEFT staged onboarding;
4. seed THEFT departments/agents/issues in Paperclip only;
5. render THEFT canvas over Paperclip company data;
6. archive the temporary bridge once parity is proven.
