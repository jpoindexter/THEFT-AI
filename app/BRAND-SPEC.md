# THEFT AI · Brand Spec

> Source of truth for design tokens. Pulled into `globals.css` as
> `--t-*` variables and exposed to Tailwind under `@theme inline`.
> If you want to tweak a colour, change it here, then update the var.
> Never hardcode hex / oklch values inside components.

## Aesthetic direction

Cross-stitch + textile, warm cream, dense small-type cofounder
workspace. Single accent (mustard) on a near-monochrome stone
palette. Hand-stitched motifs over glossy SaaS gradients.

| Axis | Choice | Why |
|---|---|---|
| Tone | Brutally minimal · workspace | Cofounder reference |
| Surface | Cream `--t-cream` + paper `--t-paper` | Warm, not sterile |
| Accent | Mustard `--t-mustard` (single) | Replaces SaaS purple |
| Status | Sage success / brick danger / mustard warn | No emoji |
| Typography | Distinctive display + system body | Avoid generic Inter-only |
| Density | Small text, 4px grid spacing | Power-user surface |

## Token layers

| Layer | Examples | Live in |
|---|---|---|
| **Brand** | `--t-cream` `--t-mustard` `--t-sage` `--t-brick` `--t-ink` | `globals.css :root` |
| **Spacing** | `--t-space-{1..8}` | `globals.css :root` |
| **Type** | `--t-text-{2xs..xl}` | `globals.css :root` |
| **Radius** | `--t-radius-{sm,md,lg,pill}` | `globals.css :root` |
| **Motion** | `--t-ease`, `--t-dur-{1,2,3}` | `globals.css :root` |
| **shadcn aliases** | `--background`, `--foreground`, etc. → forward to brand | `globals.css :root` |
| **Tailwind classes** | `bg-canvas` `text-ink-muted` `border-line` | `@theme inline` block |

## Component primitives

`src/components/ui/primitives.tsx` wraps the tokens. Reach for these
before writing raw class strings:

- `Card`, `CardBody` — paper + border-line
- `Stack` — vertical rhythm
- `Eyebrow` — `text-2xs uppercase tracking-wider text-ink-soft`
- `PageTitle`, `SectionTitle`, `Hint`
- `Pill` (tone: `neutral` `sage` `mustard` `brick`)
- `ButtonPrimary` (ink), `ButtonGhost` (line)

## File / function caps

Per `CLAUDE.md`: files ≤ 300 lines hard / 200 soft, functions ≤ 50
hard / 30 soft. New surfaces split into their own components when
they cross the soft cap.

## Don't list

- No raw hex values in components.
- No `bg-white` / `bg-black` — use `bg-paper` / `bg-ink`.
- No `text-[12px]` literal sizes — use `text-sm` (which is mapped
  to `--t-text-sm` = 12px in the THEFT scale).
- No emoji as icons (huashu-design slop rule).
- No purple gradients. No glossy SaaS shine.
