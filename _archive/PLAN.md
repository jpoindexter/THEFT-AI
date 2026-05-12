# Implementation Plan

Ordered by impact. Each item has: what's wrong, what to build, which file(s).

---

## Already Done This Session

- ✓ Billing page — `/[org]/billing/page.tsx` + `billing-token-chart.tsx` (balance cards, warning banner, spend overview, token chart, billing receipt with usage/dept/agent itemization, transaction history)
- ✓ Right panel task focus header — `tasks-tab.tsx` `←` back (`router.back()`), `?` → report modal, `...` → Archive task / Copy debug info / Change status flyout
- ✓ Notification pill — `layout-canvas.tsx` pill with bell+dot+avatar+count, Inbox panel (chevron, items, hover actions), Desktop alerts modal with 3 toggles
- ✓ `started_at` elapsed time on tasks (gap #6)
- ✓ Integrations page — Organization + Your Integrations grid with 24 personal integrations
- ✓ Integrations layout — left sidebar nav (Integrations / MCP / Custom Integrations)
- ✓ MCP page — Composio toolkit browser (11 toolkits, search, Load more)
- ✓ Integration detail — Triggers + Actions model (Linear: 5 triggers, 11 actions)
- ✓ AskUserQuestion back navigation (ChevronLeft, goBack() removes last tool_answer)
- ✓ 4-level breadcrumb in header
- ✓ Task status badge with elapsed time
- ✓ TaskContextBar floating pill on task canvas pages
- ✓ Blocked task badge (`Blocked >` amber pill) + Credits Exhausted blocker cards in task focus
- ✓ Canvas dept node popup — badge (● blocked ● active), click popup with Blocked/Running/Recents sections, `>` hover navigates to task
- ✓ Roadmap "coming soon" dept nodes — Finance, Support, Operations, Legal as separate row with COMING SOON popup

---

## Not In Scope (production-app-only)

- Agent Workspace "Studio" card with artifact roadmap steps
- Content Calendar in Marketing Department
- Library "Chat with file" hover
- Dark-theme department canvases (/canvas route)
- Inbox "All caught up!" panel

---

# Gap Analysis — From cofounder.co/how-to

Source: `/cofounder-how-to.md` — full extraction of all 4 chapters.

---

## CHAPTER II — BUILD

### B1. Agent Rules Config
**What's missing:** No UI to view/edit the `agents.md` / `.cursorrules` file that instructs AI agents on codebase conventions, stack, patterns, and pitfalls.
**Doc says:** "Configure Agent Rules — agents.md or .cursorrules files in repo root. Include tech stack, coding conventions, libraries to use (and not use), examples, common pitfalls."
**Build:** `app/src/app/[org]/settings/advanced/page.tsx` or new `agent-rules/page.tsx` — read/write the rules file, show current content in a textarea editor, save via API.

### B2. Evals / Browser Test Results
**What's missing:** `evals/` route exists but content unknown. Doc describes browser agents auto-testing flows, generating a video of what was tested.
**Doc says:** "Browser agents navigate your app like a real user, clicking through flows, testing edge cases, generating a video of the changes."
**Build:** Verify `evals/[suite]/page.tsx` — should show test run history, pass/fail per flow, session replay video embed, coverage gaps.

### B3. Infrastructure / Diagnostics
**What's missing:** `diagnostics/page.tsx` exists but likely thin. Doc calls out Vercel logs, Supabase logs, error tracking.
**Doc says:** "Vercel logs, Supabase logs, browser dev tools, Sentry error tracking."
**Build:** Extend `diagnostics/page.tsx` — Vercel function log tail, Supabase query performance, error rate chart, recent exceptions.

---

## CHAPTER III — SELL

### S1. CRM / Sales Pipeline ⭐ HIGH PRIORITY
**What's missing:** No CRM page. Doc describes a full 8-stage pipeline with conversion funnel analytics.
**Doc says:** Pipeline stages: Open → Trying to Contact → Contacted → Consult → Pitch → Verbal Commit → Closed Won → Closed Lost. Weekly pipeline review. Conversion rate per stage. Fix one thing per month.
**Build:**
- New page: `app/src/app/[org]/sales/pipeline/page.tsx`
- Stage columns (kanban or list) with deal count + value per stage
- Conversion funnel: % Open→Contacted, Contacted→Consult, Consult→Pitch, Pitch→Verbal, Verbal→Won
- Deal row: company name, contact, last touch, next action, stage badge
- "Why we lost" field on Closed Lost
- Seed: 3–5 mock deals across stages

### S2. Lead List Management ⭐ HIGH PRIORITY
**What's missing:** No lead list page. Doc describes ICP-based lead building, trigger-event scoring, Tier 1/2/3 classification.
**Doc says:** "Build a lead list from ICP + triggers. Score: Tier 1 = strong fit + clear trigger, Tier 2 = good fit + some signal, Tier 3 = possible fit. Spend most time on Tier 1."
**Build:**
- New page: `app/src/app/[org]/sales/leads/page.tsx`
- Table: company, contact name/title, ICP fit score, trigger, tier badge, status, last action
- Filter by tier, status
- Add lead dialog: name, company, role, trigger event, tier
- Seed: 8–10 mock leads across tiers

### S3. Competitor Analysis
**What's missing:** No competitors page. Doc describes researching homepage angle, pricing, pain focus, feature highlights, reviews, and finding the opening.
**Doc says:** "Look at: who their homepage speaks to, what pain they lead with, which features they highlight, what industries they mention, how they price, what their reviews complain about. Find the gap."
**Build:**
- New page: `app/src/app/[org]/sales/competitors/page.tsx`
- Card per competitor: name, URL, homepage angle, pricing, target segment, pain focus, what's missing
- "Our opening" summary field
- Add competitor dialog
- Seed: 3 mock competitors

### S4. ICP Definition View
**What's missing:** May be partially in `company-tab.tsx`. Doc describes a structured ICP with trigger events, budget, workflow, geography, growth stage.
**Doc says:** "Narrow by company size, industry, growth stage, geography, workflow, budget, and trigger event. Too broad: 'ecommerce companies'. Specific: 'DTC brands $5M–$50M revenue relying on repeat purchase with small retention team'."
**Build:** Check `company-tab.tsx` — if thin, add ICP section: current broad description → narrowed ICP with fields (size, industry, stage, geography, trigger, budget). Save to org.

### S5. Outreach Cadence Builder
**What's missing:** No dedicated outreach page. `routines/` may cover scheduling but not the 7-day multi-touch sequence format.
**Doc says:** "Day 1: Email (context/problem/solve). Day 2: Social touch. Day 3: Email (answer objection). Day 4: Social touch. Day 5: Email (differentiator). Day 6: DM. Day 7: Email (soft walkaway). Run up to 3x with different decision makers."
**Build:**
- New page: `app/src/app/[org]/sales/outreach/page.tsx`
- Sequence builder: day + touch type (email/social/DM) + purpose label
- Active sequences list: lead name, current step, last sent, next action
- Template library: subject line + body with merge fields

### S6. Marketing Channel Performance
**What's missing:** `insights/page.tsx` shows internal signals (tasks/webhooks/usage costs). Doc describes tracking content → qualified visitors → leads → meetings → customers.
**Doc says:** "Track: which content gets attention, which brings qualified visitors, which visitors become leads, which leads become meetings, which meetings become customers."
**Build:** Extend `insights/page.tsx` or new `marketing/analytics/page.tsx` — channel funnel (Organic/SEO/Paid/Referral), content performance table, lead source attribution.

---

## CHAPTER IV — SCALE

### SC1. Unit Economics Dashboard ⭐ HIGH PRIORITY
**What's missing:** `costs/` tracks AI agent spend, not customer economics. No LTV/CAC/churn/ARPU view anywhere.
**Doc says:** "Churn rate, average customer lifetime, ARPU, LTV, gross margin LTV, CAC, LTV/CAC ratio, payback period."
**Build:**
- New page: `app/src/app/[org]/costs/unit-economics/page.tsx`
- Metric cards: MRR, ARPU, LTV, CAC, LTV:CAC ratio, payback period (months), monthly churn %
- Churn chart: monthly logo churn over last 6 months
- Customer cohort table: cohort month, customers, retained at 30/60/90d
- Seed: mock customer/subscription data or derive from `db.listUsage()`
- Formulas shown inline so founders understand what they're looking at

### SC2. Customer Support Tooling (Fin / Knowledge Base) ⭐ HIGH PRIORITY
**What's missing:** `settings/support` is "send a report to the Cofounder team" — not tooling for the user's own customers. No knowledge base editor. No decision tree builder.
**Doc says:** "Deploy Fin by Intercom as your customer-facing support agent. Build a knowledge base: getting started, core workflows, billing/plans, troubleshooting, account management, known limitations. Use decision trees for login problems, billing questions, import failures, permission issues, core workflow errors, cancellations."
**Build:**
- New page: `app/src/app/[org]/support/page.tsx` — Fin setup status, connect Intercom button, agent config
- New page: `app/src/app/[org]/support/knowledge-base/page.tsx` — article list (title, category, last updated), editor modal
- New page: `app/src/app/[org]/support/decision-trees/page.tsx` — tree list by category, simple node editor
- Seed: 6 knowledge base articles (getting started, billing, troubleshooting, etc.) + 2 decision trees

### SC3. PostHog / Product Analytics Setup ⭐ HIGH PRIORITY
**What's missing:** `insights/page.tsx` shows derived summaries. No PostHog instrumentation view, funnel config, or retention analysis.
**Doc says:** "Install PostHog. Track: signed_up, onboarding_completed, core_action_completed, trial_started, checkout_completed, subscription_upgraded, teammate_invited, support_ticket_opened. Funnels show drop-off. Session replay shows why. Retention shows whether users come back."
**Build:**
- New page: `app/src/app/[org]/analytics/page.tsx` — PostHog connection status, key events list with on/off toggles, funnel builder (pick events in order → see drop-off %), retention heatmap, recent session replay list
- Seed: mock funnel data (signed_up → onboarding_completed → core_action → subscription)

### SC4. Churn Tracking
**What's missing:** No churn dashboard. `costs/` only shows AI spend. No customer retention data displayed.
**Doc says:** "Logo churn = % customers who leave. Revenue churn = % revenue that leaves. Revenue churn rate = lost recurring revenue / recurring revenue at start of period."
**Build:** Add churn section to unit economics page (SC1) — separate card showing logo churn %, revenue churn %, churned customers last 30d, with trend arrow.

---

# Task List

Ordered by priority. Model and effort for each.

| # | Feature | Page/File | Model | Effort |
|---|---|---|---|---|
| 1 | CRM / Sales pipeline | `[org]/sales/pipeline/page.tsx` | Sonnet 4.6 | M |
| 2 | Unit economics dashboard | `[org]/costs/unit-economics/page.tsx` | Sonnet 4.6 | M |
| 3 | PostHog analytics setup | `[org]/analytics/page.tsx` | Sonnet 4.6 | L |
| 4 | Customer support (Fin + KB + trees) | `[org]/support/*` (3 pages) | Sonnet 4.6 | L |
| 5 | Lead list management | `[org]/sales/leads/page.tsx` | Haiku 4.5 | S |
| 6 | Competitor analysis | `[org]/sales/competitors/page.tsx` | Haiku 4.5 | S |
| 7 | ICP definition | `company-tab.tsx` extension | Haiku 4.5 | S |
| 8 | Outreach cadence builder | `[org]/sales/outreach/page.tsx` | Sonnet 4.6 | M |
| 9 | Agent rules editor | `[org]/settings/advanced/agent-rules` | Haiku 4.5 | S |
| 10 | Marketing channel performance | `[org]/analytics/marketing` or extend insights | Sonnet 4.6 | M |
| 11 | Churn tracking | Add to unit economics page | Haiku 4.5 | S |
| 12 | Evals / browser test results | Verify + extend `[org]/evals/[suite]/page.tsx` | Sonnet 4.6 | M |
| 13 | Infrastructure / diagnostics | Extend `[org]/diagnostics/page.tsx` | Sonnet 4.6 | M |

**Effort key:**
- S = Small (1–2 files, mostly UI, no new data model) ~30–60 min
- M = Medium (2–4 files, some data wiring or new seeded data) ~1–2 hrs
- L = Large (3–6 files, new data model + multiple views + seed data) ~2–4 hrs

**Model key:**
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) — simple CRUD pages, static UI, no complex logic
- **Sonnet 4.6** (`claude-sonnet-4-6`) — data joins, chart components, multi-file changes, complex state
- **Opus 4.7** (`claude-opus-4-7`) — architecture decisions, new DB schema design, complex cross-cutting features (not needed for any of these)
