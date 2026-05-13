# PARITY / DELTA / GAPS

> Purpose: decide what to keep from Paperclip, what to port from THEFT/Cofounder, and what to remove.

## Executive Summary

Paperclip has the runtime. Cofounder has the product flow. THEFT has the design direction and expanded skill library.

The final app should use **Paperclip as the tracked runtime host** and port **THEFT/Cofounder-style flows** into it.

## Parity Matrix

| Capability | Cofounder Docs / Frames | Paperclip | Current THEFT `app/` | Target |
|---|---|---|---|---|
| Local entry / auth | Sign-in, onboarding, paid org notes | `local_trusted`, `authenticated` modes | Basic sign-in/dev login | Use Paperclip auth modes with THEFT entry UI |
| Name company | Required first step | Generic company create | `/onboarding` name step | THEFT name screen writes Paperclip company |
| Company stage | Frames/user requirement: pre-idea, idea, working, etc. | Missing | Missing/implicit | Add stage profile to company metadata/profile |
| Guided setup | Cofounder asks setup/onboarding questions | Generic create company/CEO | 4-question setup | Stage-aware THEFT setup writes Paperclip goals/issues |
| Existing business path | User can have things already done | Missing | Partially missing; roadmap can force steps | Add mark done / skip / "already have this" for setup nodes |
| Departments | 8 real company lanes | Agents/org chart, no product dept template by default | 8 departments seeded | Seed departments as Paperclip agents/projects/goals |
| Operator/Cofounder agent | Cofounder top-level side panel | CEO/agent hierarchy | Operator language emerging | Operator is Paperclip root agent / CEO role |
| Tasks | Needs Action/Ongoing/Done/Todo | Issues, checkout, comments, docs | JSON tasks | Paperclip issues only |
| Task runs | Agent task detail with output/review | Heartbeat runs and transcripts | local run harness | Paperclip heartbeats/adapters |
| Roadmap / Tech Tree | Stages, tracks, nodes, dependencies | Goals/projects/issues can represent it | Tech tree exists in JSON | Product roadmap layer over Paperclip goals/issues |
| Canvas | Main operating surface | Dashboard/org/issues pages | Department canvas prototype | THEFT canvas over Paperclip data |
| Library | Shared files, department association, editable docs/scripts | Attachments, issue docs, work products | Artifacts JSON | Library UI over Paperclip docs/assets/work products |
| Skills | Create/import/edit/attach skills | Company skills, desiredSkills, sync | `skills/` loads into prompts | Import `skills/` into Paperclip company skills |
| Adapters | Model/agent settings | Claude/Codex/Gemini/OpenCode/process/http | Custom local harness | Paperclip adapters only |
| Approvals | Review queue, approvals before external action | Approvals/interactions supported | Partial UI | Paperclip approvals with THEFT attention queue |
| Managed services | GitHub, Vercel, Supabase, Postmark | Projects/workspaces/env/secrets; not Cofounder managed stack | Mostly decorative | Local stubs v0, real integrations later |
| Domains/inbox/payments | Documented Cofounder settings | Some via plugins/secrets/custom work | Overbuilt/stubbed | Hide until implemented or route to real adapter/plugin |
| Credits/billing | Cofounder product has subscription/credits | Paperclip budgets/costs | Fake-ish local UX | Hide for local v0; keep internal cost logs only |

## Delta To Build On Paperclip

### Product Flow

- THEFT onboarding:
  - sign in/local entry;
  - name company;
  - choose company stage;
  - adaptive setup interview;
  - live company brief/dept preview;
  - mark done / skip / already have this;
  - seed first roadmap/tasks.
- THEFT canvas:
  - company overview;
  - department workspaces;
  - attention queue;
  - Operator tray;
  - tech tree / next steps.
- THEFT Library:
  - department folders;
  - pinned files;
  - generated artifacts;
  - editable markdown/text where safe;
  - reusable scripts later.

### Data/Product Model Additions

- `companyProfile` metadata:
  - stage;
  - business type;
  - existing assets;
  - setup skips/completions;
  - initial idea/brief.
- department template:
  - slug;
  - display name;
  - default agent;
  - default skills;
  - default starter issues.
- roadmap template:
  - stage;
  - node;
  - dependencies;
  - department owner;
  - maps to Paperclip goal/project/issue.
- skill import manifest:
  - local path;
  - skill id;
  - supported agents/departments;
  - read-only vs editable.

## What Paperclip Already Solves

- company CRUD and archive;
- agent lifecycle and org tree;
- adapter config and runtime invocation;
- heartbeat scheduling;
- issue lifecycle and atomic checkout;
- comments, issue documents, interactions;
- goals/projects/workspaces;
- approvals/governance;
- activity log;
- embedded local Postgres;
- company skills and skill sync primitives.

## Current Gaps Blocking One Product

1. **Repo host is not settled.** `paperclip/` is ignored, so it cannot be the tracked final app yet.
2. **Two data sources exist.** THEFT JSON and Paperclip Postgres both create companies/tasks.
3. **Skills are not imported into Paperclip.** THEFT slugs currently fail as Paperclip `desiredSkills` unless registered in the company skill library.
4. **Onboarding is not stage-aware.** Current flow does not ask or adapt to company stage.
5. **Post-onboarding THEFT pages read JSON.** They do not yet read Paperclip issues/agents/docs.
6. **Library parity is missing.** Paperclip has docs/assets/work products, but THEFT Library UX is not mapped.
7. **Managed service features are mostly future work.** Cofounder docs describe GitHub/Vercel/Supabase/Postmark, but local-first THEFT should stub or defer them.
8. **Credits/billing UX must be removed locally.** Paperclip budgets/costs are useful internally, but not a paid-credit product surface yet.
9. **Route surface must be pruned.** Current app has fewer pages than before but still contains stubs and legacy copy paths.
10. **End-to-end smoke matrix is missing.** Need stage onboarding + 8 department tasks + Library outputs + approval/review checks.

## Build Order

### Phase 0 — Repo Source Cleanup

- Choose host promotion path: tracked `paperclip/` subtree or Paperclip fork repo.
- Update `.gitignore`/repo layout accordingly.
- Mark `app/` as migration reference once host is promoted.
- Keep `BUILD-FROM-THIS/` and `skills/` as product data copied into the host.

### Phase 1 — Paperclip Host With THEFT Seed Data

- Import THEFT departments as Paperclip templates.
- Import THEFT skills into Paperclip company skills.
- Add Operator/root agent template.
- Add starter roadmap/issue templates.
- Disable/hide billing/credits in local mode.

### Phase 2 — THEFT Onboarding In Paperclip

- Replace Paperclip generic company create with THEFT staged onboarding.
- Persist company stage/profile metadata.
- Create company, goal, Operator, departments, agents, starter issues.
- Show live brief/dept preview.
- Support skip/mark-done/existing-business setup paths.

### Phase 3 — THEFT Canvas Over Paperclip Data

- Department workspaces read Paperclip agents/issues.
- Task detail reads Paperclip issue/comments/documents/runs.
- Review/attention queue reads approvals/interactions/reviewable work.
- Library reads Paperclip docs/assets/work products.

### Phase 4 — Runtime Smoke

- Run one task per department through Paperclip adapters.
- Confirm outputs become Library artifacts/work products.
- Confirm approvals pause/resume.
- Confirm status transitions are correct.

### Phase 5 — Archive The Bridge

- Remove or archive THEFT JSON runtime paths.
- Keep old app only as visual/reference archive.
- Keep one dev command for the final app.
