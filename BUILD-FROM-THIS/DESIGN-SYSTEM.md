# THEFT Design System Contract

> Active as of 2026-05-16. This supersedes one-off visual constants in product UI work.

## Current Target

THEFT should read as a clean, white, Sana-style operating workbench: low chrome, quiet hierarchy, black/gray typography, and one strong lime signal color for primary action/state. The 099 and command-center renders are structure/density references, not permission to make the active app dark, neon, or dashboard-heavy.

## Single Source Of Truth

THEFT has one design-system source of truth:

```text
BUILD-FROM-THIS/DESIGN-SYSTEM.md
        defines the product design contract
paperclip/ui/src/index.css
        implements the contract as shadcn/Tailwind v4 CSS variables
```

Everything else is a derived view, not a competing source:

- **DESIGN.md**: human-readable contract and usage rules.
- **Tailwind v4**: consumes tokens through `@theme inline`.
- **CSS Variables**: runtime implementation of the same tokens.
- **Design Tokens**: machine-readable inventory if/when generated, never a fork.
- **Migration Map**: `BUILD-FROM-THIS/DESIGN-SYSTEM-MIGRATION-MAP.md` defines sequencing, ownership, and gates for consolidating the implementation. It is an execution plan, not a second design contract.

If those views disagree, `DESIGN-SYSTEM.md` and the `:root` token block in `index.css` win. Do not add a second theme file, duplicate palette, duplicate radius scale, or route-local visual system.

## Token Source

The implementation source is `paperclip/ui/src/index.css`.

Use semantic THEFT tokens first:

- colors: `--theft-color-*`, `--theft-ink`, `--theft-panel`, `--theft-signal`;
- spacing: `--theft-space-unit` plus `--theft-space-1` through `--theft-space-8`;
- layout: screen-specific tokens such as `--theft-rail-width`, `--theft-onboarding-*`, `--theft-tech-tree-*`;
- typography: `--font-sana-sans`, `--font-sana-serif`, `--text-micro`, `--text-nano`, `--text-badge`;
- radius/shadow: `--theft-radius-surface`, `--theft-radius-control`, `--theft-shadow-soft`.

## 8px Grid Rule

New product surfaces should be built on the 8px grid. Use THEFT spacing tokens for layout, panel widths, rails, canvas sizes, map nodes, gutters, and major component padding. If a new value is needed, add a named semantic token in `index.css` before using it in a component.

## Density Rule

Keep the browser/root font size at normal readable scale. Do not simulate 75% browser zoom by shrinking `html`; it makes controls, icons, and text too small. Achieve compact desktop density through semantic layout tokens, measured column widths, shorter panels, and controlled spacing.

## Component Rules

- Use existing shadcn/ui primitives first for standard controls and surfaces: `Button`, `Card`, `Input`, `Textarea`, `Tabs`, `Select`, `Sheet`, `Dialog`, `DropdownMenu`, `Tooltip`, `Badge`, `Separator`, and `ScrollArea`.
- THEFT-specific styling should wrap shadcn primitives with semantic screen templates and tokens. Do not hand-build a new button, card, tab bar, dialog, input, or sheet when a shadcn primitive exists.
- Radius standard: surfaces/cards use `--theft-radius-surface` / `rounded-lg`; controls use `--theft-radius-control` / `rounded-md`; small nested affordances use `rounded-sm`; `rounded-full` is reserved for avatars, status dots, compact badges, and progress bars.
- Do not add hex colors in TSX. Add or reuse a color token.
- Do not add arbitrary Tailwind layout values like `grid-cols-[...]`, `min-w-[...]`, `left-[...]`, `tracking-[...]`, or `shadow-[...]` in active product screens.
- Use `.theft-label` and `.theft-label-compact` for uppercase metadata labels.
- Use `.theft-elevation-soft` for soft depth.
- Use screen utilities like `.theft-onboarding-*`, `.theft-map-*`, and `.theft-tech-tree-*` for semantic layout constants.
- System/runtime/admin pages can keep legacy code temporarily, but any touched product surface must move toward this contract.

## Template Rule

Active THEFT product screens should be assembled from shared screen templates, not unique page shells. New or touched routes should reuse the same scroll contract, rail/header/main structure, content widths, panel rhythm, and empty/loading/error states. If a page needs a new layout pattern, add the pattern as a named template or semantic CSS utility first, then consume it from the route.

Use the `300 / 150 / 50` guardrail for maintainability:

- files should trend under 300 lines after the product surface stabilizes;
- render modules should trend under 150 lines;
- functions and hooks should trend under 50 lines.

Existing Paperclip runtime files exceed this and can be paid down incrementally. New THEFT UX work should not deepen that debt.

## Atomic Design Taxonomy

Use Brad Frost's Atomic Design model to inventory and govern the UI:

- **Atoms**: tokens, typography, icons, primitive controls, inputs, labels, badges.
- **Molecules**: stat tile, metadata row, issue row, search/filter row, evidence chip.
- **Organisms**: app rail, header, Operator dock, Library inspector, department work panel.
- **Templates**: launcher, onboarding split canvas/form, workbench, detail/review, settings/admin.
- **Pages**: real routes. Pages compose templates and organisms; they do not create a new design language.

The reusable audit workflow lives in `.agents/skills/atomic-design-system/SKILL.md`.

## Verification

Before committing frontend design work:

```bash
node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs paperclip/ui/src
pnpm -C paperclip --filter @paperclipai/ui typecheck
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --screenshot-dir /private/tmp/theft-ui-check
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --mobile --screenshot-dir /private/tmp/theft-ui-check-mobile
git diff --check
```
