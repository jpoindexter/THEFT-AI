---
name: theft-ui-design
description: Use for THEFT product UI/UX work, visual design passes, layout simplification, typography/color/radius decisions, screenshot review, or matching the Sana-style reference direction. Always use before changing Paperclip/THEFT frontend screens, navigation, command/chat surfaces, dashboards, or design tokens.
metadata:
  short-description: THEFT UI design direction
---

# THEFT UI Design

## Required Workflow

1. Read active product docs before substantial work:
   - `BUILD-FROM-THIS/SOURCE-OF-TRUTH.md`
   - `BUILD-FROM-THIS/PARITY-DELTA.md`
   - `BUILD-FROM-THIS/ROADMAP.md`
   - `BUILD-FROM-THIS/TASKS.md`
2. Use `paperclip/` as the runtime/UI host. Do not build active product work in `app/`.
3. Treat THEFT as a streamlined workbench, not an agent admin dashboard.
4. Preserve runtime capability, but keep runtime/admin/system surfaces secondary and hidden behind system/settings affordances when possible.
5. Verify with typecheck and screenshot or route smoke before committing.

## Visual Direction

Primary reference: Sana-style clean workbench.

Reference files:
- `/Users/jasonpoindexter/Desktop/sans/DESIGN.md`
- `/Users/jasonpoindexter/Desktop/sans/theme.css`
- `/Users/jasonpoindexter/Desktop/sans/variables.css`
- `/Users/jasonpoindexter/Desktop/sans/tokens.json`

Use these only as needed, not all at once. Prefer `DESIGN.md` for design decisions and `tokens.json` or CSS files for exact values.

## Core Rules

- Background: white or near-white, spacious, low chrome.
- Typography: Sana Sans style for UI; serif only for true display/hero moments.
- Color: restrained black/white/gray with one strong accent only when action needs emphasis.
- Radius: keep product cards and panels soft, not bubbly. Use medium radii for surfaces; reserve full pills for compact buttons, avatars, and icon controls.
- Navigation: slim icon rail; no scrolling list of admin tools. Put system/runtime/admin under one settings/system affordance.
- Main experience: chat/operator intent on one side or collapsed; artifact/work surface is the primary product object.
- Density: desktop should feel like browser zoom around 75%; mobile should stay readable at normal scale.
- Avoid: dark terminal UI, neon command-center styling, huge rounded panels everywhere, visible admin taxonomy as the primary IA.

## Verification

Minimum for frontend design changes:

```bash
pnpm -C paperclip --filter @paperclipai/ui typecheck
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --company-prefix THEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA --screenshot-dir /private/tmp/theft-ui-check
git diff --check
```

Use mobile smoke too when navigation, layout, or responsive CSS changes.
