# STATUS — What actually exists

> Audit-derived, not assumed. Last updated 2026-05-14 by Codex session.
> Update when something changes status. Don't fabricate.

## Current Direction — Paperclip-Host Merge

Canonical direction now lives in `SOURCE-OF-TRUTH.md` and `PARITY-DELTA.md`.

THEFT should become one local app: Paperclip runtime/control plane as the tracked host, with THEFT design, staged onboarding, 8-department company setup, roadmap/canvas, Library, and local skills on top.

Current repo reality:

| Area | Status | Notes |
|---|---|---|
| `paperclip/` | **RUNS, TRACKED HOST** | Local runtime host promoted into parent git. Product changes should happen here. |
| `app/` | **MIGRATION REFERENCE** | Tracked THEFT prototype with design/onboarding/routes, but it duplicates Paperclip concepts and uses JSON state. Do not expand it as final runtime. |
| Paperclip bridge in `app/` | **TEMPORARY** | Commit `45c4550` proved onboarding can seed Paperclip company/agents/issues. It is not the final architecture. |
| `BUILD-FROM-THIS/` | **SOURCE OF TRUTH** | Read `SOURCE-OF-TRUTH.md`, then `PARITY-DELTA.md`, then roadmap/tasks. |
| `skills/` | **PRODUCT DATA** | Must be imported/registered into Paperclip company skills before agents can depend on THEFT skill slugs. |

Run status:

