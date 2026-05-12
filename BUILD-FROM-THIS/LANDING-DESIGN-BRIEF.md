# THEFT AI — Landing & Auth Design Brief

Design the marketing home, sign-in, and sign-in/sent pages. Same aesthetic as the onboarding: V15, monotone, Geist Mono, no decoration.

---

## What THEFT is (new framing — not "cofounder")

THEFT runs a real company for you. You describe what you're building; 8 department agents (Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support) execute across a visual roadmap. You approve, redirect, and ship. No team required.

The product is the platform, not the AI relationship. Do not use "cofounder", "chief of staff", "always-on partner", or similar anthropomorphic framing anywhere on these pages.

---

## Design system (same as onboarding — non-negotiable)

```
Canvas:      #f0f0f0   (page background)
Paper:       #fafafa   (card/panel background)
Ink:         #111111   (primary text, filled buttons)
Ink-muted:   #777777   (secondary text, labels)
Ink-soft:    #aaaaaa   (placeholder, timestamps)
Line:        #dedede   (borders, dividers)
Line-strong: #cccccc   (active borders)
```

Font: Geist Mono exclusively. 13px body, 11px label, −0.02em tracking. No other typefaces.

CSS variables: `var(--t-canvas)`, `var(--t-paper)`, `var(--t-ink)`, `var(--t-ink-muted)`, `var(--t-ink-soft)`, `var(--t-line)`, `var(--t-line-strong)`, `var(--font-geist-mono)`

**What NOT to do:**
- No pixel art landscape or SVG illustrations
- No blue/green sky gradient backgrounds
- No mustard, sage, cream, or any hue — canvas/paper/ink only
- No "Cofounder" in any heading, subtext, or mock UI
- No gradient CTAs
- No rounded hero cards with drop shadows

---

## Page 1 — `/` — Marketing home

Single-page marketing site. Users arrive here before they have an account.

### Topbar (52px, sticky, bg-canvas)
- Left: `THEFT &` wordmark — 13px, 600 weight, `THEFT` in ink, `&` in ink-muted
- Right: `Sign in` link (ink-muted, 12px)

### Hero section (centered, max-width 640px, ~40vh padding top)
- Label: `AGENT PLATFORM · PRIVATE BETA` — 11px, uppercase, ink-soft
- Heading: `Run a real company with AI agents.` — 40px, 600 weight, −0.03em tracking
- Subtext (13px, ink-muted, max 52ch): Eight departments. One roadmap. You decide what ships next; the agents execute it.
- CTA row: `Get started →` (ink bg, paper text, 36px height, 6px radius) + `See how it works` (ghost, paper bg, line border)

### Department strip (below hero, full-width, overflow-x hidden)
Horizontal row of 8 department tiles, each 140px wide:
- `Engineering`, `Design`, `Marketing`, `Sales`, `Operations`, `Finance`, `Legal`, `Support`
- Each tile: paper bg, line border, 6px radius, 12px dept name in ink, 11px descriptor in ink-muted
- No scrollbar — tiles just visually overflow or clip

### How it works (3-step, centered, max-width 640px)
Dashed divider above, `HOW IT WORKS` label (11px, uppercase, ink-soft), then 3 columns:
- `01` · `Describe` — Tell it what you're building. The platform generates a roadmap of ~30 capabilities across 8 departments.
- `02` · `Assign` — Pick the next move. The relevant department agent does it — code, copy, outreach, legal, all of it.
- `03` · `Ship` — Approve, redirect, or skip. You stay in control. Agents execute.

### Department agents section (centered, max-width 800px)
Label: `DEPARTMENT AGENTS` (11px, uppercase, ink-soft)
2-column grid of 4 agent cards (paper bg, line border, 8px radius, 20px padding):
- `Engineering` — Tests locally, opens PRs, runs migrations, ships features end-to-end.
- `Design` — Brand system, logos, components, UI kits, decks.
- `Marketing` — Campaigns, landing pages, copy, outbound sequences.
- `Sales` — ICP from market research, qualified accounts, email sequences.

Each card: dept name 13px 600 weight, desc 12px ink-muted below, no icons.

### CTA footer strip (full-width, bg-ink, paper text)
`Run a real company with AI agents.` — 24px, centered
`Get started →` button — paper bg, ink text, 36px height

### Footer (12px, ink-soft, flex between)
`© THEFT AI` left · `Private beta` right

---

## Page 2 — `/signin` — Sign in

Minimal centered card. No sidebar. 52px topbar (just wordmark, nothing right).

### Card (max-width 360px, centered, paper bg, line-strong border, 8px radius, 24px padding)
- Heading: `Sign in to THEFT` — 18px, 600 weight, −0.02em tracking
- Subtext: `We'll email you a one-time link. No passwords.` — 12px, ink-muted
- Label: `Work email` — 11px, ink-muted
- Input: full-width, 36px height, line border, 6px radius, bg-paper, 13px, focus → line-strong border
- Submit button: `Send magic link →` — full-width, ink bg, paper text, 36px height, 6px radius
- Divider: `— or —` (ink-soft, 11px, full-width)
- SSO row (2 buttons, equal width, paper bg, line border):
  - `Continue with GitHub`
  - `Continue with Google`
- Footer: `By continuing you agree to our terms and privacy policy.` — 11px, ink-soft, centered. `terms` and `privacy policy` underlined.
- Dev-only block (only renders in non-production): paper bg, line border, 8px radius, `DEV MODE` label (11px, uppercase, ink-soft) + `Continue as dev →` button (ink bg, paper text, 28px height)

---

## Page 3 — `/signin/sent` — Email sent

52px topbar, then centered content (max-width 360px):
- `Email sent` — 18px, 600 weight
- `Check your inbox for a sign-in link. It expires in 10 minutes.` — 13px, ink-muted
- Email address shown: 13px, ink (pulled from session/state)
- `Didn't get it? Resend` — 12px, ink-soft, underlined link
- `Back to sign in` — 12px, ink-muted, underlined link

---

## File targets

| File | What it does |
|------|-------------|
| `src/app/page.tsx` | Marketing home — replace completely |
| `src/app/signin/page.tsx` | Sign-in page — replace completely |
| `src/app/signin/sent/page.tsx` | Post-email confirmation page — create if missing |

### Constraints
- Use inline styles with `var(--t-*)` CSS variables — no Tailwind for layout
- `var(--font-geist-mono)` on all elements
- No new dependencies
- TypeScript strict — no `any`
- After writing, run `pnpm exec tsc --noEmit` to confirm clean
- No illustrations, SVGs, pixel art, gradient backgrounds
- No `cofounder` string anywhere in JSX
