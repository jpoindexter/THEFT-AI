import Link from "next/link";

const BUILT_IN = [
  { slug: "github", name: "GitHub", desc: "Source control + PR previews." },
  { slug: "vercel", name: "Vercel", desc: "Deployments + staging/production envs." },
  { slug: "supabase", name: "Supabase", desc: "Postgres, auth, storage, realtime." },
  { slug: "postmark", name: "Postmark", desc: "Transactional email." },
  { slug: "stripe", name: "Stripe", desc: "Checkout, subscriptions, billing." },
  { slug: "linear", name: "Linear", desc: "Issue tracker." },
];

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-xl tracking-tight">Integrations</h1>
          <p className="text-[13px] text-ink-muted">
            Built-in integrations are auto-provisioned during onboarding. Add
            custom integrations with your own API keys and JSON Schema.
          </p>
        </header>
        <section>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft mb-2">
            Built-in
          </div>
          <div className="grid grid-cols-2 gap-3">
            {BUILT_IN.map((i) => (
              <Link
                key={i.slug}
                href={`/${org}/integrations/${i.slug}`}
                className="rounded-lg border border-line/70 bg-paper p-3 flex items-start justify-between gap-3 hover:border-line-strong transition-colors"
              >
                <div>
                  <div className="text-[13px] font-medium">{i.name}</div>
                  <p className="text-[12px] text-ink-muted leading-snug">
                    {i.desc}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider rounded bg-cream text-ink-muted px-1.5 py-0.5 shrink-0">
                  Connected
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft mb-2">
            Custom
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${org}/integrations/new`}
              className="inline-block rounded-md border border-line/70 bg-paper px-3 py-1.5 text-[13px] hover:border-line-strong"
            >
              + Add custom integration
            </Link>
            <Link
              href={`/${org}/integrations/mcp`}
              className="inline-block rounded-md border border-line/70 bg-paper px-3 py-1.5 text-[13px] hover:border-line-strong"
            >
              + Add MCP server
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