- 2026-05-14: `pnpm -C paperclip dev:once` starts the Paperclip host in `local_trusted` mode at `http://127.0.0.1:3100` with embedded PostgreSQL at `~/.paperclip/instances/default/db`.
- 2026-05-14: `curl http://127.0.0.1:3100/api/health` returned `status: ok`; `curl http://127.0.0.1:3100/` returned `root-ok` when run with the same elevated local-network context as the server.
- 2026-05-14: Finish sequence captured in `BUILD-FROM-THIS/FINISH-AND-RUN-PLAN.md`.
- 2026-05-14: Worker D added `paperclip/scripts/smoke/theft-local-health.mjs` for an already-running host smoke: health endpoint, root route, and companies API.
- 2026-05-14: Worker D added `paperclip/tests/e2e/theft-smoke-checklist.md` to make the current verification gap explicit until THEFT-specific Playwright coverage lands.
- 2026-05-14: Worker D verification run passed `git diff --check`, targeted onboarding utility Vitest, `pnpm -C paperclip build`, `curl /api/health`, `curl /`, and the new localhost smoke helper. The smoke helper needs localhost permission in sandboxed Codex runs.
- 2026-05-14: Follow-up implementation pass fixed the canvas onboarding-profile parser for the new JSON `[theft-onboarding]` block, changed onboarding launch to land on the company canvas, mapped the dashboard roadmap panel to Tech Tree language, and added default Library-output instructions to seeded Paperclip tasks.
- 2026-05-14: Follow-up verification passed focused Vitest (`onboarding-context`, `onboarding-launch`, `onboarding-route`, `onboarding-seed`, `theft-canvas`, `library-items`), `git diff --check`, `pnpm -C paperclip build`, and `node paperclip/scripts/smoke/theft-local-health.mjs`.
- 2026-05-14: Browser rendering check against the live host passed for `/onboarding` at desktop `1440x900` and mobile `390x844`, and `/library` loaded in headless Google Chrome.
- 2026-05-14: Fixed dedicated Playwright webServer boot by isolating the embedded Postgres port and patching `embedded-postgres` to repair the bundled `sql_features.txt` metadata plus capture `initdb` stderr. `pnpm -C paperclip exec playwright test tests/e2e/onboarding.spec.ts --config tests/e2e/playwright.config.ts` now passes the full THEFT onboarding flow against a throwaway embedded Postgres instance.
- 2026-05-14: Added and ran `paperclip/scripts/smoke/theft-department-runtime-smoke.mjs`; it seeded a throwaway company and completed adapter-backed wakeup runs for Engineering, Design, Marketing, Sales, Operations, Finance, Legal, and Support using the deterministic `process` adapter. Result company: `79bea8a1-1726-4f3b-9494-bfce8738163b`; all 8 runs reached `succeeded` with `adapter.invoke` events.
- 2026-05-14: Ran the 8-department smoke through `codex_local` with `THEFT_SMOKE_CODEX_MODEL=gpt-5.3-codex-spark`; all 8 departments succeeded. Result company: `afa239ed-1b8c-45da-8d2c-b4f4c6e05fbf`; issues `THEAAA-1` through `THEAAA-8`; run ids captured in terminal output.
- 2026-05-14: Created the UX source docs for the next product pass: `BUILD-FROM-THIS/UX-DIRECTION.md`, `BUILD-FROM-THIS/UX-SCREEN-PROMPTS.md`, and `BUILD-FROM-THIS/UX-BUILD-TASKS.md`. The xhigh synthesis gate is complete; next model lane is `gpt-5.5 high` starting at `UX010`.
- 2026-05-14: Completed `UX010`-`UX015` onboarding UX pass in `paperclip/`: Step 2 is now Company Assembly Preview, model/adapter controls are behind Advanced runtime, Codex local is the default runtime, the launch summary includes 8 departments, and onboarding e2e now covers mobile assembly preview. Also fixed concurrent Codex managed-home auth symlink setup exposed by department wakeups.
- 2026-05-14: Completed `UX020`-`UX023` Command Center UX pass in `paperclip/`: dashboard breadcrumb/nav now says Command Center, primary copy leads with THEFT company objects instead of Paperclip runtime language, the first viewport includes current bottleneck, departments, Operator tray, attention queue, Tech Tree, and latest Library outputs, and sidebar labels move agent/admin surfaces out of the main happy path.
- 2026-05-14: Completed `UX030`-`UX032` Task Review UX pass in `paperclip/`: issue detail now starts with a THEFT Task Review summary covering owner department, run timeline, Library output count, decisions, comments, and subtasks while keeping chat/activity/runtime diagnostics lower in the page.
- 2026-05-14: Completed `UX040`-`UX041` Library UX pass in `paperclip/`: Library copy now frames company memory and shipped output, shows shelf summary stats, uses task/department language in the detail pane, and the mapping helper now summarizes department coverage/important outputs.
- 2026-05-15: Cleaned up the UI build warning surface in `paperclip/`: route pages, onboarding, closed create dialogs, and the plugin bridge now load lazily enough that `pnpm -C paperclip build` finishes without Vite mixed-import, circular chunk, or chunk-size warnings.
- 2026-05-15: User-terminal smoke verification passed against the running Paperclip host. `node paperclip/scripts/smoke/theft-local-health.mjs` returned ok for `/api/health`, `/`, and `/api/companies`. Deterministic 8-department runtime smoke passed with `node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs --adapter process --no-require-library-artifacts`; result company `fe6fb8f2-d38b-4e44-a085-dc3ea60498f1`, all eight departments reached `succeeded` with zero Library artifacts as expected for the `process` adapter.
- 2026-05-15: Replaced the iteration-time live LLM artifact gate with a deterministic zero-quota artifact contract. `node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs --adapter process --require-library-artifacts` now writes a `work-products` issue document through the Paperclip API for every department and verifies Library visibility. Result company `dd5971cb-142b-4a3b-8117-682b18bff07d`; artifacts: Engineering `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-1` run `9bd6ff8f-9686-43e6-a52e-5335a7d10327` doc `work-products`, Design `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-2` run `80bf12dd-cdec-476b-bd81-9ee2a332403c` doc `work-products`, Marketing `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-4` run `c14ef095-f537-4c44-be5e-b8786bf9e590` doc `work-products`, Sales `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-6` run `ee92ee3b-e6f3-4623-9f42-6588a44a5568` doc `work-products`, Operations `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-8` run `fa51fe20-4739-4e55-91f0-2c8b8249da23` doc `work-products`, Finance `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-10` run `606fc198-0964-4826-bf67-ba0dec4a4c80` doc `work-products`, Legal `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-12` run `6fae46b9-d1ce-456a-99dd-07eedbba9627` doc `work-products`, Support `THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-14` run `3f4e92a9-0172-41a5-a748-46805da72ded` doc `work-products`.
- 2026-05-15: Completed `UX050`-`UX052` Department Workspace UX pass in `paperclip/`: dashboard department cards now route to THEFT department workspaces instead of agent detail, `/departments/:departmentKey` shows mission, active work, blocked items, review-ready tasks, recent outputs, related Library files, and secondary lead/skills info, and `buildDepartmentCanvasRows` now owns shared issue buckets and next-task selection for both Command Center and department pages.
- 2026-05-15: Added `BUILD-FROM-THIS/VISUAL-UX-REFERENCES.md` after reviewing MagicPath frames, `/Users/jasonpoindexter/Desktop/theft ai` references, and Sana's product page. This initially favored a warm-white enterprise creation workspace; it was later superseded by the cthdrl dark shell and the Mission Control streamlining direction.
- 2026-05-15: Completed `UX060`-`UX063` Tech Tree UX pass in `paperclip/`: `/goals` now presents Paperclip goals as a warm-white THEFT roadmap surface with owner, dependency, state, evidence, and next-action rows; `/goals/:goalId` now leads with selected-node context, evidence gate, linked projects, linked tasks, and child nodes while keeping the Paperclip properties panel secondary.
- 2026-05-15: Completed the first product-facing THEFT naming cleanup pass (`UX090`-`UX094`): onboarding, invite, account menu, Tech Tree copy, feedback sharing, command palette, and runtime usage surfaces no longer lead with Paperclip/Cofounder/cost-first language. Internal package imports, API paths, storage keys, and route slugs remain intentionally unchanged until the deeper runtime/package rename.
- 2026-05-15: Completed Phase 3 prompt critique and first visual polish pass (`UX070`-`UX078`, `UX080`): added `BUILD-FROM-THIS/UX-POLISH-DECISIONS.md`, then applied warm-white workspace styling, canvas-like department cards, Library artifact shelf treatment, and Task Review card polish in `paperclip/`.
- 2026-05-15: Completed `UX079` visual verification across onboarding, Command Center, Library, and Task Review at desktop `1440x900`, tablet `1024x768`, and mobile `390x844` with focused Playwright screenshots. Fixed observed mobile horizontal overflow from the mobile shell and corrected low-contrast warm-white panels in Command Center, Library, and Task Review under dark-theme runtime defaults.
- 2026-05-15: Slice 0.7 cleanup audit started. Active Paperclip onboarding no longer uses the `Acme Corp` placeholder or stores setup context as `Legal entity`; it now frames that setup item as legal/operating readiness and keeps it skippable. Added `app/src/app/api/[org]/MIGRATION-REFERENCE.md` to mark duplicated legacy JSON runtime routes as T070 archive candidates. Legacy `app/` still contains the old `incorporate-llc` tech-tree node and service/agency examples as migration reference only.
- 2026-05-15: Closed Slice 0.1 host cleanup. `paperclip/` carries THEFT host instructions, root skill import/default skill mappings are wired through the Paperclip company skill system, THEFT bundled skills are treated as read-only, and the UI has a centralized warm-white THEFT token shell in `paperclip/ui/src/index.css` plus the main layout wrapper.
- 2026-05-15: THEFT token-shell verification passed `pnpm -C paperclip --filter @paperclipai/ui typecheck`, focused Layout Vitest, `pnpm -C paperclip build`, and the UX079 Playwright visual suite across onboarding, Command Center, Library, and Task Review breakpoints.
- 2026-05-15: Reconciled Roadmap and UX smoke ledgers with completed verification. Slice 0.3 local entry, Slice 0.6 eight-department smoke, UX101 onboarding Playwright, and UX103 Codex local signoff are marked complete based on the recorded successful runs above.
- 2026-05-15: Unified the visible THEFT product shell against the cthdrl reference in `/Users/jasonpoindexter/Desktop/cthdrl`. The default app now uses a black/slate operating canvas, sand/ash text, lime selected/live accents, and restrained purple/cyan signals instead of the previous warm-white cards inside a dark runtime shell. The dogfood Command Center, department workspace, Library, Task Review, Tech Tree, invite, sidebar, account menu, and top bar now share the same dark token system.
- 2026-05-15: Started the confusion cleanup after live screenshot review. Primary sidebar and mobile nav now lead with THEFT surfaces only: Command Center, Attention, Departments, Task Review, Company Memory, Search, Tech Tree, and small System links. Project/agent runtime lists no longer appear as primary navigation. Tech Tree no longer uses a leftover light canvas, and Task Review defaults to Context instead of raw chat/execution logs.
- 2026-05-15: Started architecture closure before further design work. Added `BUILD-FROM-THIS/ARCHITECTURE-CLOSURE.md`, replaced the root README so `paperclip/` is the only active run path, hardened `app/README.md` as archived prototype guidance, and split Paperclip UI route roots into explicit THEFT product routes versus runtime/admin routes in `paperclip/ui/src/lib/company-routes.ts`.
- 2026-05-15: Continued architecture closure in the command palette. Product routes now lead as Command Center, Attention, Departments, Task Review, Company Memory, and Tech Tree; direct Projects/Agents/Costs/Activity shortcuts were removed from the primary Pages group, and remaining agent/project entries are explicitly labeled runtime diagnostics.
- 2026-05-15: Closed the root script mismatch. Root `package.json` is now named `theft-ai`; default `pnpm dev`, `pnpm dev:once`, `pnpm build`, `pnpm test`, `pnpm typecheck`, and smoke scripts route to the Paperclip host. Archived prototype commands remain available only under explicit `*:prototype` names.
- 2026-05-15: Removed the duplicated prototype dependency graph from the repo root. Root `package.json` now acts only as a THEFT orchestration manifest, while archived prototype dependencies remain isolated in `app/package.json` and Paperclip runtime dependencies remain isolated in `paperclip/`.
- 2026-05-15: Locked the next UX direction as Mission Control streamlining, not feature removal. Added `BUILD-FROM-THIS/MISSION-CONTROL-UX.md` to make the target explicit: Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move, with Paperclip runtime/admin features preserved behind System, Diagnostics, command palette, direct routes, and contextual advanced panels.
- 2026-05-15: Added `BUILD-FROM-THIS/GPT-IMAGE-SCREEN-PROMPTS.md` with 17 GPT Image prompts for the Mission Control screen set, Pro-vs-Instant guidance, shared visual direction, and acceptance/rejection criteria for turning generated screens into implementation tasks.
- 2026-05-15: Reviewed the generated renders in `/Users/jasonpoindexter/Desktop/theft ai_` and added `BUILD-FROM-THIS/GPT-IMAGE-RENDER-DECISIONS.md`. Structure references are Mission Control collapsed/expanded (`09_00_46 PM.png`, `09_00_51 PM.png`), Tech Tree (`09_00_55 PM.png`), Tasks (`09_01_00 PM.png`), Task Review (`09_01_04 PM.png`), Department Workspace (`09_01_09 PM.png`), Library (`09_01_14 PM.png`), System (`09_01_23 PM.png`), mobile Mission Control (`09_01_27 PM.png`), and Review Mode (`09_01_57 PM.png`).
- 2026-05-15: Updated visual direction after reviewing `/Users/jasonpoindexter/Desktop/099`. Added `BUILD-FROM-THIS/STYLE-TARGET-099.md` and downgraded the GPT Image renders from visual gold masters to structure references. Final style target is 099 digital workbench: black/white/gray, mono typography, 10px interactive radius, no neon lime, no purple/cyan department palette, no glow, no sci-fi HUD treatment.
- 2026-05-15: Added `BUILD-FROM-THIS/MVP-EXECUTION-PLAN.md` and completed the first Mission Control MVP implementation pass in `paperclip/`. `/dashboard` now leads with Objective, Strategy Map, Constraints, Decisions, Execution State, Outcomes, Next Move, and a collapsible Operator dock/drawer. Global THEFT UI tokens now follow the 099 black/white/gray workbench target instead of the prior lime/purple/cyan HUD skin. Lightweight verification passed `git diff --check`, focused Dashboard Vitest from `paperclip/ui`, and `pnpm -C paperclip --filter @paperclipai/ui typecheck`.
- 2026-05-15: Completed the M2 Task Review implementation pass in `paperclip/`. Issue detail now leads with Output & Evidence plus a Decision panel, keeps owner/review/runtime summaries secondary, and relabels raw chat/run history as Runtime diagnostics. Lightweight verification passed `git diff --check`, focused IssueDetail Vitest from `paperclip/ui`, and `pnpm -C paperclip --filter @paperclipai/ui typecheck`.

