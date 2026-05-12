# STATUS — What actually exists

> Audit-derived, not assumed. Last updated 2026-05-10 by Claude session.
> Update when something changes status. Don't fabricate.

## Engine (`app/src/lib/`)

| Component | LOC | Status | Notes |
|---|---|---|---|
| `agent/run.ts` | 271 | **WORKS** | Real Anthropic SDK, tool loop ≤8 iter, pause/resume, cost tracking |
| `agent/tools.ts` | 175 | **PARTIAL** | Only 6 tools, all onboarding-shaped. No shell, file-write, web-search, email |
| `agent/anthropic.ts` | 134 | **WORKS** | 3 backends: Ollama / Anthropic SDK / claude CLI |
| `agent/compose-prompt.ts` | 105 | **WORKS** | Loads `../skills/<id>/SKILL.md` into system prompt |
| `agent/run-cli.ts` | ? | UNVERIFIED | OAuth subprocess fallback |
| `db/store.ts` | 1069 | **WORKS** | File-backed JSON, swappable for Supabase |
| `orgs/bootstrap.ts` | 117 | **BUG** | Seeds 6 agents, missing Legal + Support |

**Foundation verdict:** engine runs, but tool palette is onboarding-only. Dept agents currently can only write markdown to Library.

## Routes inventory (153 page.tsx files)

### Onboarding — WORKS
- `/`, `/signin`, `/onboarding`, `/[org]/onboarding`, `/onboarding/done`

### 8 Departments — STRUCTURAL EXIST, FUNCTIONAL UNVERIFIED
- `/[org]/[department]/page.tsx` — catch-all dept page
- `/[org]/engineering`, `/design`, `/marketing`, `/sales`, `/operations`, `/finance`, `/legal`, `/support`
- Status: pages render but each agent has same 6-tool palette. **Real test never run end-to-end.**

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
ask_user_question        — pause, multiple-choice prompt to user
set_business_plan        — save org's business plan
delegate_to_department   — route a task to another dept agent
set_tech_tree_node_status— mark a roadmap node complete
write_artifact           — write markdown/json/code to Library
complete_onboarding      — signal onboarding done
```

**Missing for real dept work** (from paperclip + cofounder-docs):
- `run_command` — shell exec in sandbox (Engineer)
- `write_file_to_repo` — commit code to managed GitHub (Engineer)
- `web_search` — research (Marketing, Sales, Legal)
- `web_fetch` — read URL contents
- `send_email` — Postmark / outbound (Marketing, Sales, Support)
- `create_lead` / `update_lead` — CRM mutation (Sales)
- `query_db` — read managed Supabase (Engineer, Operations)
- `generate_image` — visual asset gen (Design, Marketing)
- `generate_pdf` — contracts, decks (Design, Legal)
- `read_file` / `list_files` — Library nav (all)

## Skills wired to agents (from `bootstrap.ts`)

| Department | Skills attached | Engineer can do |
|---|---|---|
| Engineering | `dev-workflow`, `supabase`, `supabase-postgres-best-practices`, `debugging-vercel-builds` | Read SKILL.md, but no shell/file tools to act |
| Design | `web-design-guidelines`, `huashu-design`, `shader-authoring`, `favicon-pack-maker`, `hyperframes` | Read, write_artifact only |
| Marketing | `content-engine`, `last30days-research` | Read, write_artifact only |
| Sales | (none) | Read, write_artifact only |
| Operations | `ops-agent-skills` | Read, write_artifact only |
| Finance | `finance-agent-skills` | Read, write_artifact only |
| Legal | NOT BOOTSTRAPPED | — |
| Support | NOT BOOTSTRAPPED | — |

## Critical gaps (in priority order)

1. **Bootstrap missing Legal and Support agents** — bug, 1-line fix in `bootstrap.ts`
2. **Tools are onboarding-only** — engine bottleneck. Need general tool set per dept
3. **Real end-to-end run never verified** — does `/api/[org]/tasks/[task]/run` actually invoke `runAgent` with the dept agent's prompt and produce a usable result for any of 8 depts?
4. **Skills loaded but unused** — skill content goes into prompt but agent has no tools to act on it
5. **150+ pages decorating a corpse** — most page.tsx are seeded UI not wired to real functionality
