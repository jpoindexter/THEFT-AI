# THEFT AI

AI workspace platform — run a company with agents.

> ⚠️ Migration note: this `app/` is historical/reference implementation only.
> The active tracked Paperclip-host runtime now lives in `paperclip/`.
> Do not add new product features here unless explicitly routing through Paperclip host.

## Run it (zero setup)

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 — no database, no auth, no env required for the UI.

Release gate (tests + build + route smoke + onboarding checks):

```sh
pnpm gate
```

For real Operator chat replies, use a local OAuth CLI or local model harness.
The default backend is Codex CLI, matching the Workspace Sync-style local adapter
model:

```sh
cp .env.local.example .env.local
# then choose one:
# LLM_BACKEND=codex-cli       # uses your local Codex login
# LLM_BACKEND=opencode-cli    # uses OpenCode provider/model config
# LLM_BACKEND=claude-cli      # uses your local Claude Code login
# LLM_BACKEND=ollama          # uses OLLAMA_URL and OLLAMA_MODEL
# LLM_BACKEND=lmstudio        # uses LMSTUDIO_URL and OPENAI_COMPAT_MODEL
```

You can also choose the runtime and `provider/model` IDs from
`Settings > AI Settings`. Ollama models can be pulled from that screen.

All app data is written to `.theft-data/*.json` files (gitignored). Delete the
folder to reset everything.

## What's in the box

- **Onboarding** — 3-question wizard → company create
- **Org chart** — radial layout, 8 departments
- **Department pages** — agent list with attached skills + tasks
- **Tech tree / roadmap** — 27 nodes across 7 stages, dependency-aware
- **Operator chat** — local CLI or provider-backed agent chat

## Where the data lives

```
.theft-data/
├── organizations.json
├── departments.json
├── agents.json
├── tasks.json
├── operator_messages.json
├── artifacts.json
└── tech_tree_status.json
```

When ready for real persistence, replace `src/lib/db/store.ts` with a Supabase
or Postgres adapter. Same shape, swap the implementation.

## Next

- [ ] Business brief 4-question flow → BusinessPlan artifact
- [ ] Task creation + agent execution loop
- [ ] Library file browser
- [ ] Settings pages
- [ ] Brand kit agent (using `web-design-guidelines` annotation templates)

## Stack

- Next.js 16 + App Router + Turbopack
- Codex/OpenCode/Claude CLI, Ollama, LM Studio, Anthropic, OpenAI-compatible runtimes
- shadcn/ui + Tailwind v4
- Zod validation
- File-backed JSON store (no DB needed for v0)
