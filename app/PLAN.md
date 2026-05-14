# 7-day shipping plan

> Done = a founder can sign in, complete onboarding, see their workspace, run a brief, get a business plan, view the tech tree, click into a department, create a task, and visit every settings page — without it looking AI-slop.

## Day 1 — pixel-match the home + onboarding (today)

- [ ] Compare every screen against `/screenshots/01-onboarding/` and `/screenshots/05-main-workspace/02-home-dashboard.png`
- [ ] Fix dept icons on the org chart (colored emoji-style dots, not grey)
- [ ] Add "+1" badge to Marketing dept node
- [ ] Recent-cards row in the bottom toolbar
- [ ] Active task chevron + icon match

## Day 2 — engineering dept + new task flow

- [ ] Match `/screenshots/05-main-workspace/03-engineering-dept-panel.png`:
  - "Let's build [your app] from the ground up" (blue link)
  - Two device-frame mockups (Landing Page + Application)
  - "Engineering Roadmap" horizontal scroller with status cards
  - "0/7 Setup" progress label
- [ ] New Agent / New Task popover from `04-engineering-new-task-menu.png`
- [ ] Task creation modal pixel-match (`/screenshots/06-agent-tasks/04-new-task-dialog.png`)

## Day 3 — tech tree + business brief polish

- [ ] Sample 10 different node-detail panels from `/screenshots/04-roadmap-board/` and verify each section variant works
- [ ] Brief widget: pixel-match question card, "Decide all" / "Decide this one" / "Submit" CTA flow, "1/4" pagination
- [ ] BusinessPlan card: match field labels and styling

## Day 4 — design / brand kit flow

- [ ] Match `/screenshots/07-design-brand-kit/`:
  - Intro card centered with skip / choose-vibe CTAs
  - "Painting your brand kit" progress with rotating sub-labels
  - Final brand board grid (logo / palette / type / paper / components / UI kit)
- [ ] Wire huashu-design skill into the brand kit generation prompt

## Day 5 — settings polish

- [ ] All 10 settings pages match `/screenshots/09-settings/settings*.png`
- [ ] Window-blind shadow effect on settings background
- [ ] Delete account modal (misc/01)
- [ ] Company Context tabs with copy-prompt buttons working

## Day 6 — agent execution loop

- [ ] Tasks created actually run (Anthropic call with the task description + agent skills)
- [ ] Streaming output to the task detail panel
- [ ] Library populated with results
- [ ] Tech tree node "Launch Agent" CTA fires a task

## Day 7 — polish + ship

- [ ] Marketing landing at `/` for unauthed (steal from `misc/03-marketing-site-full.png`)
- [ ] Real auth (Supabase magic link or just bypass with cookie for demo)
- [ ] Deploy to Vercel
- [ ] Domain + favicon (use `favicon-pack-maker` skill)

## Skills wired per agent

```
Engineer:    dev-workflow, supabase, supabase-postgres-best-practices, debugging-vercel-builds, gic-coding-agent-skills
Design:      web-design-guidelines, huashu-design, shader-authoring, favicon-pack-maker, hyperframes
Marketing:   content-engine, last30days-research
Sales:       (none yet — TBD)
Operations:  ops-agent-skills
Finance:     finance-agent-skills
```

## Reference materials in repo

- `/screenshots/` — every screen named in flow order
- `/operator-docs/` — 33 MD files mirroring docs.operator.co
- `/skills/` — 20 skills ready to attach
- `/workspace-sync/` — agent backend reference (don't run, just borrow patterns)
