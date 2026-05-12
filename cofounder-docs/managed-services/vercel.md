# Vercel

During onboarding, Cofounder creates two managed Vercel projects:

- one for the **app**
- one for **marketing**

Each project is linked to its corresponding managed GitHub repository.

## Role

Vercel is where the app and marketing site get deployed.

- the **app** project runs the product
- the **marketing** project runs the site and launch surface
- staging environments give the workspace a separate place to test changes

## What Cofounder Sets Up

For each managed project, Cofounder:

- links the GitHub repository
- sets the production branch
- creates a staging environment

## What Else Gets Synced To Vercel

Managed Vercel projects are where Cofounder pushes:

- Supabase environment variables for the app
- Postmark environment variables for email
- staging and production environment variables needed by the managed app and marketing site

The onboarding flow also configures automation access on the managed Vercel projects so agent-driven deployment workflows can run.

## Next Steps

- [Supabase](/managed-services/supabase)
- [Managed Services](/managed-services/overview)
