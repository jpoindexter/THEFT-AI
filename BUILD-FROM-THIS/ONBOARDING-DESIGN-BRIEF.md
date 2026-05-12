# THEFT AI — Onboarding Design Brief

Design the complete 2-step onboarding flow for THEFT AI. This is a functional internal tool, not a marketing page. The aesthetic is V15: monotone light, Geist Mono throughout, no color accents, no gradients, no illustrations.

---

## What THEFT is

An AI-agent platform that runs a real company. Once onboarded, 8 department agents (Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support) autonomously execute work across a visual roadmap. The cofounder agent coordinates everything. Think Linear + Notion collapsed into one shell run by agents.

---

## Design system (non-negotiable)

```
Canvas:      #f0f0f0   (page background)
Paper:       #fafafa   (card/panel background)
Ink:         #111111   (primary text, filled buttons)
Ink-muted:   #777777   (secondary text, labels)
Ink-soft:    #aaaaaa   (placeholder, timestamps)
Line:        #dedede   (borders, dividers)
Line-strong: #cccccc   (active borders, card outlines)
```

Font: Geist Mono exclusively. 13px body, 11px label, −0.02em tracking. No other typefaces.

Shell chrome: 52px topbar (`THEFT &` wordmark left, nothing right), `bg-canvas`. No sidebar on onboarding screens.

CSS variables already exist in the app:
- `var(--t-canvas)`, `var(--t-paper)`, `var(--t-ink)`, `var(--t-ink-muted)`, `var(--t-ink-soft)`
- `var(--t-line)`, `var(--t-line-strong)`
- `var(--font-geist-mono)`

---

## Step 1 — `/onboarding` — Name your company

This screen creates the workspace. Single centered card, max-width 640px.

- Label: `NEW WORKSPACE · STEP 1 OF 2` (11px, uppercase, ink-soft)
- Heading: `Name your company` (40px, 600 weight)
- One-line subtext: after naming, you'll do a quick Cofounder interview that generates your roadmap
- Input card (paper bg, line-strong border, 8px radius): plain text input, character count `0 / 80`
- Example pills below: "AI marketing agency", "Subscription design service", "B2B SaaS for accountants" — clickable, autofill the input
- Action row: `Skip — I'll fill this in later` (ink-soft, left) + `Continue →` button (ink bg, paper text, 36px height, right)
- Below a dashed divider: `WHAT HAPPENS NEXT` 3-column grid:
  - `01` Cofounder interview — 5–10 min conversation to nail down ICP, problem, and what kind of business you actually want
  - `02` Roadmap generated — a tech-tree of ~30 capabilities across 8 stages and 8 departments
  - `03` First agents launch — you pick the next move; the relevant department agent does it

---

## Step 2 — `/{slug}/onboarding` — Cofounder interview

This is the most important screen. It is a **2-column full-screen layout**.

**What it is NOT:**
- Not a circle animation
- Not a sunflower or pixel art illustration
- Not a decorative loading state

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  THEFT &                    Design Subs · New workspace · 2/2  │  52px topbar
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                              │
│         LEFT CANVAS              │       RIGHT CHAT PANEL       │
│         (flex: 1)                │       (width: 380px)         │
│                                  │                              │
│   Live company artifact          │   Cofounder interview chat   │
│   building in real-time          │                              │
│                                  │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

### Left canvas — live company artifact

A department grid that builds as the user answers questions. 8 department tiles in a 4×2 grid, each tile small and labeled:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Engineering  │   Design     │  Marketing   │    Sales     │
│   — empty —  │   — empty —  │   — empty —  │   — empty —  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  Operations  │   Finance    │    Legal     │   Support    │
│   — empty —  │   — empty —  │   — empty —  │   — empty —  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Each tile: paper bg, line border, dept name in 11px ink-muted. As the interview progresses, tiles activate — border becomes line-strong, a short descriptor or status appears inside. A company name + mission statement preview sits above the grid, populating in real-time as the cofounder processes answers.

