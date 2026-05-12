# Domains

You can manage domains directly from Cofounder.

The domain page has two main tabs:

- **Search** to find and secure a new domain
- **Owned** to view domains your organization already controls

You can also start a domain transfer from the domain page.

Depending on the domain state, you can:

- search for domains
- buy a domain from the site
- import an existing domain
- transfer a domain in
- view domains your org already owns
- edit DNS records
- update nameservers
- manage auto-renew

## Propagation Takes Time

After you buy a domain or change nameservers, it can take a while for DNS and nameserver changes to propagate.

Expect that to take anywhere from a few minutes to a few hours.

During that window, parts of the setup may still show as pending while providers catch up.

## Assigning A Domain

When you assign a domain, Cofounder wires it into the managed app and marketing setup created during onboarding.

That assignment sets up:

- the apex domain on the managed marketing project
- `staging.<your-domain>` on the managed marketing staging environment
- `app.<your-domain>` on the managed app project
- `staging.app.<your-domain>` on the managed app staging environment

It also updates the managed Supabase auth configuration so the app site URL and auth redirect URLs match the assigned domain.

The same assignment also registers the domain with Postmark and prepares the DNS records needed for email sending.

## Inbox Domains

Your domains can also be used for agent inboxes.

In `Settings > Inbox`, you can choose which of your domains should be available as inbox domains for agents. Once a domain is ready there, you can assign inbox addresses to agents on that domain.

## Email Sending With Postmark

Assigned domains are also used for transactional email through Postmark.

When the sending domain verifies, Cofounder turns on Postmark-backed SMTP for the managed Supabase projects.

It also syncs the Postmark configuration into the managed Vercel projects, including:

- the Postmark server token
- the Postmark server ID
- the message stream IDs
- the default from address

If the domain is using managed Vercel nameservers, Cofounder can also auto-create the Postmark DNS records. Otherwise, Cofounder shows the records you need to add manually.

## Related Pages

- [Inbox](/settings/inbox)
- [Environment Files & Secrets](/settings/env-files-and-secrets)
- [Integrations Overview](/integrations/overview)