Next blocking work: continue MVP screen implementation in `paperclip/`, starting with M3 Tasks / Needs Action: founder review queue grouped by Needs Action, Ongoing, Todo, and Done. Avoid running full 8-department live Codex smoke during iteration; reserve it for pre-release/signoff.

Verification coverage:

- `paperclip/tests/e2e/onboarding.spec.ts` now covers the THEFT happy path: stage/setup persistence, Operator naming, 8 department agents, seeded department issues, hidden billing/credits, Library output instruction, and company-canvas landing.
- Use `node paperclip/scripts/smoke/theft-local-health.mjs` after `pnpm -C paperclip dev:once` for the fastest run-readiness check.
- Use `node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs --adapter process --require-library-artifacts` against a running local host for deterministic 8-department adapter plus Library artifact smoke. Full 8-department live Codex smoke is pre-release only.
- Build currently passes without Vite mixed-import, circular chunk, or chunk-size warnings.
- `UX020`-`UX023` verification passed focused Vitest (`theft-canvas`, `Dashboard`), `git diff --check`, and `pnpm -C paperclip build`.
- `UX030`-`UX032` verification passed focused Vitest (`IssueDetail`), `git diff --check`, and `pnpm -C paperclip build`.
- `UX040`-`UX041` verification passed focused Vitest (`library-items`), `git diff --check`, and `pnpm -C paperclip build`.
- 2026-05-15 warning cleanup verification passed `git diff --check`, focused Vitest (`App`, `Layout`), and `pnpm -C paperclip build`.
- `UX050`-`UX052` verification passed focused Vitest (`theft-canvas`, `Dashboard`), `git diff --check`, and `pnpm -C paperclip build`.
- 2026-05-15 UX079 verification passed `PAPERCLIP_E2E_PORT=3399 PAPERCLIP_E2E_DB_PORT=33399 pnpm -C paperclip exec playwright test tests/e2e/ux079-visual-verification.spec.ts --config tests/e2e/playwright.config.ts`; it captures onboarding, Command Center, Library, and Task Review across desktop `1440x900`, tablet `1024x768`, and mobile `390x844`.
- 2026-05-15 THEFT token-shell verification reran the same UX079 command after the global palette/layout wrapper change; first sandbox attempt hit `tsx` IPC `EPERM`, escalated rerun passed.
- 2026-05-15 one-server happy path verification passed `PAPERCLIP_E2E_PORT=3299 PAPERCLIP_E2E_DB_PORT=32399 pnpm -C paperclip exec playwright test tests/e2e/onboarding.spec.ts --config tests/e2e/playwright.config.ts`; the flow boots a throwaway Paperclip host, completes onboarding, seeds Operator plus departments/tasks, and lands on Command Center.
- `UX060`-`UX063` verification passed focused Vitest (`GoalDetail`), `git diff --check`, and `pnpm -C paperclip build`.
- 2026-05-15 cthdrl dark-shell verification passed `git diff --check`, `pnpm -C paperclip --filter @paperclipai/ui typecheck`, focused Vitest for Layout, Dashboard, IssueDetail, canvas, and Library helpers, `pnpm -C paperclip build`, plus a live Chromium screenshot check at `http://127.0.0.1:3100/THEAAAAAAAAAAA/dashboard` saved to `/private/tmp/theft-dashboard-cthdrl.png`.
- 2026-05-15 confusion-cleanup verification passed `git diff --check`, `pnpm -C paperclip --filter @paperclipai/ui typecheck`, focused Vitest for Sidebar and IssueDetail, and `pnpm -C paperclip build`.
- 2026-05-15 architecture-closure verification passed `git diff --check`, focused company route boundary coverage for product versus runtime/admin routes, focused Command Palette Vitest, `pnpm -C paperclip --filter @paperclipai/ui typecheck`, and `pnpm -C paperclip build`.

