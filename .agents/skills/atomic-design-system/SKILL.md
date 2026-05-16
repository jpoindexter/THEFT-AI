---
name: atomic-design-system
description: Audit, create, consolidate, or launch a repo-wide design system using Brad Frost's Atomic Design model, design-token governance, component inventory, visual QA, and migration gates. Use when the user asks for one design system, style unification, design-system audits, hardcoded style cleanup, shadcn/token consolidation, atomic components, or repo-wide UI consistency.
metadata:
  short-description: Atomic design system audit and migration
---

# Atomic Design System

Use this skill to turn a messy UI codebase into one governed design system. The default taxonomy is Brad Frost's Atomic Design:

- **Atoms**: tokens, typography, icons, primitive controls, inputs, labels, badges.
- **Molecules**: composed controls such as search bars, stat tiles, nav items, form rows, issue rows.
- **Organisms**: reusable product sections such as side rails, headers, Operator trays, Library inspectors, task panels.
- **Templates**: route-level layout contracts: launcher, split canvas/form, workbench, detail/review, settings/admin.
- **Pages**: real routes populated with product data. Pages should compose templates/organisms, not invent styling.

## Workflow

1. **Load Product Rules**
   - For THEFT/Paperclip UI, read `BUILD-FROM-THIS/DESIGN-SYSTEM.md` and use `theft-ui-design` first.
   - If substantial architecture changes are needed, use `improve-codebase-architecture` too.

2. **Audit First**
   - Run a repo/product inventory scanner:

     ```bash
     node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs paperclip/ui/src
     ```

   - For the active THEFT MVP route gate, scan only active route seeds and their local static imports:

     ```bash
     node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs --active-routes
     ```

   - Also inspect key design files manually: global CSS, shadcn primitives, route shells, component directories, and active MVP routes.
   - Classify findings by atomic layer and by severity:
     - `blocker`: visible inconsistency on active product routes or no single source of truth.
     - `high`: hardcoded color/radius/layout in reusable components or product pages.
     - `medium`: legacy/admin/lab styling that should be isolated.
     - `low`: tests, fixtures, generated assets, or dynamic user/project color values.

3. **Define One Public Interface**
   - Pick one token/component interface. For THEFT, use shadcn/ui token names and shadcn primitives as the public interface.
   - Put product values behind that interface: CSS variables in `index.css`, semantic utilities, and primitive variants.
   - No competing theme roots, duplicate button/card implementations, or route-local visual systems.

4. **Build The Atomic Inventory**
   - **Atoms**: color, type, radius, spacing, elevation, icon size, Button, Input, Textarea, Badge, Card, Tabs.
   - **Molecules**: stat tile, metadata label, item row, empty state, search/filter row, action chip, evidence chip.
   - **Organisms**: app rail, top header, Operator dock/drawer, task review panel, Library inspector, department work panel.
   - **Templates**: launcher, onboarding split canvas/form, workbench, detail/review, settings/admin.
   - **Pages**: map each route to a template and list exceptions.

5. **Migrate In Slices**
   - Start with active product routes, then shared components, then admin/runtime, then labs/archive.
   - Replace hardcoded values with tokens or variants.
   - Replace custom controls with shadcn primitives.
   - Move repeated class strings into semantic utilities or reusable modules.
   - Preserve runtime behavior. Design-system migration should not remove features.

6. **Launch Gates**
   - No active product route with arbitrary radius (`rounded-[...]`, `rounded-none`) unless explicitly documented.
   - No active product TSX with hardcoded colors except user/project data.
   - No page-specific scroll contract when a template can own it.
   - New UI follows the 300 / 150 / 50 guardrail where practical.
   - Typecheck passes, route smoke passes, and screenshots show no overflow or obvious visual drift.
   - Use the active-route scanner as a no-new-drift gate during migration. Create a baseline before cleanup, then fail only when counts increase:

     ```bash
     node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs --active-routes --write-baseline /private/tmp/theft-design-baseline.json
     node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs --active-routes --baseline /private/tmp/theft-design-baseline.json
     ```

## Deliverables

For an audit-only request, return:

- current source of truth;
- inventory by atomic layer;
- hardcoded style findings with file paths;
- active-route risks;
- migration order;
- verification gates.

For an implementation request, produce:

- updated design-system contract/docs;
- token/primitive/template changes;
- cleanup patches;
- scanner or lint gate updates;
- verification results;
- local commit and tag when the user has requested checkpointing.

## Scanner Notes

The bundled scanner is intentionally conservative. It finds likely issues, not final truth. Always review matches before editing. Treat user/project-defined colors, tests, fixtures, generated code, and lab routes as lower priority unless they leak into active product UI.

Useful flags:

- `--active-routes`: focus on THEFT MVP route files plus local static imports.
- `--json`: produce machine-readable output for agents or CI.
- `--max-findings <n>`: keep text output readable.
- `--write-baseline <file>`: save current counts for no-new-drift gating.
- `--baseline <file>`: fail if current counts exceed the baseline.
- `--fail-on <severity>`: fail if any finding exists at or above `info`, `low`, `medium`, `high`, or `blocker`.

The active-route mode is a focused gate, not a substitute for periodic repo-wide audits. Use both: active-route gate for every design-system migration slice, repo-wide audit for planning and debt tracking.
