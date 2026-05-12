# Payments And Stripe

## Where To Add Stripe Keys

Add Stripe from **Settings > Payments**.

The page shows whether the managed app is ready for payment setup. If the app has not been set up yet, Cofounder explains that payment work needs a managed Vercel product app before Stripe credentials and billing code can be installed.

Org admins can add:

- the Stripe test publishable key
- the Stripe test secret key
- the Stripe live publishable key
- the Stripe live secret key

Cofounder verifies the keys before treating Stripe as connected.

You can add test keys, live keys, or both. Use test keys while building and checking payment flows. Add live keys when the app is ready to accept real payments.

## What Happens When Stripe Is Connected

Once the keys are valid:

- Stripe shows up as a connected integration for the workspace
- Cofounder syncs the Stripe config into the managed app
- the app is ready for Stripe implementation work
- the Stripe webhook is configured to point at the managed app

Cofounder keeps test and live keys separate. Test keys stay out of production. Live keys sync to production only.

The Payments page also shows credential slots for **Test** and **Live**. Each slot tracks whether keys, environment variables, and webhooks are present.

## Engineer Agent

From **Settings > Payments**, you can kick off payment implementation with the **Engineer Agent**.

The Engineer Agent works with you to add Stripe to the app. That can include:

- wiring Stripe into the app
- adding checkout or subscription flows
- setting up billing-related app logic
- finishing work when Stripe is already partially connected

This is the path to use when you want Cofounder to help implement payments, not just store keys.

If setup is blocked, the page shows the next step before the agent can safely proceed.

## Stripe In The Managed App

When Stripe is connected, Cofounder syncs the Stripe configuration into the managed app project.

That includes:

- the publishable key
- the secret key
- the webhook signing secret

## Stripe Webhook

When you connect Stripe, Cofounder also configures the Stripe webhook for the managed app automatically.

The webhook points at the managed Vercel app's Stripe webhook route:

`/api/stripe/webhook`

If a domain has already been assigned to the app, Cofounder uses that domain for the webhook URL. Otherwise it uses the managed Vercel app URL.

The webhook signing secret is then synced into the managed app as well.

## Seeded Webhook Route

The managed app starter already includes a Stripe webhook route.

That route verifies the Stripe signature and gives the app a starting point for webhook handling. The Engineer Agent can then help add the app-specific billing logic on top of it.

## Next Steps

- [Integrations Overview](/integrations/overview)
- [Managed Services](/managed-services/overview)
- [Migrations](/managed-services/migrations)
