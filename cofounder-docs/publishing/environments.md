# Environments

During onboarding, Cofounder sets up staging and production for the managed app stack.

Staging is where changes get reviewed and tested before they go live. Production is what powers the live app.

## Staging And Production

For the app:

- **GitHub** uses `main` for staging work and `prod` for production
- **Vercel** has a staging environment and a production deployment
- **Supabase** has a staging backend and a production backend

For marketing:

- **GitHub** uses `main` for staging work and `prod` for production
- **Vercel** has a staging environment and a production deployment

## How They Link Together

For app publishing:

- code changes live on `main`
- Vercel uses the staging setup for review
- the app can run against the staging Supabase backend

After publish:

- the code is on `prod`
- Vercel serves the live production app
- the live app continues running against the production Supabase backend

Marketing publishing follows the same GitHub and Vercel flow, without the managed Supabase backend.

## Next Steps

- [Publishing](/publishing/overview)
- [Managed Services](/managed-services/overview)
