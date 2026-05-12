# Publishing

Publishing is how changes move from staging to the live app or website.

You can publish from the publish button in Canvas, or ask **Cofounder** to publish for you.

In either case, Cofounder runs the publish flow for the app or marketing repository you selected.

## How Publishing Works

When you publish, Cofounder creates or reuses a GitHub pull request from `main` to `prod`.

That pull request is the publish step. It gives you one place to review status, checks, and whether the selected target is ready to go live.

Once that pull request is merged:

- the `prod` branch becomes the current production branch
- Vercel updates the live production deployment for that target
- the live app or website reflects the published changes

## Environments

Publishing uses the staging and production environments that Cofounder sets up during onboarding.

## Next Steps

- [Environments](/publishing/environments)
- [Migrations](/managed-services/migrations)
- [Managed Services](/managed-services/overview)
- [GitHub](/managed-services/github)
- [Vercel](/managed-services/vercel)
