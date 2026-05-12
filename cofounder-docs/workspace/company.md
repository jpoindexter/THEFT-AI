# Company

The **Company** view is the workspace-level overview for your organization.

Use it when you want to see what Cofounder knows about the company itself, not just one task or one department.

## What It Shows

The Company view can show:

- metric cards for MRR, active users, churn, and signups, which stay empty until a real data source is connected
- stack setup status for domains, email, payments, hosting, and other company infrastructure
- the active agents available to the workspace
- Company Memory imported from other AI tools

Metric cards without a connected data source stay empty. Stack items with no data yet show an empty or setup-needed state instead of guessing.

## Company Memory

Company Memory is shared workspace context that agents can search when they need prior decisions, project notes, workflows, or company facts.

It can come from completed tasks, connected integrations, and [Company Context](/settings/company-context) imports. Use it for reusable company context, not one-off task instructions.

Good memory includes:

- company and product facts
- important decisions and why they were made
- recurring workflows and team preferences
- active projects, goals, risks, and open questions
- source notes that help another agent trust the context later

Do not store secrets, API keys, private credentials, or raw transcripts in Company Memory.

Memory can lag behind recent updates. If an important detail matters for a customer, production change, or external send, ask the agent to verify it against the source before acting.

To change memory, tell Cofounder what to update in chat, update the connected source, or import cleaner context through [Company Context](/settings/company-context).

## Stack Status

The stack area helps you see what is ready and what still needs setup.

For example, domains, payments, email, and hosting can each show whether Cofounder has enough connected infrastructure to use them in agent work.

When a stack item needs setup, open the related settings page or start the suggested agent task from the Company or Canvas flow.

## Engineering Workspace

Open **Canvas** and go to the **Engineering** workspace for app infrastructure work.

That workspace is where you can:

- open the [**Database** artifact](/agents/engineer-agent#database-viewer) to view tables, inspect records, and upload CSV data
- use **Stack** to see the services connected to the app
- use **Deployments** to review previews, publish, and deploy the app

## Next Steps

- [Canvas](/workspace/canvas)
- [Tasks](/workspace/tasks)
- [Company Context](/settings/company-context)
- [Agents Overview](/agents/overview)
- [Tech Tree](/workspace/tech-tree)
