---
name: web-design-guidelines
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

# Web Design Guidelines

A comprehensive guide for building beautiful, performant, and accessible web interfaces.

## Overview

This skill provides guidelines for:
- Design thinking and philosophy
- Animation and motion design
- Component patterns and best practices
- Performance and accessibility

## Companion skills

When the task is a visually important page or site and the agent needs stronger
restraint, thesis, or taste-level judgment, pair this skill with
[`taste-first-frontend`](../taste-first-frontend/SKILL.md).

- Use `web-design-guidelines` for design-language discovery, template
  selection, motion/accessibility craft, and implementation detail.
- Use `taste-first-frontend` for thesis formation, explicit design judgments,
  anti-abundance discipline, and "does this actually hold?" checks.
- Use `shader-authoring` when the visual direction needs GLSL/WebGL, procedural
  backgrounds, ray marching, particles, SDF shapes, or shader-led interactive
  atmosphere in a website or HTML artifact.

## File Structure

| File | Description |
|------|-------------|
| [design-thinking.md](./design-thinking.md) | Core design philosophy and principles |
| [animation-motion.md](./animation-motion.md) | Animation and motion guidelines |
| [components-patterns.md](./components-patterns.md) | Component building patterns |
| [performance-accessibility.md](./performance-accessibility.md) | Performance and accessibility guidelines |
| [`annotation-templates/`](./annotation-templates/) | JSON design-language library plus the schema for matching user intent to a visual direction |

## Design Context

Before selecting templates or writing UI code, check for first-party design
context and read any file that exists:

1. `/workspace/work/artifacts/DESIGN.md`
2. `/workspace/library/design/DESIGN.md`
3. `/workspace/repo/DESIGN.md` or `/workspace/repo/artifacts/DESIGN.md`

Use the first-party `DESIGN.md` as higher-priority source material than the
generic guideline files or annotation templates. Carry its color roles,
typography, spacing, component treatment, page rhythm, interaction tone, and
explicit "do not do" constraints into the implementation. Use annotation
templates to fill gaps or sharpen direction, not to override a concrete
`DESIGN.md`.

If no `DESIGN.md` exists, or it is too incomplete to guide the work, state that
briefly and continue from the repository's existing design system plus the
annotation-template flow below.

## Annotation Templates

When building out a site, start by reading the files in [`annotation-templates/`](./annotation-templates/). Use them to translate the user's product idea into a concrete design language before you write layout, styling, or component code.

- Resolve the installed template directory relative to this skill. The templates live in `annotation-templates/` beside this `SKILL.md`; do not search `/workspace` alone or rely on baked skill mirrors. If the directory is missing from the injected skill, report that as a skill provisioning blocker instead of continuing without the templates.
- Start with [`annotation-templates/design-annotation-schema.json`](./annotation-templates/design-annotation-schema.json) or `design-annotation-schema.json` from the resolved directory to understand the fields.
- Scan the template files for close matches on `vibes.tags`, `vibes.mood`, `vibes.axes`, and `meta`.
- Read the closest matching template JSON files directly from the folder and extract the signals that should shape the build.
- Use the closest template(s) to decide the app's tone, palette direction, typography character, spacing density, motion style, and overall visual posture before writing code.
- Treat the templates as a design-language reference library, not a mandate to copy a single example literally.

## Design Thinking (from Claude Code)

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth. Add contextual effects and textures: gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.
