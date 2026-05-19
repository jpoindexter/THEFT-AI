# MVP DOGFOODING FEEDBACK

> Created 2026-05-19 from first live local dogfood session. Track product friction here before turning items into implementation tasks.

## Priority

Fix issues that block a founder from understanding what to do next before doing more architecture cleanup.

## AI Helper Proposal

### Context

The onboarding and first-task flow asks business-strategy questions before the user may have clear language. Example:

> Stage interview: How will you land the first 5 paying customers?

That wording assumes the user already knows their go-to-market motion. In practice, the product should help translate rough intent into usable company context and tasks.

### Proposal

Add a small contextual AI helper beside confusing onboarding fields and task fields.

- UI: compact sparkle/star button next to labels such as `Stage interview`, `Task title`, `Description`, and `Mission / goal`.
- Behavior: opens an inline helper panel or popover, not a full chat takeover.
- Flow: asks 2-3 plain-English clarifying questions, then drafts an editable answer.
- Primary action: `Use this answer`.
- Secondary action: `Try again` or `Make shorter`.
- Output must remain editable before submission.

### First Helper Target

Field: `Stage interview`

Current copy:

```text
How will you land the first 5 paying customers?
```

Better user-facing framing:

```text
What needs to be true before you can sell this, and who will you try first?
```

Helper questions:

```text
Who do you think this is for?
What do they need before they would trust you?
What is the first thing you need to build before outreach?
```

Example generated answer:

```text
First I need to clarify the offer and create a sales website that explains the design subscription, target customer, proof, pricing, and booking path. After that I will use direct outreach to founders, SaaS teams, and service businesses to get the first demos and convert the first 5 customers.
```

### First Task Drafting Target

If the user says they need a website before customers, the helper should turn that into a concrete first task.

Task title:

```text
Design the first sales website
```

Description:

```text
Research what is working for design-as-a-service and UX subscription businesses, then create a focused website plan and first webpage that explains the offer, target customer, proof, pricing/options, and call to action.
```

## Bugs / Friction Seen In Screenshots

### P0 - Generated Company Prefix Is Broken

Observed:

- Issue identifiers and URLs are extremely long, e.g. `THEAAAAAAAAAAAAAAAAAAAAAAAA...`.
- The workspace switcher shows long pill prefixes that overflow/truncate poorly.
- Toasts and task rows show unreadable identifiers.

Expected:

- Company issue prefix should be short, stable, and human readable.
- For `THEFT`, the prefix should likely be `THE` or `THFT`.
- UI should truncate identifiers defensively, but the data generator should not create pathological prefixes.

Likely areas:

- onboarding company creation
- issue prefix generation
- company switcher display
- notification/toast display

### P0 - Agent Error Toast Is Too Vague

Observed:

- Toast says `Marketing Lead errored`.
- It only offers `View agent`.
- It does not say what failed, whether the task failed, what to do next, or whether this blocks the company.

Expected:

- Error notification should identify the task/run and give a next action.
- Prefer `View failed run`, `Retry`, or `Open task` over only `View agent`.
- Include a short failure reason when available.

### P1 - Toasts Overflow With Long Issue IDs

Observed:

- Activity toasts overflow horizontally because long issue IDs render as unbroken text.
- Multiple toasts stack over active Mission Control content and the Operator dock.

Expected:

- Toast titles/details should clamp and wrap safely.
- Long issue identifiers should use a compact display form.
- Toast stack should avoid covering the Operator dock or should be dismissible/collapsed faster.

### P1 - Workspace Switcher Becomes Noisy

Observed:

- Workspace switcher contains many duplicate-looking THEFT companies.
- Long issue prefixes dominate the list.
- It is hard to tell which workspace is the current real dogfood workspace.

Expected:

- Current workspace should be obvious.
- Archived/test/smoke companies should be visually separated, hidden by default, or easier to clean up.
- Company list rows should prioritize company name and useful metadata, not raw generated prefix.

### P1 - Mission Control First Task Mismatch

Observed:

- User intended: design the first sales website before customer outreach.
- Generated/visible tasks skew toward `Draft MVP build scope and timeline` and customer acquisition tasks.

Expected:

- Onboarding should preserve the user's immediate bottleneck.
- If the user says the site/offer must come before customers, the first task should become a website/offer task, not generic MVP planning.

### P2 - Business Copy Is Too Jargony

Observed:

- `How will you land the first 5 paying customers?`
- Placeholder `Channels, offer, timeline, and proof points.`

Expected:

- Use plainer prompts.
- Let users answer with uncertainty.
- AI helper should translate fuzzy thoughts into structured business language.

Suggested copy:

```text
Who will you try to sell to first, and what do you need before reaching out?
```

## Open Implementation Questions

- Should contextual AI helper use the same Operator path, or a separate lightweight draft endpoint?
- Should helper output create only text suggestions, or also update the first task title/description?
- Should smoke/test companies be excluded from the workspace switcher by default?
- Should issue prefix generation be corrected for all existing malformed companies, or only for new ones?

