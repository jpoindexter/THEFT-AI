# DECISIONS

Append-only. Locked choices. Don't re-litigate without new info.

## 2026-05-10 — Stop pixel-matching cofounder.co
- **Choice:** Visual fidelity to cofounder.co frames is NOT a goal. Engine + functional completeness is.
- **Alternatives considered:** continue pixel-match (was original strategy)
- **Why:** Drift kept producing approximate-but-wrong results. Source-of-truth confusion. Visual layer will be redone later anyway.
- **Reversible:** Yes (re-add pixel-match if differentiation requires it)

## 2026-05-10 — 8 departments are structural, not visual
- **Choice:** Engineering / Design / Marketing / Sales / Operations / Finance / Legal / Support are core to the product. Not negotiable.
- **Why:** That's how a real company runs. THEFT AI's value is "AI runs each dept end-to-end." Removing depts removes the product.
- **Reversible:** No

## 2026-05-10 — Source of truth is cofounder-docs + paperclip, not PLAN.md
- **Choice:** Don't build features unless they're documented in `cofounder-docs/` or have a working pattern in `paperclip/`.
- **Why:** Most session-2 features (sales pipeline, support pages, unit economics) were built off PLAN.md guesses. None verified against docs. Recipe for drift.
- **Reversible:** No (we move docs in, archive PLAN.md)

## 2026-05-10 — Engine before features
- **Choice:** Add real general tools (shell, web search, file ops, email) BEFORE building dept-specific UI flows.
- **Why:** Without tools, every dept agent is identical and toothless. Features built on top of broken engine = wasted work.
- **Reversible:** No

## 2026-05-10 — Drop most sub-pages to `_archive/`
- **Choice:** Move ~120 routes to `_archive/`. Keep only what v0 needs (~30 routes).
- **Why:** 150-route shell hides the engine gap. Smaller surface = easier to verify.
- **Reversible:** Yes (rip back from `_archive/` when proven needed)

## 2026-05-10 — File-backed JSON store stays for v0
- **Choice:** No real DB until v1.
- **Why:** Already documented in CLAUDE.md. Reaffirmed because nothing in v0 needs concurrent writes or relational queries.
- **Reversible:** Yes (swap `db/store.ts` interface for Supabase)
- **Superseded 2026-05-13:** JSON can remain as migration scaffolding only. The target runtime source of truth is Paperclip's embedded local Postgres.

## 2026-05-10 — Anthropic SDK is the primary agent backend
- **Choice:** Default to Anthropic SDK. Keep Ollama and claude-CLI fallbacks but don't optimize for them.
- **Why:** Real product needs real Claude. Local Ollama for offline dev, claude-CLI for OAuth-only setups.
- **Reversible:** Yes

## 2026-05-10 — No more parallel agent dispatch for feature building
- **Choice:** Stop using parallel sub-agents to build features. Source-of-truth violations were systemic.
- **Why:** Sub-agents got Bash-denied and confabulated; main session also drifted. Sequential, verified work only until trust is restored.
- **Reversible:** Yes (re-enable for clearly independent work after engine is proven)

## 2026-05-10 — Stack locked: Next.js 16 + Tailwind v4 + Anthropic SDK + file-backed JSON
- **Choice:** No more "should we switch to X" debates.
- **Why:** Switching stacks before shipping = guaranteed not shipping.
- **Reversible:** No (until v1 + real user)

## 2026-05-13 — Paperclip becomes the runtime host, not just a reference
- **Choice:** THEFT will become one Paperclip-based app: Paperclip runtime/control plane with THEFT product/design/onboarding/skills on top.
- **Alternatives considered:** keep Next app plus Paperclip bridge; continue rebuilding Paperclip concepts inside THEFT.
- **Why:** The bridge proves feasibility but violates the product goal of one agentic company. Paperclip already has the runtime primitives we need.
- **Reversible:** No for product direction; implementation path can still be subtree vs fork.

## 2026-05-13 — Current `app/` is a migration reference, not the final host
- **Choice:** Stop expanding `app/` as the long-term runtime. Use it as reference for THEFT design and flow while porting into the Paperclip host.
- **Why:** `app/` duplicates company/agent/task/runtime state. Continuing there creates permanent dual-source architecture.
- **Reversible:** Yes only if Paperclip host promotion fails.

## 2026-05-13 — THEFT skills are product data
- **Choice:** `skills/` is part of the product and must be imported/registered into Paperclip's company skill system.
- **Why:** THEFT's differentiation is not only Paperclip runtime; it is the curated skills and company-building workflows.
- **Reversible:** No.

## 2026-05-13 — Cofounder docs define behavior, frames define flow/reference only
- **Choice:** Use `cofounder-docs/` for product behavior and `frames2/` for flow/design reference. Do not copy private Cofounder runtime or branding.
- **Why:** We do not have Cofounder source. Recreating the product flow on Paperclip is the correct path.
- **Reversible:** No.

## 2026-05-13 — Hide credits/billing for local-first
- **Choice:** Paperclip budget/cost internals can remain for observability, but THEFT local-first UX must not present fake credits, paid billing, or subscription enforcement.
- **Why:** The user explicitly called this silly while not implemented. Fake commerce undermines local dogfooding.
- **Reversible:** Yes when real billing is implemented.
