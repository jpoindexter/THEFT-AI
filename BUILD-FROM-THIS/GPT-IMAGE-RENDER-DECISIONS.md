# GPT IMAGE RENDER DECISIONS - MISSION CONTROL

> Created 2026-05-15 after reviewing `/Users/jasonpoindexter/Desktop/theft ai_`.
> Updated 2026-05-15 after reviewing `/Users/jasonpoindexter/Desktop/099`.
> These renders are information-architecture references, not the final visual style.

## Verdict

Use this render set for layout, screen structure, and product hierarchy.

Do **not** use this render set as the final visual skin. The style is too sci-fi/HUD: neon lime, purple/cyan signal accents, glowing controls, and cyber-command-center density. The final style target is `STYLE-TARGET-099.md`.

The strongest direction is clear:

- THEFT is a mission-control operating surface, not an admin dashboard.
- The product center is the chain: Objective -> Constraints -> Options -> Decisions -> Execution -> Outcomes -> Next Move.
- Operator persists as a dock/drawer, not a full-time chat app.
- Paperclip/runtime concepts stay available through System, diagnostics, and advanced controls.
- The app should feel dense, dark, operational, and action-oriented, but visually restrained in the 099 digital-workbench style.

## Structure Reference Renders

Use these files as implementation references for hierarchy and behavior:

| Screen | File | Decision |
|---|---|---|
| Mission Control, Operator collapsed | `ChatGPT Image May 15, 2026, 09_00_46 PM.png` | Primary desktop landing-page reference. Build this first. |
| Mission Control, Operator expanded | `ChatGPT Image May 15, 2026, 09_00_51 PM.png` | Canonical Operator drawer/dock behavior. Canvas remains primary. |
| Tech Tree / Strategy Map | `ChatGPT Image May 15, 2026, 09_00_55 PM.png` | Best model for build-order roadmap: columns, dependencies, evidence, selected-node inspector. |
| Tasks / Needs Action | `ChatGPT Image May 15, 2026, 09_01_00 PM.png` | Use as the founder review queue, not a generic task tracker. |
| Task Review | `ChatGPT Image May 15, 2026, 09_01_04 PM.png` | Use output/evidence first, decision panel second, diagnostics collapsed. |
| Department Workspace | `ChatGPT Image May 15, 2026, 09_01_09 PM.png` | Use as department lane pattern: mission, active work, blocked/review, outputs, context, skills secondary. |
| Library / Outcomes | `ChatGPT Image May 15, 2026, 09_01_14 PM.png` | Use artifact grid plus right preview/inspector. |
| System / Diagnostics | `ChatGPT Image May 15, 2026, 09_01_23 PM.png` | Use as the runtime/admin containment pattern. |
| Mobile Mission Control | `ChatGPT Image May 15, 2026, 09_01_27 PM.png` | Use as mobile information hierarchy. |
| Review Mode | `ChatGPT Image May 15, 2026, 09_01_57 PM.png` | Use as batch decision cockpit after the core task review flow exists. |

Supporting references:

- `09_00_10 PM.png` for local entry.
- `09_00_29 PM.png`, `09_00_35 PM.png`, and `09_00_41 PM.png` for onboarding and company assembly.
- `09_01_44 PM.png` and `09_01_52 PM.png` for fresh-company empty state. Prefer `09_01_44 PM.png` structure; borrow the bigger first-outcome emphasis from `09_01_52 PM.png`.

## Locked Product Shell

Implement the screens around one consistent shell:

- left navigation: Mission Control, Tasks, Library, Tech Tree, Departments, System;
- top context bar: current surface, company switcher, runtime health, focus mode, menu;
- center: the actual work surface, usually a canvas/map/table/artifact preview;
- right side: contextual inspector or expanded Operator;
- bottom: compact local-runtime strip plus collapsed Operator dock;
- mobile: bottom navigation with Operator as the center action.

The shell should not expose Projects, Agents, Costs, Activity, model settings, or raw runtime logs as primary navigation. Those belong inside System, command palette, direct routes, or collapsed diagnostics.

## Visual Style Override

Apply the 099 style target to every screen:

- black page background `#000000`;
- white primary text `#ffffff`;
- gray panel/input surface `#1d1d1d`;
- gray borders/dividers `#383838`;
- secondary text `#888888`;
- mono typography everywhere;
- 10px radius on interactive components;
- no glow, no gradients, no neon, no chromatic department palette.

Use white/gray hierarchy instead of lime highlights. If functional status color is necessary, keep it tiny and local.

## Component Patterns To Build

1. **Mission Objective Header**
   - Shows current objective, success signal, and objective details.
   - Replaces generic company summary cards.

2. **Constraint Strip**
   - Blocked decisions, customer risk, runway, missing proof.
   - Must make bottlenecks impossible to miss.

3. **Strategy Map**
   - Objective -> workstreams -> departments -> tasks -> Library artifacts.
   - This is the main Mission Control canvas.

4. **Decision Panel**
   - Pending/recommended decisions with impact, risk, owner, and action.
   - Decisions are a first-class workflow, not buried comments.

5. **Execution State By Outcome**
   - Department progress should describe outcomes, not activity volume.

6. **Outcomes / Evidence**
   - Latest Library artifacts and proof signals.
   - Artifacts should always connect back to source task and owner department.

7. **Next Move**
   - One recommended action with rationale and a primary action.
   - This answers "what should I do next?"

8. **Operator Dock / Drawer**
   - Collapsed by default on desktop.
   - Expanded drawer explains recommendation, evidence, tradeoffs, and proposed tasks.
   - Never replaces the canvas as the default product.

9. **Diagnostics Collapse**
   - Runtime timeline, adapter, model, logs, and cost details are collapsed.
   - Advanced details should be available without dominating founder workflows.

## Drift To Avoid

Do not copy these render artifacts directly:

- placeholder companies like `Acme` unless seeded data truly says that;
- the phrase `AI cofounder`; use `Operator`;
- neon lime primary actions or selected states;
- purple/cyan/yellow department palettes;
- HUD glow, sci-fi crosshairs, or decorative command-center effects;
- too-small text that only works in a static image;
- exact fake timestamps/dates/resource values;
- every bottom runtime metric on mobile;
- overly dense onboarding maps before the user has enough context;
- decorative icons that do not map to real actions;
- any implied cloud/billing/model setup on the happy path.

Also avoid returning to the previous confusing state:

- no visible agent roster in primary navigation;
- no task detail page led by raw chat logs;
- no dashboard made of unrelated cards;
- no Tech Tree as a mostly empty goals list;
- no Library as a decorative file list without provenance/evidence;
- no System/admin pages mixed into the founder workflow.

## Implementation Order

1. Rebuild `/dashboard` into Mission Control using the structure of `09_00_46 PM.png` and the style of `STYLE-TARGET-099.md`.
2. Add the persistent Operator dock and expanded drawer using the behavior of `09_00_51 PM.png` and the 099 terminal-workbench skin.
3. Rework Task Review to match the output-first hierarchy of `09_01_04 PM.png`, with diagnostics collapsed and 099 visual treatment.
4. Rework Tasks/Attention around the Needs Action queue from `09_01_00 PM.png`, without Jira-like clutter or neon states.
5. Rework Tech Tree into the build-order strategy map from `09_00_55 PM.png`, using gray/white dependency lines and restrained selected states.
6. Rework Library and Department Workspace using `09_01_14 PM.png` and `09_01_09 PM.png`, with artifact provenance and secondary capability panels.
7. Contain runtime/admin under System using `09_01_23 PM.png`, styled as local configuration rather than sci-fi diagnostics.
8. Add mobile Mission Control hierarchy from `09_01_27 PM.png`, stripping unnecessary bottom runtime metrics.
9. Add Review Mode from `09_01_57 PM.png` after task review and Library provenance are solid.

## Acceptance Criteria

A screen is on direction only if:

- the first viewport answers what matters now and what to do next;
- the visual center is a map, queue, artifact, or decision surface, not admin chrome;
- Operator is present but not dominant by default;
- every output points to an owner, source task, and Library artifact;
- runtime/admin controls are reachable but secondary;
- the UI uses the 099 black/white/gray token system across all product pages;
- mobile keeps the same hierarchy instead of collapsing into a generic list.