Alternative left canvas (pick whichever is cleaner): a structured brief document preview. A `business_context.md`-style card that fills in sections (Mission, ICP, Model, Differentiator) as the user answers each question. Monospace, left-aligned, like a terminal doc being written live.

### Right chat panel — 3 phases

**Phase 1: Describe**

- Chat header: `✦ Cofounder` (13px, 600) · `Always-on chief of staff` (11px, ink-soft)
- Empty state body: Large textarea, placeholder: `"A subscription service for designers who need ongoing brand work…"`, min-height 120px, paper bg, no border, resizable
- Below textarea: character count + send button (ink bg, 28×28px, ArrowUp icon)
- 3 example prompts as pills: `AI marketing agency`, `Subscription design service`, `B2B SaaS for accountants`

**Phase 2: Loading**

After user submits description:

- User bubble appears (right-aligned, canvas bg, line border, rounded)
- Cofounder bubble: `Got it. Let me sharpen this into a brief — give me a moment.`
- Activity rows (each on its own line, 12px, ink-soft):
  - `~ Reading your description`
  - `~ Generating refinement questions`
  - `⊙ Working…` (pulsing)
- Skeleton card below: animated pulse, 2 lines + 2 option blocks

**Phase 3: Questions**

Inline question card inside the chat scroll area:

- Progress: `1 / 4` (ink-muted, 11px) + close (X) button top right
- Question text: 14px, 500 weight, ink
- 3–4 option buttons: full-width, left-aligned, paper bg, line border → line-strong on hover, ink border when selected
- `Recommended` badge on one option (paper bg, line border, 10px)
- Option description: 11px, ink-soft below option label
- `Something else` free text input at bottom
- Footer: `Decide all` (ghost button, flex-1) + `Decide this one →` or `Submit` on last question (ink filled, flex-1)

Bottom of panel: disabled input field, `Ask for follow up changes…` placeholder, opacity 50%, pointer-events none while interview is in progress.

---

## What NOT to do

- No sunflower or pixel art illustrations
- No dashed circle org-ring animation
- No purple gradients, no color beyond the V15 palette above
- No multi-step wizard with experience/role/stage survey questions
- No progress bar at top, no numbered circle step indicators
- No `bg-[#f3f1ec]` or cream/beige — use `bg-canvas` (#f0f0f0) only
- No `bg-[#c89a4d]` gold avatar — use ink-muted for the cofounder dot

---

## File targets

These are the files to write or replace:

| File | What it does |
|------|-------------|
| `src/app/onboarding/flow.tsx` | Step 1: Name your company |
| `src/components/org-onboarding-flow.tsx` | Step 2: Shell + left canvas |
| `src/components/org-onboarding-chat.tsx` | Step 2: Right chat panel (3 phases) |

### Wiring (do not change)

- `flow.tsx` POSTs to `/api/organizations` → gets `{ slug }` → redirects to `/${slug}/onboarding`
- `org-onboarding-flow.tsx` receives `organization: { id, slug, name }` as prop
- `org-onboarding-chat.tsx` POSTs to `/api/${slug}/brief/generate` with `{ idea: string }` → gets `{ questions: Question[] }`
- `Question` type: `{ id: string; prompt: string; options: { key, label, description?, recommended? }[] }`
- Phase state: `"describe" | "loading" | "questions" | "plan" | "activated" | "brand-design"`
- After all questions answered → `setPhase("plan")` — the plan phase is handled by `org-onboarding-plan.tsx` (do not touch)

### Constraints

- Use inline styles with `var(--t-*)` CSS variables — no Tailwind for layout
- Use flexbox/grid inline for structure
- `var(--font-geist-mono)` for font-family on all elements
- No new dependencies
- TypeScript strict — no `any`
- After writing, run `pnpm exec tsc --noEmit` to confirm clean
