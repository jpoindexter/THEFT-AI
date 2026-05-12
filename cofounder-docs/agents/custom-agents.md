# Custom Agents

Custom agents let you turn repeatable work into a reusable agent in Cofounder.

Use a custom agent when the same kind of work shows up again and you want it handled with the same instructions, tools, and output format each time.

## When To Add A Custom Agent

Use a custom agent when the task is:

- Repeated often
- Owned by a clear specialty
- Best handled with the same instructions every time
- Dependent on a known set of tools or approvals
- Easier to automate with a focused workflow than with a general-purpose agent

Custom agents are a good fit for work such as:

- A marketing agent that writes campaign briefs and updates launch docs
- An engineering agent that follows your review and testing process
- An operations agent that collects data and prepares status updates

## Common Workflows

### Create a custom agent

1. Open **Canvas** and use the `+` button to add a new agent.
2. Give the agent a clear name and purpose.
3. Add the instructions, model, skills, and tools it should use.
4. Save it as a reusable agent.

Use names that describe the job, not the underlying model. For example, **Launch Planner**, **QA Reviewer**, or **Support Triage Agent** are easier to understand than a generic label.

### Route work to the right agent

Cofounder can automatically match work to the most appropriate custom agent in your workspace.

- A support request can go to a support agent
- A launch request can go to a marketing agent
- A test failure can go to a QA or engineering agent

Automatic matching works best when each agent has a clear purpose and a distinct scope.

## Customize A Custom Agent

The agent editor lets you configure the agent's main working contract.

Depending on the agent, you can set:

- the agent name
- custom instructions
- model choice
- connected apps
- scheduled tasks

### Refine the instructions

Instructions are the most direct way to shape how an agent behaves.

Use them to define:

- The agent's role
- The expected result
- The tone and format
- Decision rules
- What to do when information is missing

### Add skills

Skills extend an agent with repeatable behaviors for a specific kind of work.

Use skills when the agent needs to:

- Follow a checklist
- Format output in a specific way
- Apply a known process
- Handle a recurring task with the same steps each time

### Connect the right tools

Custom agents work best when they can access the tools they actually need.

For example, an agent might use:

- `GitHub`, `Linear`, `Vercel`, or `Supabase` for engineering work
- `Notion`, `Google Docs`, `Google Drive`, or `Airtable` for content and planning work
- `Slack`, `Gmail`, or `Intercom` for support and communication workflows
- `Stripe`, `Metabase`, `PostHog`, or `Attio` for billing, reporting, and go-to-market work

### Scheduled Tasks

Scheduled tasks belong to an agent.

Use a scheduled task when the same agent should run on a cadence such as every morning, every weekday, or every week.

One agent can have multiple scheduled tasks. For example, the same operations agent might run a daily status update, a weekly metrics review, and a monthly cleanup checklist.

Each scheduled task can have its own:

- title
- instructions
- cadence
- enabled or paused state

Use separate scheduled tasks when the timing, instructions, or expected output are different, even if the same agent should do the work.

## Next Steps

- [Agents Overview](/agents/overview)
- [Skills](/agents/skills)
- [Integrations Overview](/integrations/overview)
