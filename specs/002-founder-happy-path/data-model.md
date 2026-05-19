# Data Model: Founder Happy Path

## Founder Company

Represents the active Paperclip company as seen by a founder.

- Existing attributes: name, issue prefix, description/onboarding context, setup status, departments, tasks.
- Relationships: owns Mission Control state, departments, tasks, Library output, and Operator conversations.
- Validation: long names and prefixes must remain readable without overflowing the UI.

## Mission Control Next Step

Represents the recommended action the founder should take now.

- Attributes: title, description, action label, action target, state reason.
- Relationships: derived from company setup gaps, current objective, starter tasks, review queue, and Library output status.
- State examples: setup missing, plan accepted, department work pending, output ready, no work yet.

## Business Plan Artifact

Represents the company plan accepted from onboarding or summarized from company context.

- Attributes: title, summary, offer, target customer, proof path, activation status.
- Relationships: informs starter roadmap, department tasks, and Library context.
- Validation: must be understandable as a durable artifact, not only a form answer.

## Library Output

Represents durable work product that can be reviewed.

- Existing attributes: document title/key, linked issue, revision metadata, creator, updated time.
- Relationships: attached to task review and Library route.
- State examples: missing, available, ready for revision, approved.

## Operator Affordance

Represents the persistent founder control for asking, explaining, routing, reviewing, or creating tasks.

- Attributes: collapsed/open state, current context, command actions.
- Relationships: Mission Control, task review, department workspace.
- Validation: must remain discoverable after collapse and usable on compact screens.
