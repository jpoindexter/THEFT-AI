import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Activity, Trash2 } from "lucide-react";

const INTEGRATIONS: Record<
  string,
  {
    name: string;
    desc: string;
    docs: string;
    status: "connected" | "disconnected";
    scopes: string[];
    tools: { name: string; description: string }[];
    recent: { when: string; tool: string; result: string }[];
  }
> = {
  github: {
    name: "GitHub",
    desc: "Source control + PR previews. The Engineer pushes branches and opens PRs against your repos.",
    docs: "https://docs.github.com",
    status: "connected",
    scopes: ["repo", "workflow", "read:user"],
    tools: [
      {
        name: "open_pull_request",
        description: "Open a PR with branch + diff.",
      },
      { name: "comment_on_pr", description: "Reply on a PR." },
      { name: "list_repos", description: "List repos in the org." },
    ],
    recent: [
      {
        when: "2m",
        tool: "open_pull_request",
        result: "PR #42 opened",
      },
      { when: "1h", tool: "list_repos", result: "12 repos" },
    ],
  },
  vercel: {
    name: "Vercel",
    desc: "Deployments + preview environments per branch.",
    docs: "https://vercel.com/docs",
    status: "connected",
    scopes: ["deployments", "domains"],
    tools: [
      { name: "deploy_branch", description: "Trigger a deployment." },
      {
        name: "get_preview_url",
        description: "Return the preview URL for a branch.",
      },
    ],
    recent: [
      { when: "12m", tool: "deploy_branch", result: "main → prod" },
    ],
  },
  supabase: {
    name: "Supabase",
    desc: "Postgres, auth, storage, realtime.",
    docs: "https://supabase.com/docs",
    status: "connected",
    scopes: ["projects", "sql", "storage"],
    tools: [
      { name: "execute_sql", description: "Run SQL on the project DB." },
      {
        name: "apply_migration",
        description: "Apply an additive migration.",
      },
    ],
    recent: [],
  },
  postmark: {
    name: "Postmark",
    desc: "Transactional email and inbound parsing.",
    docs: "https://postmarkapp.com/developer",
    status: "connected",
    scopes: ["send", "receive"],
    tools: [
      {
        name: "send_email",
        description: "Send a transactional email.",
      },
    ],
    recent: [],
  },
  stripe: {
    name: "Stripe",
    desc: "Checkout, subscriptions, billing.",
    docs: "https://stripe.com/docs",
    status: "disconnected",
    scopes: [],
    tools: [],
    recent: [],
  },
  linear: {
    name: "Linear",
    desc: "Issue tracker.",
    docs: "https://developers.linear.app",
    status: "connected",
    scopes: ["read", "write"],
    tools: [
      { name: "create_issue", description: "Create a new Linear issue." },
      { name: "update_issue", description: "Update an issue's state." },
    ],
    recent: [],
  },
};

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ org: string; integration: string }>;
}) {
  const { org, integration } = await params;
  const i = INTEGRATIONS[integration];
  if (!i) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/integrations`}
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to integrations
        </Link>

        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-xl tracking-tight">{i.name}</h1>
            <p className="text-[12px] text-ink-muted max-w-prose mt-1">
              {i.desc}
            </p>
            <a
              href={i.docs}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink mt-1"
            >
              {i.docs} <ExternalLink className="size-3" />
            </a>
          </div>
          <span
            className={`text-[10px] uppercase rounded px-1.5 py-0.5 shrink-0 ${
              i.status === "connected"
                ? "bg-sage/30 text-sage-ink"
                : "bg-cream text-ink-muted"
            }`}
          >
            {i.status}
          </span>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            Scopes
          </div>
          {i.scopes.length === 0 ? (
            <p className="text-[12px] text-ink-muted">No scopes granted.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {i.scopes.map((s) => (
                <code
                  key={s}
                  className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-cream text-ink"
                >
                  {s}
                </code>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            Tools exposed to agents ({i.tools.length})
          </div>
          {i.tools.length === 0 ? (
            <p className="text-[12px] text-ink-muted">
              No tools yet. Connect to populate.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {i.tools.map((t) => (
                <li key={t.name} className="py-2">
                  <code className="text-[12px] font-mono text-ink">
                    {t.name}
                  </code>
                  <div className="text-[11px] text-ink-muted">
                    {t.description}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft inline-flex items-center gap-1">
            <Activity className="size-3" /> Recent calls
          </div>
          {i.recent.length === 0 ? (
            <p className="text-[12px] text-ink-muted">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {i.recent.map((r, idx) => (
                <li
                  key={idx}
                  className="py-2 flex items-center justify-between text-[12px]"
                >
                  <span>
                    <code className="font-mono">{r.tool}</code>{" "}
                    <span className="text-ink-muted">— {r.result}</span>
                  </span>
                  <span className="text-[10px] text-ink-soft">{r.when} ago</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end gap-2">
          {i.status === "connected" ? (
            <button className="inline-flex items-center gap-1 text-[11px] rounded-md border border-brick/40 bg-paper text-brick-ink px-2 py-1 hover:bg-brick/10">
              <Trash2 className="size-3" /> Disconnect
            </button>
          ) : (
            <button className="text-[11px] rounded-md bg-ink text-paper px-3 py-1.5">
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
