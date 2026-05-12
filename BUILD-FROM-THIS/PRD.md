# PRD — THEFT AI

> One page. Source of truth for what we're building and why.

## One-liner

**THEFT AI** is an AI-agent platform that runs a real company end-to-end across 8 departments — Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support.

A solo founder gives the company a goal. Agents in each department execute real work — writing code, sending email, drafting contracts, managing leads, paying invoices. The founder reviews, approves, redirects.

## Why this, why now

Cofounder.co and paperclip both prove the thesis (AI agents running a company) but neither is what theft.studio wants to ship. THEFT AI uses both as scaffolding references — copy the structural model, then redo the visual layer and the differentiation.

## Primary user

> ASSUMPTION — Jason to confirm/edit:

Solo founder building a startup. Has product idea, doesn't have time/money to hire a team. Wants AI agents that actually do the work, not chatbots that draft and hand back.

## What "v0 done" means

Done when: a founder can create an org, and **for each of the 8 departments**:
1. Navigate to the dept page
2. See its assigned agent
3. Create a real task ("Write a launch email", "Draft an LLC operating agreement", "Build a hello-world Next.js endpoint")
4. Have Claude actually execute via real tools (not just write a markdown file)
5. See the output land somewhere usable (Library, repo, sent email, signed PDF — depends on dept)
6. Mark task done

**Not v0:** pixel-matching cofounder.co, polished UI, settings sub-pages, brand kit flow, tech tree visualization, sales/support/finance dashboards built off PLAN.md.

## In scope (v0)

- Onboarding flow (already works)
- Org chart canvas with 8 departments
- Per-dept agent + task creation + Claude execution
- **Real per-dept tool sets** (Engineer: shell + file write + git; Marketing: web search + content gen; Sales: CRM read/write; Finance: ledger read/write; Legal: doc gen + signing; etc.)
- Task list, task detail, task status (queued/running/done/blocked)
- Library (artifacts persist across tasks)
- File-backed JSON store (no DB)
- Auth (basic — single user is fine for v0)

## Out of scope (v0 → PARKED.md)

- Pixel-match cofounder.co frames
- Brand kit generation flow (cosmetic, low value for foundation)
- Tech tree visual / roadmap dependency graph (already built, leave alone)
- Sales/Support/Finance/Analytics dashboards we just built off PLAN.md (built on assumptions, not real product needs)
- 12+ settings sub-pages (collapse to ~3 for v0)
- Database/Supabase panel UI
- Marketplace, templates, share, sandbox, studio, feed, what's-new pages
- Multi-user team / RBAC
- Real Supabase wiring (file store is fine for v0)
- Real GitHub/Vercel/Stripe integrations (mock for v0, real in v1)

## Differentiation (TBD — Jason to fill)

> What makes this not-just-cofounder?
> - Visual identity: ?
> - Tool philosophy: ?
> - Pricing/positioning: ?
> - Target user vs cofounder/paperclip: ?

Without this, the product is a worse cofounder clone. Fill before v1.

## Sources of truth (named so I stop drifting)

| Source | What it tells us |
|---|---|
| `cofounder-docs/` (32 MD files) | Feature list — what features must exist |
| `paperclip/` (read-only) | Working engine reference — patterns for tools, agents, runtime |
| `frames2/`, `screenshots/` | **Visual reference only** — not pixel spec |
| `skills/` | Skills attached to agents — instruction packets |
| **This file (PRD.md)** | What v0 done means |
| **STATUS.md** | What actually exists vs is claimed |
| **ROADMAP.md** | Order of v0 slices |
| **DECISIONS.md** | Locked choices, no re-litigating |

## Anti-drift rules (carrying over from CLAUDE.md, repeated here for source-of-truth)

1. If a feature isn't in cofounder-docs or paperclip, don't build it
2. Engine/functionality matters; visual fidelity to cofounder.co does NOT
3. Don't build features off this PRD before verifying source-of-truth has them
4. Two failed attempts at the same fix → stop, surface options
5. New work is a v0 done criterion or it goes in PARKED.md
