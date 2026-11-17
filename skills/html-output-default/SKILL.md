---
name: html-output-default
description: Use when producing founder-facing research, strategy, product, planning, audit, or review output in THEFT Kit. Default to a polished standalone HTML artifact instead of plain Markdown when the user asks for an output, report, brief, packet, teardown, plan, PRD, dashboard, or summary.
---

# HTML Output Default

## Overview

THEFT Kit output should usually be a polished standalone HTML artifact, not a wall of Markdown.

Use this skill when the user asks for a report, brief, PRD, strategy packet, product teardown, repo audit, workflow map, launch plan, review, or summary. The goal is to make every deliverable feel like something Jason can open, scan, save, and show.

This does not mean every chat reply must be HTML. It means durable user-facing output should be saved as an `.html` file by default unless the user explicitly asks for Markdown, JSON, code, CSV, or another format.

## When to Use

Use this skill for:

- PRDs and product packets
- research reports and opportunity briefs
- repo/code reuse audits
- strategy recommendations
- workflow maps
- launch plans
- decision briefs
- visual dashboards
- founder/operator summaries
- artifact bundles where Jason will review or reuse the output later

Do not use this skill for:

- quick conversational answers
- code files
- config files
- machine-readable JSON/YAML/CSV
- Markdown documents meant for Roughdraft review
- README files that must stay Markdown
- cases where the user explicitly requests a different format

## Default Output Contract

When a durable output is requested:

1. Create a standalone `.html` file inside the approved workspace.
2. Use inline CSS so the artifact opens without a build step.
3. Make the page scannable, opinionated, and visually structured.
4. Include a clear verdict or recommendation near the top.
5. Use cards, sections, grids, callouts, timelines, tables, or scorecards instead of long prose blocks.
6. Preserve source paths, evidence, and caveats where relevant.
7. Avoid external fonts, external scripts, CDNs, analytics, or remote assets unless explicitly approved.
8. Do not delete or overwrite existing files without explicit approval.

## Visual Standard

HTML artifacts should feel deliberate, not generic.

Prefer:

- strong headline and thesis
- dark founder/operator cockpit aesthetic when no other brand direction exists
- restrained accent color
- high contrast
- clear hierarchy
- monospaced path/code treatment
- cards for decision units
- concise bullets
- visible risks/cautions
- timeline or next-action blocks

Avoid:

- plain exported Markdown with default browser styling
- generic purple AI gradients
- stock SaaS hero clichés
- excessive animation
- remote dependencies
- unreadable low-contrast text
- decorative complexity that weakens the recommendation

## Structure Pattern

A strong THEFT Kit HTML artifact usually has:

1. Header
   - eyebrow/context
   - strong headline
   - one-paragraph thesis
   - verdict or metric card

2. Recommendation
   - single best move
   - why
   - what not to do

3. Evidence / Findings
   - cards, tables, or ranked list
   - source paths or citations
   - caveats

4. Execution Plan
   - phases or timeline
   - immediate next action
   - owner or approval gates if relevant

5. Footer
   - generated artifact note
   - safety note if no files were overwritten/deleted

## Safety Rules

- Stay inside the approved folder or repo path.
- If no target folder is provided, ask or choose a clearly relevant approved workspace from current context.
- Prefer creating a new file with a descriptive non-colliding name.
- If the target filename exists, ask before overwriting or create a timestamped sibling.
- Do not move, delete, rename, or clean up adjacent files.
- Do not scan unrelated folders unless the user approved that scope.

## Naming Convention

Use lowercase kebab-case filenames:

- `repo-reuse-audit.html`
- `opportunity-brief.html`
- `launch-plan.html`
- `prd-overview.html`
- `workflow-map.html`
- `decision-brief.html`

For iterative outputs, use a date or timestamp suffix only when needed to avoid overwrites.

## Common Pitfalls

1. **Dumping Markdown into HTML.** Convert the content into a designed artifact with hierarchy and cards.
2. **Overbuilding the page.** Static HTML with inline CSS is enough unless the user asks for interactivity.
3. **Forgetting the recommendation.** The artifact should make the decision obvious.
4. **Using external dependencies.** Keep artifacts portable and local-first.
5. **Overwriting old artifacts.** Create a new file or ask first.
6. **Making everything HTML.** Quick chat answers, code, configs, and Roughdraft docs are exceptions.

## Verification Checklist

Before reporting completion:

- [ ] HTML file exists at the stated path.
- [ ] File is standalone and opens without a build step.
- [ ] It has a clear headline, recommendation, and next action.
- [ ] It includes relevant source paths/evidence.
- [ ] No existing files were deleted or overwritten unless explicitly approved.
- [ ] The final response gives the exact file path.
