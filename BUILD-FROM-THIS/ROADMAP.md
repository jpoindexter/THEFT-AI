# ROADMAP — Paperclip-Host Product Merge

> Sequential. Do not build new product surface until the previous source-of-truth step is complete.

## v0 — One Local Agentic Company App

Goal: THEFT runs as one local app backed by Paperclip's runtime. A founder can create a company, complete staged onboarding, see 8 departments, run real agent tasks, review outputs, and continue from roadmap/canvas without a second app or duplicated JSON runtime.

## Slice 0.0 — Source Of Truth Cleanup

- [x] Read `BUILD-FROM-THIS/`, `cofounder-docs/`, key `paperclip/` docs, and frame references.
- [x] Create `SOURCE-OF-TRUTH.md`.
- [x] Create `PARITY-DELTA.md`.
- [x] Append locked decisions.
- [x] Update repo guidance (`AGENTS.md`, constitution) to reflect Paperclip-host direction.
- [x] Decide host promotion path: tracked Paperclip subtree in this repo vs Paperclip fork repo.

## Slice 0.1 — Promote A Single Host

- [x] Stop treating the bridge as final architecture.
- [x] Create a tracked Paperclip-host branch or repo.
- [x] Bring `BUILD-FROM-THIS/` and `skills/` into the host. `paperclip/THEFT.md` and `paperclip/AGENTS.md` point to the canonical docs, and root `skills/` are imported as THEFT bundled company skills.
- [x] Add THEFT design tokens/branding to the host UI.
- [x] Mark current `app/` as migration reference once host exists.
- [x] Make one dev command for the host.

## Slice 0.2 — Skill Library Import

- [x] Add a local skill import path for `skills/*/SKILL.md`.
- [x] Register THEFT skills as Paperclip company skills.
- [x] Preserve read-only/custom skill distinction.
- [x] Map skills to default department agents.
- [x] Verify Paperclip agents can use imported skill selections without `desiredSkills` validation errors.

## Slice 0.3 — THEFT Staged Onboarding In Paperclip

- [x] Replace generic Paperclip company creation with THEFT entry flow.
- [x] Sign in/local entry. (Local trusted Paperclip entry is the v0 path.)
- [x] Name company.
- [x] Pick company stage: pre-idea, idea, validating, building, launched, revenue, scaling, existing business.
- [x] Guided setup adapts to stage. (Step 3 task/interview prompt now varies by selected company stage.)
- [x] Setup steps can be marked done, skipped, or named as existing. (Step 1 status + note controls persist into onboarding context.)
- [x] Create Paperclip company, company goal, Operator, 8 department agents, roadmap goals/issues, and first tasks.
- [x] Hide credits/billing in local onboarding.

## Slice 0.4 — THEFT Canvas On Paperclip Data

- [x] Company view reads Paperclip company/profile/goals/agents.
- [x] Department views read Paperclip agents and filtered issues.
- [x] Task list/detail reads Paperclip issues, comments, documents, runs, and interactions.
- [x] Attention queue reads approvals/interactions/reviewable work.
- [x] Operator tray creates Paperclip issues or comments, not JSON tasks.
- [x] Tech tree maps to Paperclip goals/projects/issues.
- [x] Command Center first viewport frames current bottleneck, departments, Operator tray, attention queue, Tech Tree, and latest Library outputs without leading with agent admin surfaces.
- [x] Task detail first viewport frames THEFT Task Review: owner department, run state, Library output, decisions, comments, and subtasks before runtime diagnostics.

## Slice 0.5 — Library And Outputs

- [x] Map Paperclip issue documents, attachments, and work products to THEFT Library.
- [x] Add department folders/association.
- [x] Add pinned files.
- [x] Add safe markdown/text editing.
- [x] Ensure agent output lands in Library by default.
- [x] Library primary page frames durable company memory/output, pinned work, department coverage, and latest output summary.

## Slice 0.6 — Eight Department Runtime Smoke

For each department, create one real Paperclip issue, invoke the assigned agent through a local adapter, and verify an output.

- [x] Engineering: code/repo task.
- [x] Design: brand/design artifact.
- [x] Marketing: positioning/content artifact.
- [x] Sales: ICP/outreach artifact.
- [x] Operations: status/process artifact.
- [x] Finance: finance/reporting artifact.
- [x] Legal: legal document artifact.
- [x] Support: support/knowledge artifact.

## Slice 0.7 — Subtract Dead Surface

- [x] Remove duplicated JSON runtime paths from active product.
- [x] Archive old THEFT app routes not ported to Paperclip host.
- [x] Remove/hide fake credits and unimplemented billing.
- [x] Remove LLC/service-company assumptions from active setup.
- [x] Remove active user-facing Cofounder branding.
- [x] Ensure only one app/server is required for the product path.

## Slice 0.8 — Mission Control Streamlining

Goal: streamline the interface around Mission Control without removing Paperclip runtime capability. The primary mental model is `Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move`.

- [x] Document Mission Control target and "streamline, not remove" rule.
- [x] Rebuild `/dashboard` as Mission Control / Canvas.
- [x] Make Operator persistent as a collapsible dock/drawer instead of an always-dominant panel.
- [x] Surface constraints, decisions, execution state, outcomes, and recommended next move in the first viewport.
- [x] Keep departments, tasks, Library, Tech Tree, runtime/admin routes, and diagnostics reachable.
- [ ] Verify desktop/tablet/mobile screenshots after the Mission Control pass.

## v1 — Managed Services After Local v0 Works

Only after v0 is dogfooded locally:

- GitHub repo/workspace management.
- Vercel preview/publish flow.
- Supabase project/import/local verification.
- Postmark/inbox.
- Stripe/payments.
- Domains/DNS.
- Custom integrations/MCP.

## v2 — Scale

- Multi-user/RBAC.
- Cloud deploy.
- Marketplace/templates.
- Advanced routines.
- Rich plugin surfaces.
