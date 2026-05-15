# VISUAL UX REFERENCES - THEFT

> Created 2026-05-15. This documents the MagicPath frame review, the local visual references in `/Users/jasonpoindexter/Desktop/theft ai`, and the Sana visual direction. Treat this as product direction, not a pixel spec.

## Core Visual Decision

THEFT should be light, premium, operational, and artifact-first.

The target is closer to a warm-white enterprise creation workspace than a dark agent console. Dark/black treatments can appear in diagnostics, graph maps, or presentation artifacts, but the primary product shell should stay bright, calm, and usable for repeated daily work.

## Reference Inputs

| Reference | What It Contributes | What To Use In THEFT | What To Avoid |
|---|---|---|---|
| MagicPath frames in `magic patch frames/` | Prompt-to-canvas creation, persistent left thread, parallel generation, artifact selection, libraries, share/publish | Interaction model: ask, route, generate, review, artifact appears on canvas/Library | Copying green brand, Figma-like design-tool framing, empty canvas with no business affordances |
| Desktop references in `/Users/jasonpoindexter/Desktop/theft ai` | Light map/canvas systems, dense SaaS panels, premium dashboard cards, flow graphs, black diagnostic maps | Visual vocabulary: white/cream surfaces, thin borders, high-density cards, graph/canvas structure, polished operating surfaces | Overly futuristic dark UI as default, decorative mockups that do not help users act |
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

## Sana Visual Direction

Sana is useful as a tone reference:

- Bright enterprise product.
- AI as real work acceleration, not chatbot novelty.
- Company-wide platform language.
- Agents collaborate, automate, analyze, act, and find.
- Product credibility comes from restraint, clarity, and integrated work surfaces.

For THEFT, the equivalent tone should be:

> "A local-first company operating system where the founder commands work and departments turn it into durable artifacts."

Use Sana's clean credibility, not its marketing page structure.

## Target Product Shell

### Layout

- Left persistent Operator thread.
- Center canvas/workspace for current company work.
- Right contextual inspector only when an artifact, department, task, or roadmap node is selected.
- Top bar with company, stage, environment, share/export, and local runtime health.
- Library and Tech Tree as first-class surfaces, not buried admin tabs.

### Color

Primary direction:

- Warm white / soft cream base.
- Off-white panels.
- Thin neutral borders.
- Charcoal text.
- Muted green or acid-lime accent used sparingly for primary action and live status.
- Department colors only as small ownership markers, not broad panel backgrounds.

Avoid:

- Full dark app shell as default.
- Purple/blue AI gradients.
- Beige-only palette.
- Heavy shadows.
- Neon everywhere.

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
8. Tech Tree updates with evidence from completed work.

This is the MagicPath loop applied to a company operating system.

## Implementation Impact

Immediate UI work should shift from "make each Paperclip page nicer" to "make THEFT feel like one creation workspace":

- Keep Paperclip runtime surfaces behind Admin/Diagnostics.
- Reframe Goals/GoalDetail as Tech Tree nodes with evidence and next action.
- Start the next polish pass by making Command Center more canvas-like and less page-like.
- Build artifact previews and selected-object inspection into Library/Task Review.
- Use departments as parallel work lanes, not agent cards.