## Legacy THEFT App Engine (`app/src/lib/`)

This section describes what the tracked `app/` prototype currently contains. It is useful migration context, but `app/` is no longer the target runtime host.

| Component | LOC | Status | Notes |
|---|---|---|---|
| `agent/run.ts` | ? | **WORKS** | Anthropic SDK path uses shared engine tool dispatcher, tool loop ≤8 iter, pause/resume, usage logging |
| `agent/run-cli.ts` | ? | **WORKS** | Local/provider harness path verified with offline task run; uses shared engine tool dispatcher |
| `agent/tools.ts` | ? | **PARTIAL** | Tool schemas exist for onboarding, artifacts, library read/list, web search/fetch, and skill write. Still missing shell/file-write/email/PDF/image/CRM/db tools |
| `agent/anthropic.ts` | ? | **WORKS** | Local/provider generation supports Codex, Claude CLI, Gemini CLI, OpenCode, Ollama, LM Studio/OpenAI-compatible, Anthropic, offline fallback |
| `agent/compose-prompt.ts` | 105 | **WORKS** | Loads `../skills/<id>/SKILL.md` into system prompt |
| `db/store.ts` | 1069 | **WORKS** | File-backed JSON, swappable for Supabase |
| `engine/tool-dispatcher.ts` | ? | **WORKS** | Paperclip-style central dispatcher for server-side tools |
| `engine/company-package.ts` | ? | **WORKS** | Builds Agent Company package shape from org/departments/agents/tasks/artifacts/skills |
| `orgs/bootstrap.ts` | ? | **WORKS** | Seeds 8 departments and 8 default agents |

