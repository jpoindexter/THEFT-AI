# TASKS

> Working task list. Update status (`☐ todo` / `▶ doing` / `✅ done` / `🚫 blocked`) as work progresses.
> Don't add new tasks unless they're tied to a `BUILD-FROM-THIS/ROADMAP.md` slice.
> Side ideas → `PARKED.md`, not here.

## Model + effort legend

| Model | When to use | Cost | Speed |
|---|---|---|---|
| **Opus 4.7** | Architecture decisions, novel schema design, hard debugging | High ($15/$75 per 1M) | Slower |
| **Sonnet 4.6** | Default. Implementation, multi-file changes, real coding | Medium ($3/$15 per 1M) | Fast |
| **Haiku 4.5** | Trivial work. File moves, archiving, label changes, type fixes | Low ($0.25/$1.25 per 1M) | Fastest |

Effort: **S** = 30–60 min · **M** = 1–2 hr · **L** = 2–4 hr

## How model switching works

**Default:** Sonnet 4.6.
**Claude prompts you to switch** before starting a task tagged with a different model. Look for `👉 SWITCH TO ...` markers in the conversation. Toggle with `/model` in your CLI.

**Switch points in this list (in order):**
1. Stay on **Sonnet** for T1–T3 (slice 0.1 implementation)
2. T4 is one Haiku task — not worth switching, run on Sonnet
3. **`👉 SWITCH TO OPUS`** before T5 (tool schema design — architecture call)
4. **`👉 SWITCH BACK TO SONNET`** before T6 (rest of slice 0.2)
5. Stay on Sonnet through T18–T25 (smoke tests)
6. **`👉 SWITCH TO HAIKU`** before T27 (start of slice 0.4 archiving grind)
7. **`👉 SWITCH BACK TO SONNET`** before T39 (link cleanup needs reasoning)
8. **`👉 SWITCH TO HAIKU`** for T40, T42, T43 (trivial type-check + status updates)
9. **`👉 SWITCH BACK TO SONNET`** for T41 (full e2e verification)

---

## Pre-v0 — Jason needs to fill before/during work

| ID | Title | Notes |
|---|---|---|
| ☐ J1 | Confirm primary user in `PRD.md` | Currently flagged ASSUMPTION |
| ☐ J2 | Confirm v0 done criterion in `PRD.md` | Currently 8-dept smoke test |
| ☐ J3 | Fill differentiation section in `PRD.md` | Required before v1 ship |

---

## Slice 0.1 — Fix bootstrap bug (Legal + Support agents)

| ID | Title | Model | Effort | Status |
|---|---|---|---|---|
| ☐ T1 | Add Legal agent definition to `bootstrap.ts` (slug, name, role, skills) | Sonnet | S | |
| ☐ T2 | Add Support agent definition to `bootstrap.ts` | Sonnet | S | |
| ☐ T3 | Add default prompts for Legal + Support in `default-agent-prompts.ts` | Sonnet | S | |
| ☐ T4 | Reset `.theft-data/`, complete onboarding, verify all 8 dept pages have an assigned agent | Haiku | S | |

**Slice acceptance:** New org bootstraps 8 agents (one per dept). All 8 dept routes show their agent.

---

## Slice 0.2 — General tool palette (the real foundation work)

| ID | Title | Model | Effort | Status |
|---|---|---|---|---|
| ☐ T5 | **Design tool schema** for general tools — what each tool does, input/output, gating per agent slug, sandboxing rules. Output: spec doc in `app/src/lib/agent/TOOLS-SPEC.md` | **Opus 4.7** | M | |
| ☐ T6 | Implement `read_file` tool (Library + workspace path) | Sonnet | S | |
| ☐ T7 | Implement `list_files` tool | Sonnet | S | |
| ☐ T8 | Implement `web_search` tool (Tavily or Brave API, env-keyed, top 5 results) | Sonnet | M | |
| ☐ T9 | Implement `web_fetch` tool (HTTP GET, return text content) | Sonnet | S | |
| ☐ T10 | Implement `run_command` tool — sandboxed bash, time-boxed, Engineer-only | Sonnet | M | |
| ☐ T11 | Implement `write_file_to_repo` tool — Engineer-only, writes to managed repo path or local fallback | Sonnet | M | |
| ☐ T12 | Implement `send_email` tool — stubbed v0 (logs to artifact); real Postmark in v1 | Sonnet | M | |
| ☐ T13 | Implement `generate_image` tool — stub returning placeholder URL in v0 | Sonnet | S | |
| ☐ T14 | Implement `generate_pdf` tool — markdown→PDF via `pdf-lib`, used by Legal + Design | Sonnet | M | |
| ☐ T15 | Wire dept-specific tool gating — `agent.slug` decides which tools available at runtime | Sonnet | M | |
| ☐ T16 | Update `compose-prompt.ts` to enumerate available tools in the system prompt for each agent | Sonnet | S | |
| ☐ T17 | Type-check clean across all engine changes | Haiku | S | |

**Slice acceptance:** Each dept's agent has the tools relevant to its work. Tool palette is documented and gated.

---

