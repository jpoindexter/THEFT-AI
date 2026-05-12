# Managed Services

During onboarding, Cofounder sets up a managed stack for the workspace.

That stack includes:

- managed **GitHub** repositories
- managed **Vercel** projects
- a managed **Supabase** project
- a managed **Postmark** server

These services are linked together during onboarding so agents can start working against them right away.

## Access

Users get access differently depending on the service:

- **GitHub**: users are given access to the managed repositories during onboarding
- **Vercel**: users are invited to the managed Vercel projects during onboarding
- **Supabase**: Cofounder manages the project for the workspace, but users are not invited into Supabase yet
- **Postmark**: Postmark is managed for the workspace in the background

## What Gets Managed

- **GitHub** holds the app and marketing repositories
- **Vercel** runs the app and marketing projects, plus staging environments
- **Supabase** provides the managed backend, with staging and production for the app
- **Postmark** handles transactional email and sending-domain setup

## Pages

- [GitHub](/managed-services/github)
- [Vercel](/managed-services/vercel)
- [Supabase](/managed-services/supabase)
- [Migrations](/managed-services/migrations)
- [Postmark](/managed-services/postmark)
- [Publishing](/publishing/overview)
