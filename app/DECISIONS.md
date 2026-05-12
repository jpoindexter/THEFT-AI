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

---

## 2026-05-12 — Self-running company reference model

**Choice:** Treat onboarding as setup for a closed-loop AI company system, not a generic chatbot workspace. The first brief should define queryable company memory, the first automated operating loop, scheduled agent cadence, and where humans approve external or strategic actions.

**Reference:** User-provided transcript: "Build a Self-Running AI Company in 16 Minutes (Move 75% Faster)".

**Why:** The product target is an AI agent company: shared memory, layered instructions, scheduled routines, dashboards that trigger work, and agents that produce durable artifacts. Offline mode must preserve that shape so onboarding still teaches the app what kind of company system to run.

**Reversible?** Yes — these defaults can be replaced by model-generated questions when an online LLM backend is configured.

---

## 2026-05-12 — Provider/model selection follows OpenCode and Paperclip

**Choice:** Store model IDs as OpenCode-style `provider/model` strings and make local OAuth CLI backends first-class: Codex CLI, OpenCode CLI, and Claude CLI. Also support local harnesses through Ollama, LM Studio, and generic OpenAI-compatible endpoints, with Anthropic API as an optional direct backend.

**Reference:** OpenCode provider/model selection and Paperclip `codex_local` / `claude_local` adapter model.

**Why:** The app should run from the user's existing CLI OAuth/session auth when possible, not require hosted API keys. Local harnesses need a UI path so users can pull Ollama models or point the app at LM Studio or any compatible server.

**Reversible?** Yes — these are runtime settings stored per org and can be changed without data migration.