## Slice 0.3 — End-to-end smoke tests (8 depts × 1 task each)

| ID | Title | Model | Effort | Status |
|---|---|---|---|---|
| ☐ T18 | Engineering smoke: "Build a hello-world Next.js endpoint" — agent uses `run_command` + `write_file_to_repo`, file appears | Sonnet | M | |
| ☐ T19 | Design smoke: "Generate a logo concept brief" — agent produces markdown artifact in Library | Sonnet | S | |
| ☐ T20 | Marketing smoke: "Research top 3 competitors and summarize positioning" — `web_search` + `write_artifact` | Sonnet | M | |
| ☐ T21 | Sales smoke: "Draft outreach email for [persona]" — produces email artifact | Sonnet | S | |
| ☐ T22 | Operations smoke: "Summarize the last 5 tasks across the org" — uses `read_file` over task store | Sonnet | S | |
| ☐ T23 | Finance smoke: "Estimate monthly burn from current usage records" — reads `usage_records` table | Sonnet | S | |
| ☐ T24 | Legal smoke: "Draft NDA template" — uses `generate_pdf`, PDF in Library | Sonnet | M | |
| ☐ T25 | Support smoke: "Draft a knowledge-base article for [topic]" — produces markdown artifact | Sonnet | S | |
| ☐ T26 | Update `STATUS.md` with all 8 smoke results (pass/fail + artifact ids) | Haiku | S | |

**Slice acceptance:** All 8 dept agents complete their smoke task end-to-end with real Claude. Each produces a verifiable artifact. Cost tracking records all 8 runs.

---

## Slice 0.4 — Archive dead routes (pruning the 153-route shell)

| ID | Title | Model | Effort | Status |
|---|---|---|---|---|
| ☐ T27 | Archive sales sub-pages: `pipeline/`, `leads/`, `competitors/`, `outreach/` to `_archive/app-routes/` | Haiku | S | |
| ☐ T28 | Archive support sub-pages: `knowledge-base/`, `decision-trees/` | Haiku | S | |
| ☐ T29 | Archive costs sub-pages: `unit-economics/`, `budget/`, `breakdown/` (keep `/costs` root) | Haiku | S | |
| ☐ T30 | Archive analytics: `analytics/`, `analytics/marketing/` | Haiku | S | |
| ☐ T31 | Archive finance sub-pages: `close/`, `collections/` | Haiku | S | |
| ☐ T32 | Archive operations sub-pages: `handoff/`, `reconciliation/` | Haiku | S | |
| ☐ T33 | Archive legal sub-pages: `compliance/`, `contracts/` | Haiku | S | |
| ☐ T34 | Archive marketing sub-pages: `campaigns/`, `content/`, `social/` | Haiku | S | |
| ☐ T35 | Archive design sub-pages: `logo/`, `components/`, `pitch-deck/` | Haiku | S | |
| ☐ T36 | Archive database sub-pages: `auth/`, `logs/`, `migrations/`, `secrets/`, `storage/`, `suggestions/`, `tables/`, `users/` (keep `/database` root) | Haiku | S | |
| ☐ T37 | Trim settings to 7 essential pages (org, payments, domains, env, inbox, company-context, support); archive the rest | Haiku | M | |
| ☐ T38 | Archive misc shell pages: marketplace, templates, share, sandbox, studio, feed, whats-new, help, dev, status, release-notes, calendar, timeline, dashboard | Haiku | M | |
| ☐ T39 | Grep all components/menus for hrefs to archived routes; fix broken links or remove menu items | Sonnet | M | |
| ☐ T40 | Type-check clean + dev server starts without errors | Haiku | S | |

**Slice acceptance:** ~30 routes remain (down from 153). All survivors are wired to real functionality. No dead links.

---

## Slice 0.5 — v0 done verification

| ID | Title | Model | Effort | Status |
|---|---|---|---|---|
| ☐ T41 | Run full v0 flow end-to-end: signup → onboarding → 8 dept smoke tasks → review artifacts | Sonnet | M | |
| ☐ T42 | Update `STATUS.md` to reflect post-v0 reality | Haiku | S | |
| ☐ T43 | Mark v0 done in `ROADMAP.md`, capture learnings for v1 in `DECISIONS.md` | Haiku | S | |

**v0 acceptance:** A founder can sign in, create an org, run a real task on each of 8 dept agents, see real Claude output land in the Library. No fake stubs in shipped paths.

---

## Total estimate (rough)

| Bucket | Count | Effort sum | Suggested model |
|---|---|---|---|
| Architecture (T5) | 1 | M | **Opus** |
| Implementation (T1–T3, T6–T16, T18–T25, T39, T41) | 24 | ~25 hrs | **Sonnet** |
| Trivial (T4, T17, T26, T27–T38, T40, T42, T43) | 18 | ~5 hrs | **Haiku** |
| **Total** | **43 + 3 J-tasks** | **~30 hrs of focused work** | |

**Recommendation:** Run me as Sonnet by default. Toggle to Opus only for T5 (tool schema design). Toggle to Haiku for the route-archiving grind (slice 0.4).
