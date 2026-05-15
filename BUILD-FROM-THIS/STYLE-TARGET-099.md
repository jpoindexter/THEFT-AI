# STYLE TARGET - 099 DIGITAL WORKBENCH

> Created 2026-05-15 from `/Users/jasonpoindexter/Desktop/099`.
> This is the visual style target for THEFT. Use GPT Image renders for information architecture, but use 099 for the skin.

## Verdict

THEFT should use the 099 style direction:

- terminal-like digital workbench;
- dark, stark, highly organized;
- almost entirely achromatic;
- mono typography everywhere;
- clear panels, generous spacing, no decorative glow;
- depth through black/gray surfaces and explicit borders, not shadows.

This corrects the GPT render drift. The renders have useful layouts, but their neon lime, purple/cyan department colors, sci-fi/HUD feel, and dense glowing controls are too much.

## Core Tokens

Use these as the product-level visual primitives:

| Role | Value | Use |
|---|---:|---|
| Page background | `#000000` | App background and deepest canvas. |
| Primary text | `#ffffff` | Main labels, page titles, primary icons, primary button text on dark. |
| Panel/input background | `#1d1d1d` | Cards, selected nav, inputs, secondary panels. |
| Border/divider | `#383838` | Panel borders, separators, ghost buttons. |
| Secondary text | `#888888` | Metadata, helper copy, subdued labels. |

Typography:

- `Soehne Mono`, fallback `Space Mono`, `Fira Code`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace`;
- default size `16px`;
- weight `400`;
- line-height `1.2` for compact UI and `1.4` for paragraphs;
- letter spacing should stay subtle. Do not make the UI look spaced-out or poster-like.

Shape and spacing:

- radius `10px` for interactive panels, inputs, cards, and buttons;
- radius `0px` for page sections and structural layout;
- spacing scale: `4px` base, common gaps `16px`, larger panel padding around `26px`;
- no box shadows;
- no blurred glass panels;
- no gradient hero areas;
- no decorative blobs, glows, or sci-fi overlays.

## Color Rules

Default rule: **achromatic first**.

Allowed:

- black, white, and gray tokens above;
- one restrained signal state only when functionally necessary, such as error/warning/success;
- if a signal color is necessary, keep it minimal: small dot, status text, or thin indicator.

Avoid:

- neon lime as a brand color;
- purple/cyan department coloring;
- multi-color progress bars;
- glowing active states;
- HUD-style scanlines, crosshairs, or sci-fi targeting marks;
- saturated gradients.

The previous lime accent should be replaced by stronger white text, white borders, filled white buttons, selected gray panels, or minimal status indicators.

## Component Rules

Primary action:

- high-contrast white filled button;
- black text;
- 10px radius;
- no glow.

Secondary action:

- transparent background;
- `#383838` border;
- white text;
- 10px radius.

Selected state:

- `#1d1d1d` surface;
- white text;
- optional 1px `#383838` border.

Panel:

- background `#000000` or `#1d1d1d`;
- 1px `#383838` border where separation is needed;
- 10px radius only for contained components;
- no nested-card pileup.

Input:

- background `#1d1d1d`;
- white text;
- gray placeholder;
- no colored focus glow.

Navigation:

- text-first;
- selected item uses gray fill or white outline;
- do not use loud color rails.

## Applying 099 To Mission Control

The Mission Control structure still holds:

Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move.

But visually:

- strategy maps should use thin gray/white lines, not neon dependency lines;
- departments can use icons and labels, but not saturated color badges;
- selected nodes should use white outline or gray fill, not lime glow;
- risk/priority should use text and hierarchy first, color second;
- Operator should look like a terminal workbench panel, not a chat product with glowing controls;
- System/Diagnostics should feel like local runtime configuration, not a cyberpunk control room.

## Prompt Patch For Future Image Runs

Replace any prompt language like:

- `acid-lime accent`;
- `purple/cyan signal accents`;
- `sci-fi UI`;
- `HUD`;
- `glow`;
- `neon`;
- `military command center`.

With:

- `099-style dark digital workbench`;
- `strict black/white/gray palette`;
- `Soehne Mono-style monospace typography`;
- `10px rounded interactive elements`;
- `white primary buttons, gray outlined secondary buttons`;
- `no chromatic accents except minimal functional status indicators`;
- `no glow, no gradients, no decorative sci-fi effects`.

## Acceptance Criteria

A screen matches the visual target when:

- it reads as a serious local software workbench;
- it uses mostly black, white, and gray;
- it remains readable at real app sizes, not just in a static render;
- the layout is dense but calm;
- the hierarchy is carried by spacing, type, borders, and surface values;
- it still answers "what should I do next?" without relying on bright color.
