# THEFT AI — Build Map

## Current state (live at /app/)

```
/THEFT AI/
├── app/                    — Next.js 16 app, file-backed JSON store, Anthropic via Claude OAuth subprocess
├── paperclip/              — agent backend reference (NOT running, borrow patterns only)
├── skills/                 — 20 skills (incl. huashu-design + 36 brand annotation templates)
├── cofounder-docs/         — 33 MD files mirroring docs.cofounder.co
└── screenshots/            — 10 folders, every screen named in flow order (canonical spec)
```

## Section status (one-by-one rebuild against screenshots)

| # | Section | Folder | Status | Notes |
|---|---------|--------|--------|-------|
| 01 | Onboarding | `01-onboarding/` | ✅ complete | 5 steps, sunflower SVG, cross-stitch ASCII tagline |
| 02 | Company creation | `02-company-creation/` | ✅ complete | Org chart canvas, OrgChart + Canvas components, DepartmentHero |
| 03 | Business brief | `03-business-brief/` | ✅ complete | 4-question inline widget, brief→plan flow, departments activated |
| 04 | Roadmap board | `04-roadmap-board/` | ✅ complete | 27 nodes, 7 stages, kanban board, node detail panel |
| 05 | Main workspace | `05-main-workspace/` | ✅ complete | Org chart + right panel with Home/Cofounder/Company/Tasks/Library |
| 06 | Agent tasks | `06-agent-tasks/` | ✅ complete | Task detail with floating context bar, all right panel tabs, fresh updates |
| 07 | Brand kit | `07-design-brand-kit/` | ✅ complete | 4-phase flow, vibe picker, palette/typography/complete screens |
| 08 | Supabase panel | `08-supabase/` | ✅ complete | Full database section: tables, migrations, auth, users, secrets, storage, logs, advisors |
| 09 | Settings | `09-settings/` | ✅ complete | All 12 pages including billing/usage detail and advanced/bring-own-repo |

**Last verified: 2026-05-09.** 133 routes covered, 0 linked routes missing.

### Changes this session (2026-05-09)
- **Right panel / Home tab**: roadmap progress banner, roadmap-node suggested-next, afternoon/evening boundary fix
- **Department entity panel**: full rewrite — collapsible Agents/Tasks/Files/Context with banner + description
- **Design scene**: SVG landscape illustration (sky, clouds, hills, cypress trees, figure)
- **Brand kit CompletePhase**: brand identity board with horizontal palette + typography + Paper/Canvas row + mockup preview cards
- **Tech tree**: `checklist_item` + `external_cta` fields on all nodes; "TASK QUEUED" badge; "Open domains"/"Open Mercury" CTA buttons
- **Settings**: Organization (defaultValue=chatgpt, Perplexity/OpenAI labels), Stripe (KEYS/ENC headers + instructional text), AI Settings (removed Browser test credentials card), Env (Upload in header, staging toggle + Product dropdown)
- **Company tab**: populated App/Production/Staging links from derived demo URLs
- **Tasks focus view**: description paragraph rendered
- **Library**: file count shows 0 instead of empty
- **Finance/Ops**: removed unused icon imports

### Open visual gaps (blocked without assets)
- Task detail canvas layout diverges from reference (CLONE-GAPS #2)
- Screen recording unread (CLONE-GAPS #1)

## Rules of engagement

1. **The screenshots are the spec.** Match them. No "improvements."
2. **No AI slop.** Use huashu-design skill principles — cross-stitch / textile aesthetic, real assets over generics, anti-pattern checklist.
3. **One section at a time.** Don't move on until current section matches.
4. **Type-clean before committing.** `pnpm exec tsc --noEmit` after each change.
5. **No DB until v1.** File-backed JSON store at `.theft-data/` is the truth.

## Skill → Agent mapping (already wired in `lib/orgs/bootstrap.ts`)

| Agent | Attached Skills |
|---|---|
| Engineer | `dev-workflow`, `supabase`, `supabase-postgres-best-practices`, `debugging-vercel-builds` |
| Design | `web-design-guidelines`, **`huashu-design`**, `shader-authoring`, `favicon-pack-maker`, `hyperframes` |
| Marketing | `content-engine`, `last30days-research` |
| Sales | (none yet) |
| Operations | `ops-agent-skills` |
| Finance | `finance-agent-skills` |

## What `huashu-design` adds

Read `/skills/huashu-design/SKILL.md`. Key principles:
- **Don't pull from training** — verify facts via WebSearch before asserting
- **Start from existing context** — the cofounder.co screenshots ARE our context
- **Brand assets > rules** — logo > product images > UI screenshots > colors > fonts
- **20 design philosophies** to anchor a direction (Pentagram, Field.io, Kenya Hara, Sagmeister, etc.)
- **Anti-AI-slop checklist** — every output runs through it
- **5-dimension expert review** at the end

Apply to: brand kit generation, design agent outputs, marketing site, anywhere we generate visuals.

## 7-day shipping plan

See `/app/PLAN.md` for day-by-day section work.
