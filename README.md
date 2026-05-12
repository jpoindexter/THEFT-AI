# THEFT AI

AI workspace platform — run a company with agents.

## Run it (zero setup)

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 — no database, no auth, no env required for the UI.

For real Cofounder chat replies (instead of stub echoes), add an Anthropic key:

```sh
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY
```

All app data is written to `.theft-data/*.json` files (gitignored). Delete the
folder to reset everything.

## What's in the box

- **Onboarding** — 3-question wizard → company create
- **Org chart** — radial layout, 8 departments
- **Department pages** — agent list with attached skills + tasks
- **Tech tree / roadmap** — 27 nodes across 7 stages, dependency-aware
- **Cofounder chat** — Claude-backed chat panel (Anthropic SDK)

## Where the data lives

```
.theft-data/
├── organizations.json
├── departments.json
├── agents.json
├── tasks.json
├── cofounder_messages.json
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
- Anthropic SDK (Claude Sonnet 4.6)
- shadcn/ui + Tailwind v4
- Zod validation
- File-backed JSON store (no DB needed for v0)