**Foundation verdict:** the tracked app creates a usable local company and routes task tools through one Paperclip-style dispatcher, but this is now a migration reference. The final foundation should be Paperclip's runtime, once it is promoted into tracked source.

## Routes inventory (153 page.tsx files)

### Onboarding — WORKS
- `/`, `/signin`, `/onboarding`, `/[org]/onboarding`, `/onboarding/done`
- Verified 2026-05-13: new company completes onboarding, creates 8 departments, 8 agents, 1 Business Plan artifact, 3 starter tasks, completes 2 roadmap nodes, unlocks 5 next nodes.

### 8 Departments — STRUCTURAL EXIST, BASIC ROUTES VERIFIED
- `/[org]/[department]/page.tsx` — catch-all dept page
- `/[org]/engineering`, `/design`, `/marketing`, `/sales`, `/operations`, `/finance`, `/legal`, `/support`
- Status: pages render for a generated org. Task execution has one local/offline smoke pass, but each department still needs its own canonical smoke task.

### Dept sub-pages — BUILT FROM PLAN.md (UNVERIFIED AGAINST DOCS)
Built last session without source-of-truth verification:
- `/sales/pipeline`, `/sales/leads`, `/sales/competitors`, `/sales/outreach`
- `/support/knowledge-base`, `/support/decision-trees`
- `/costs/unit-economics`, `/costs/budget`, `/costs/breakdown`
- `/analytics`, `/analytics/marketing`
- `/finance/close`, `/finance/collections`
- `/operations/handoff`, `/operations/reconciliation`
- `/legal/compliance`, `/legal/contracts`
- `/marketing/campaigns`, `/marketing/content`, `/marketing/social`
- `/design/logo`, `/design/components`, `/design/pitch-deck`

