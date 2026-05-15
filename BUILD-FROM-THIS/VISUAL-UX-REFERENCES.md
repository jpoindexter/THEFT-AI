# VISUAL UX REFERENCES - THEFT

> Created 2026-05-15. Updated 2026-05-15 after reviewing `/Users/jasonpoindexter/Desktop/099`. Treat this as product direction, not a pixel spec.

## Core Visual Decision

THEFT should be dark, premium, operational, artifact-first, and visually restrained.

The 2026-05-15 099 pass supersedes the earlier warm-white and cthdrl visual skins. The target is a black/white/gray digital workbench: mono type, explicit borders, 10px interactive radii, no neon, no glow, no chromatic department palette. It should feel like a serious local software workbench, not a generic agent admin dashboard and not a sci-fi HUD.

## Reference Inputs

| Reference | What It Contributes | What To Use In THEFT | What To Avoid |
|---|---|---|---|
| 099 tokens in `/Users/jasonpoindexter/Desktop/099` | Black/white/gray terminal workbench, mono type, 10px interactive radii, explicit borders, no shadows, no chromatic decoration | Final visual skin: black page, white primary text, steel-gray panels, muted gray borders, dim-gray secondary text, serious local workbench tone | Neon lime/purple/cyan accents, sci-fi HUD styling, glow, gradients, decorative command-center effects |
| cthdrl references in `/Users/jasonpoindexter/Desktop/cthdrl` | Black full-bleed shell, sharp panels, mono operational rhythm, dense operating-canvas mood | IA mood only: dark shell, canvas discipline, compact operations layout | Electric lime/purple/cyan palette, decorative brand-kit layouts, negative letter spacing, illegible low-contrast labels |
| MagicPath frames in `magic patch frames/` | Prompt-to-canvas creation, persistent left thread, parallel generation, artifact selection, libraries, share/publish | Interaction model: ask, route, generate, review, artifact appears on canvas/Library | Copying green brand, Figma-like design-tool framing, empty canvas with no business affordances |
| Desktop references in `/Users/jasonpoindexter/Desktop/theft ai` | Light map/canvas systems, dense SaaS panels, premium dashboard cards, flow graphs, black diagnostic maps | Spatial canvas structure, high-density cards, graph relationships, polished operating surfaces | Letting warm-white cards fight the dark cthdrl shell |
| Strategy-interface reference image | Mission control, strategy games, executive cockpit, OSINT maps, decision panels, constraints, next move | Information architecture: Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move | Treating it as decoration or turning the app into static KPI reporting |
| Sana product page | Bright enterprise AI positioning, all-in-one work platform, agents for real work, broad team use cases | Tone: clean, credible, company-wide AI operating layer | Marketing page layout as app UI, generic "AI agents for every team" copy |

Sana source inspected: `https://sanalabs.com/products/sana/`

## MagicPath UX Findings

MagicPath matters because it shows the product loop THEFT needs:

1. User starts from files/workspace, not runtime setup.
2. User enters a goal in a persistent left-side thread.
3. The main surface is a canvas where outputs appear.
4. The system turns one prompt into a plan.
5. Multiple agents/workers generate artifacts in parallel.
6. The generated output becomes selectable, inspectable, shareable work.
7. Libraries/components/design systems sit beside the work as reusable memory.

For THEFT, translate this as:

- Files -> Company Library
- Design prompt -> Operator command
- Designers/builders -> departments
- Screens -> business artifacts
- Components/libraries -> company memory, brand system, reusable operating assets
- Share -> approve, export, publish, hand off

The key lesson: agents are visible as collaborators, but the product is the artifact being created.

## Desktop Reference Findings

The Desktop folder contains a mixed visual board:

- White/gray map interfaces with precise pins, side panels, and operational overlays.
- Warm SaaS dashboard surfaces with dense cards and readable metrics.
- Premium product mockups with thin borders, soft depth, and restrained typography.
- Dark network/graph/data-flow diagrams that feel powerful but too heavy for the default shell.
- A THEFT-specific dark moodboard saying the product should not be a dashboard.

What to carry forward:

- Large spatial surface with a left command/control panel.
- Subtle grid/map/canvas background only when it helps orientation.
- Dense but calm cards for tasks, artifacts, decisions, and department status.
- Small, precise controls instead of oversized marketing UI.
- Real work previews in the first viewport.
- A sense of "operating system" through panels, relationships, ownership, and status.

What to reject:

- Pure dashboard KPI pages as the home screen.
- One-note dark command-center styling.
- Decorative sci-fi visuals that hide the work.
- Generic agent admin tabs as the main product.

