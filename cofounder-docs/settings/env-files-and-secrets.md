# Environment Files & Secrets

Use **Settings > Env Files & Secrets** to manage project configuration.

This page has three areas:

- **Environment Files** for uploading and editing encrypted `.env` files
- **Managed Vercel Staging Export** for downloading staging environment variables from managed Vercel projects
- **Secrets** for adding API keys to managed Vercel projects and making selected keys available to agents

## Environment Files

Upload `.env` files when you want Cofounder to store project configuration as editable variables.

After upload, open the file to view and edit individual variables.

## Managed Vercel Staging Export

When a managed app or marketing Vercel project exists, Cofounder can download that project's staging environment variables as a `.env` file.

If no managed project is available yet, the project selector and download action stay disabled.

## Secrets

Use **Add Secret** for API keys that should be pushed directly to a managed Vercel project.

Choose the secret name, value, target environments, and project. Secret values are sent to Vercel and are not stored in our systems.

Turn on **Make available to agents** when code running in the agent's sandbox needs to use the secret through an environment variable. This is useful for local verification against a third-party API, payment provider, or internal service.

Secrets marked this way show an **Agents** badge. You can change agent access later from the pencil icon and save with **Save Agent Access**.

Only make a secret available to agents when the task needs it. Do not paste secret values into task messages or chat.

## How Agent Secret Access Stays Safe

Agent access does not mean the raw credential is written into the conversation or stored in the workspace.

When a sandbox starts, the agent can use the same environment variable name, such as `STRIPE_SECRET_KEY` or `OPENAI_API_KEY`. The value inside the sandbox is a placeholder, not the raw secret.

When sandbox code makes a brokered network request with that placeholder, Cofounder's trusted backend swaps in the real credential for the outbound request. This lets the code call the service without exposing the secret value to the agent's files, chat messages, or normal command output.

If a task no longer needs the credential, turn off **Make available to agents** for that secret.

## Related Pages

- [Testing Changes Locally](/agents/engineer-agent#testing-changes-locally)
- [Domains](/settings/domains)
- [Integrations Overview](/integrations/overview)