Status: render with seeded data. None are wired to engine. Likely most should move to `_archive/` until validated against cofounder-docs.

### Engine UI — PARTIAL
- `/[org]/agents` (list, detail, edit, runs) — pages exist, run streaming TBD
- `/[org]/tasks` (list, new, detail) — exists
- `/[org]/library` (list, artifact, upload) — exists
- `/[org]/approvals` — exists, wiring unknown
- `/[org]/routines` — scheduled tasks UI, no real cron yet
- `/[org]/skills` — list/new pages exist, doesn't sync to filesystem

### Legacy JSON API — ARCHIVED
- T070 archived duplicated prototype route files backed by `.theft-data/*.json` from `app/src/app/api/[org]/...` into `app/_archive/api-json-routes/[org]/...`.
- Archived route groups: `agent/run`, `operator`, `operator/messages`, `departments/[slug]/run`, `agents`, `skills`, `tasks`, `artifacts`, `memory`, `roadmap`, `approvals`, `routines`, `company`, `departments`, `team`, and `export`.
- Future/stub route groups to rebuild only against Paperclip or real managed services: `api-keys`, `brand-kit`, `brief`, `onboarding/complete`, `costs/export`, `invoices`, `deployments`, `evals`, `search`, and `webhooks`.

### Settings — OVERBUILT (16 sub-pages, most stubbed)
Routes exist for: organization, ai-settings, billing, billing/usage, payments, stripe, env, domains, domains/[domain], inbox, notifications, notifications/routing, security, sso, support, audit, advanced, advanced/agent-rules, advanced/import-repo, advanced/import-supabase, company-context, import, preferences