## 099 Visual Direction

The 099 folder is now the strongest visual reference for the application skin:

- Black page background.
- White primary text.
- Steel-gray panels and inputs.
- Muted gray borders and dividers.
- Dim-gray secondary text.
- Mono typography across the interface.
- 10px radius for interactive components.
- No shadows, gradients, glow, or chromatic brand accents.

For THEFT, translate this as:

> "A local company operating workbench where the founder routes work and departments produce visible artifacts."

## cthdrl Visual Direction

The cthdrl folder is still useful for layout mood, but it is no longer the visual skin:

- Black or near-black full-bleed base.
- Dark stacked panels, but not the final sand/ash token set.
- Sharp rectangular panels and precise borders.
- Mono navigation/body rhythm with large stark headings used only where scale is earned.
- Electric lime/purple/cyan signal accents are now rejected for the final style.
- Minimal shadows and no floating-card softness.
- Background grids are allowed only when they clarify relationships; glows are rejected for the final style.

For THEFT, translate this as:

> "A dark company execution room where the founder routes work and departments produce visible artifacts."

## Sana Visual Direction

Sana is useful as a tone reference:

- Bright enterprise product.
- AI as real work acceleration, not chatbot novelty.
- Company-wide platform language.
- Agents collaborate, automate, analyze, act, and find.
- Product credibility comes from restraint, clarity, and integrated work surfaces.

For THEFT, the equivalent tone should be:

> "A local-first company operating system where the founder commands work and departments turn it into durable artifacts."

Use Sana's clean credibility, not its marketing page structure or default light styling.

## Target Product Shell

### Layout

- Mission Control canvas is the primary surface.
- Operator is persistent as a capability but can be collapsed to a dock/input/icon by default.
- Operator expands into a side panel/drawer when the user asks, routes work, reviews recommendations, or explains a decision.
- Center canvas/workspace shows current company work, hierarchy, dependencies, constraints, and outcomes.
- Right contextual inspector only when an artifact, department, task, or roadmap node is selected.
- Top bar with company, stage, environment, share/export, and local runtime health.
- Library and Tech Tree as first-class surfaces, not buried admin tabs.

### Color

Primary direction from 099:

- Black base: `#000000`.
- White primary text: `#ffffff`.
- Steel-gray raised panels and inputs: `#1d1d1d`.
- Muted gray borders/dividers: `#383838`.
- Dim-gray secondary text: `#888888`.
- White filled buttons for primary actions, black text.
- Gray outlined buttons for secondary actions.
- Department ownership uses text/icon/provenance first, not color.

Avoid:

- Warm-white cards inside a dark runtime shell.
- Purple/blue AI gradients.
- Beige-only palette.
- Heavy shadows.
- Neon lime.
- Purple/cyan department palettes.
- Glow or sci-fi HUD effects.

### Density

THEFT should feel like a real work tool:

- Compact navigation.
- Scannable task rows.
- Clear artifact previews.
- More information than a landing page, less noise than an admin console.
- Status chips and counters where they help action.

### Motion And State

Use motion to show work happening:

- Departments move from planned -> running -> review -> done.
- Artifacts appear on the canvas as work completes.
- Operator messages should stream concise plan/status updates.
- Avoid theatrical loading. The user should always know what is being built and who owns it.

## Product Pattern To Build Toward

The ideal happy path:

1. Founder opens THEFT.
2. Operator asks what needs to be built or fixed.
3. User gives a business goal.
4. THEFT creates a visible plan with departments and expected artifacts.
5. Department workstreams appear on the canvas.
6. Library artifacts materialize as each department finishes.
7. User reviews, approves, exports, or asks for a revision.
8. Mission Control surfaces the next move with constraints and rationale.
9. Tech Tree updates with evidence from completed work.

This is the MagicPath loop applied to a company operating system.

## Implementation Impact

Immediate UI work should shift from "make each Paperclip page nicer" to "make THEFT feel like one creation workspace":

- Keep Paperclip runtime surfaces behind Admin/Diagnostics.
- Rebuild Command Center as Mission Control: objective, constraints, strategy map, decisions, execution state, outcomes, and next move.
- Streamline the interface without removing runtime features.
- Reframe Goals/GoalDetail as Tech Tree nodes with evidence and next action.
- Start the next pass by making Mission Control more strategy-map-like and less dashboard-like.
- Build artifact previews and selected-object inspection into Library/Task Review.
- Use departments as parallel work lanes, not agent cards.
