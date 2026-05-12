# GitHub

During onboarding, Cofounder creates two managed GitHub repositories:

- an **app** repository
- a **marketing** repository

These repositories are private and auto-initialized during provisioning.

## Role

GitHub is where the code lives.

- the **app** repository holds the main product codebase
- the **marketing** repository holds the site, launch pages, and growth surface

## What Cofounder Sets Up

After the repositories are created, Cofounder also seeds:

- baseline repository config
- initial folder structure
- `.github/workflows` CI files

## How GitHub Connects To The Rest Of The Stack

The managed GitHub repositories are what the managed Vercel projects get linked to during onboarding.

They are also the repositories the engineering agents work against when they open branches, make changes, and put up pull requests.

## Import Your Own Repo

Some workspaces also let you replace the managed app repo or marketing repo with a repo you already own.

That flow lives in **Settings > Advanced**.

It covers:

- choosing whether the repo is for the app or marketing site
- selecting the GitHub repo
- making sure the Cofounder GitHub app is installed
- linking the managed Vercel project to that repo
- setting the root directory
- syncing env vars

For app repos, it can also keep managed Supabase env wiring, migrations, and the `prod` branch setup aligned.

## Next Steps

- [Vercel](/managed-services/vercel)
- [Managed Services](/managed-services/overview)
