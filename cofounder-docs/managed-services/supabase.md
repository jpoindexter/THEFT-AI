# Supabase

During onboarding, Cofounder sets up a managed Supabase backend for the workspace.

That gives the workspace a production setup and a staging setup for app work.

## Role

Supabase is the managed backend for the app.

- it powers the database
- it handles auth
- it gives the workspace a production backend and a staging backend

## What Cofounder Configures

After setup, Cofounder configures Supabase for the app.

That includes:

- the app site URL
- auth redirect URLs
- the staging auth redirect URL

Cofounder also connects the app Vercel project to the managed Supabase backend.

## How Supabase Connects To The Rest Of The Stack

Supabase is wired into the managed app setup, auth configuration, and domain/email setup.

When a domain is assigned, Cofounder updates the managed Supabase auth config so the site URL and redirect URLs match the domain.

## Local Supabase For Agent Testing

For app changes that depend on the database, auth, or storage, the Engineer agent can run Supabase locally in its sandbox.

That lets the agent test migrations, create test data, and click through database-backed flows before a PR is ready for review. Local Supabase is separate from staging and production, so it is a safe place for the agent to verify behavior while it is still working.

## Import Your Own Supabase

If you already have a Supabase project, Cofounder can import it into the workspace.

You can connect your Supabase account, choose the project, and map production and staging.

If your project already has both environments, you can map them directly. If not, you can import production first and add staging later.

If branch creation is available, Cofounder can also create a persistent staging branch for you.

## Next Steps

- [Database Viewer](/agents/engineer-agent#database-viewer)
- [Migrations](/managed-services/migrations)
- [Postmark](/managed-services/postmark)
- [Testing Changes Locally](/agents/engineer-agent#testing-changes-locally)
- [Managed Services](/managed-services/overview)
