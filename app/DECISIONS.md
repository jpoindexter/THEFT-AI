# DECISIONS

Append-only. Add new entries at the bottom.

---

## 2026-05-07 — AI provider abstraction

**Choice:** Vercel AI SDK (`ai` package) with BYOK/BYOE model config. Ollama for local, Anthropic/OpenAI for paid — unified via the same `generateText`/`streamText` interface.

**Alternatives:** Hardcoded Anthropic SDK; raw fetch to provider APIs.

**Why:** App is open source. Users bring their own keys or point to a local Ollama endpoint. Vercel AI SDK gives provider-agnostic calls so the agent runner doesn't care which backend is configured. Ollama is OpenAI-compatible so it slots in without a custom adapter.

**Reversible?** Yes — swapping providers is a config change, not a code change.

---

## 2026-05-07 — Tech tree nodes are per-org, AI-generated

**Choice:** Tech tree nodes are generated per org when the business brief completes. Stored as rows in `tech_tree_nodes` table keyed by `organization_id`. `listTechTreeNodes(orgId)` queries that table. The current `TECH_TREE_NODES` constant is demo-only and will be deleted once generation is wired.

**Alternatives:** Single global node graph shared across all orgs (current state).

**Why:** The roadmap is the product — it should reflect the actual business, not a generic template. PDF Champ's nodes are different from a SaaS tool's nodes. The AI generates the graph from the business plan output during the brief completion step.

**Reversible?** Yes — generation can be re-run; nodes are just DB rows.
