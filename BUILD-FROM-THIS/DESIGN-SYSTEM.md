# THEFT Design System Contract

> Active as of 2026-05-16. This supersedes one-off visual constants in product UI work.

## Current Target

THEFT should read as a clean, white, Sana-style operating workbench: low chrome, quiet hierarchy, black/gray typography, and one strong lime signal color for primary action/state. The 099 and command-center renders are structure/density references, not permission to make the active app dark, neon, or dashboard-heavy.

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

## Component Rules

- Do not add hex colors in TSX. Add or reuse a color token.
- Do not add arbitrary Tailwind layout values like `grid-cols-[...]`, `min-w-[...]`, `left-[...]`, `tracking-[...]`, or `shadow-[...]` in active product screens.
- Use `.theft-label` and `.theft-label-compact` for uppercase metadata labels.
- Use `.theft-elevation-soft` for soft depth.
- Use screen utilities like `.theft-onboarding-*`, `.theft-map-*`, and `.theft-tech-tree-*` for semantic layout constants.
- System/runtime/admin pages can keep legacy code temporarily, but any touched product surface must move toward this contract.

## Verification

Before committing frontend design work:

```bash
pnpm -C paperclip --filter @paperclipai/ui typecheck
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --screenshot-dir /private/tmp/theft-ui-check
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --mobile --screenshot-dir /private/tmp/theft-ui-check-mobile
git diff --check
```
