# Departments

Each department owns a part of the company and groups the agents, context, rules, tasks, and artifacts for that area.

## After Onboarding

After onboarding, your workspace has department workspaces for the main lanes of company work.

The department workspaces are:

- **Engineering** for product, app, repository, infrastructure, security, database, and deployment work
- **Sales** for pipeline, leads, outreach, customer conversations, and revenue work
- **Marketing** for positioning, content, SEO, launch work, and marketing-site work
- **Design** for brand identity, visual systems, decks, email templates, UI kits, and product design support
- **Support** for customer support, issue resolution, and customer success operations
- **Operations** for recurring workflows, internal process, reporting, research, and cross-system cleanup
- **Finance** for billing operations, collections, accounting handoff, close support, and financial reporting
- **Legal** for contract support, policy review, compliance artifacts, and legal-ops workflows

## Default Agents By Department

Seeded default agents are organized by department. The exact agents in your workspace can change as your setup changes, but onboarding starts with:

- **Engineering**: `Engineer`
- **Sales**: `Sales Agent`
- **Marketing**: `Marketing Agent`
- **Design**: `Design Agent`
- **Support**: `Support Agent`
- **Operations**: `Operations Agent`, `Ops Agent`
- **Finance**: `Finance Agent`

## Inside A Department

A department contains:

- **Agents** for the work that belongs in that lane
- **Tasks** for the active and completed work tied to those agents
- **Department Context** for durable background information that agents in that department should share
- **Artifacts/Files** for outputs and working files created by that department's work

The Engineering department can also show the managed Supabase [**Database** artifact](/agents/engineer-agent#database-viewer) on Canvas. Use that artifact when you need to browse tables, inspect records, or upload CSV data.

Files in the Library still need a department association, even though every agent can access every Library file. The department acts as a routing hint, not an access boundary.

## Department Context

Department context is for background information that should be shared across agents in that department.

Examples:

- product constraints for Engineering
- audience and positioning notes for Sales or Marketing
- brand and visual direction for Design
- support policies for Support
- reporting definitions for Operations
- billing and close process notes for Finance
- contract, policy, and compliance notes for Legal

## Next Steps

- [Library](/workspace/library)
- [Canvas](/workspace/canvas)
- [Agents Overview](/agents/overview)
- [Skills](/agents/skills)