Per cofounder-docs only ~7 settings exist (org/company-context, AI, payments/stripe, domains, env, inbox, support). Drop the others to `_archive/`.

### Database — STUBBED UI
- `/database/{auth,logs,migrations,secrets,storage,suggestions,tables,users}` — UI scaffolding, **not wired to real Supabase**
- This is the cofounder "Database" artifact view — pure UI, decorative for v0

### Roadmap — WORKS
- `/roadmap` — horizontal panning dependency graph, just rebuilt from frames

### Misc shell — STATUS UNKNOWN
- `/dashboard`, `/feed`, `/timeline`, `/studio`, `/marketplace`, `/templates`, `/sandbox`, `/share`, `/preview`, `/publishing`, `/managed-services`, `/diagnostics`, `/insights`, `/calendar`, `/team`, `/notifications`, `/inbox`, `/release-notes`, `/whats-new`, `/help`, `/memory`, `/api-keys`, `/webhooks`, `/evals`, `/integrations`, `/integrations/mcp`, `/marketplace`, `/referrals`, `/review`, `/search`, `/brand-kit`, `/account/*`, `/admin/*`, `/dev`, `/status`

## Tools available to agents right now

```
ask_user_question         — pause, multiple-choice prompt to user
set_business_plan         — save org's business plan
delegate_to_department    — route a task to another dept agent
set_tech_tree_node_status — mark a roadmap node complete
write_artifact            — write markdown/json/code to Library
complete_onboarding       — signal onboarding done
read_file                 — read Library artifact by name
list_files                — list Library artifacts, optionally by department
web_search                — Tavily-backed search when env key exists
web_fetch                 — fetch and strip public URL text
write_skill               — save reusable local SKILL.md packet
```

**Missing for real dept work** (from paperclip + cofounder-docs):
- `run_command` — shell exec in sandbox (Engineer)
- `write_file_to_repo` — commit code to managed GitHub (Engineer)
- `send_email` — Postmark / outbound (Marketing, Sales, Support)
- `create_lead` / `update_lead` — CRM mutation (Sales)
- `query_db` — read managed Supabase (Engineer, Operations)
- `generate_image` — visual asset gen (Design, Marketing)
- `generate_pdf` — contracts, decks (Design, Legal)
- `run_command` — shell exec in sandbox (Engineer)
- `write_file_to_repo` — commit code to managed GitHub (Engineer)

## Skills wired to agents (from `bootstrap.ts`)

| Department | Skills attached | Engineer can do |
|---|---|---|
| Engineering | `dev-workflow`, `supabase`, `supabase-postgres-best-practices`, `debugging-vercel-builds` | Read SKILL.md, but no shell/file tools to act |
| Design | `web-design-guidelines`, `huashu-design`, `shader-authoring`, `favicon-pack-maker`, `hyperframes` | Read, write_artifact only |
| Marketing | `content-engine`, `last30days-research` | Read, write_artifact only |
| Sales | (none) | Read, write_artifact only |
| Operations | `ops-agent-skills` | Read, write_artifact only |
| Finance | `finance-agent-skills` | Read, write_artifact only |
| Legal | (none yet) | Agent exists, needs legal skill packet |
| Support | `gic-skills` | Agent exists, write_artifact/read/list only |

## Critical gaps (in priority order)

1. **Need Paperclip adapter parity** — Codex/Claude/Gemini/OpenCode should move behind a real adapter registry instead of living in `agent/anthropic.ts`
2. **Need real execution tools** — shell/file-write/email/PDF/image/CRM/db tools are still missing
3. **Need 8 department smoke tests** — only one generic offline task run has been verified
4. **Skills need stronger runtime use** — skill content loads into prompts and package export, but many departments still lack tools to act on skills
5. **150+ pages decorating a corpse** — most page.tsx are seeded UI not wired to real functionality
