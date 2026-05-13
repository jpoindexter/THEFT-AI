# STATUS — What actually exists

> Audit-derived, not assumed. Last updated 2026-05-13 by Codex session.
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

Next blocking work: finish porting staged onboarding flow into the tracked host (adaptive setup + full step wiring) and seed Operator/departments/tasks directly from that flow. Avoid building new runtime features in `app/`.

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
