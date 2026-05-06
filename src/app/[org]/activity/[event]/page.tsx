import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const EVENTS: Record<
  string,
  {
    when: string;
    actor: string;
    action: string;
    target: string;
    detail: string;
    body: string;
    metadata: Record<string, string>;
  }
> = {
  evt_001: {
    when: "2m ago",
    actor: "Engineer",
    action: "opened PR",
    target: "feat/subscriptions-table",
    detail: "12 files changed · +320/-12",
    body: "Engineer opened a pull request to add a `subscriptions` table with FK to `auth.users`. Migration is reversible. PR contains schema, types, and a backfill script (empty currently).",
    metadata: {
      branch: "feat/subscriptions-table",
      base: "main",
      commits: "4",
      reviewer: "you",
    },
  },
  evt_002: {
    when: "6m ago",
    actor: "Cofounder",
    action: "set business plan",
    target: "Business Plan",
    detail: "Product, ICP, pricing thesis saved",
    body: "Cofounder finalized the v1 business plan after the onboarding interview. Saved as a pinned artifact in Library.",
    metadata: {
      sections: "8",
      "word count": "1,240",
    },
  },
  evt_003: {
    when: "21m ago",
    actor: "Marketing",
    action: "drafted launch email",
    target: "Launch broadcast — May",
    detail: "Awaiting approval",
    body: "Marketing drafted a launch broadcast. Three subject-line variants and two body variants. Awaiting approval before send.",
    metadata: {
      list: "1,240 subscribers",
      provider: "Postmark",
    },
  },
  evt_004: {
    when: "1h ago",
    actor: "Sales",
    action: "exported prospect list",
    target: "lenders-mortgage-2026.csv",
    detail: "240 rows",
    body: "Sales exported a prospect list of mortgage lenders for outbound sequencing.",
    metadata: {
      rows: "240",
      source: "Clay",
      cost: "$120",
    },
  },
  evt_005: {
    when: "2h ago",
    actor: "Operations",
    action: "kicked routine",
    target: "Weekly status brief",
    detail: "Scheduled · Mondays 9am",
    body: "Operations created a recurring routine to post a weekly status brief every Monday at 9am.",
    metadata: {
      cron: "0 9 * * 1",
      destination: "#standup",
    },
  },
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ org: string; event: string }>;
}) {
  const { org, event } = await params;
  const e = EVENTS[event];
  if (!e) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/${org}/activity`}
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to activity
        </Link>

        <header className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            {e.actor} · {e.when}
          </div>
          <h1 className="text-xl tracking-tight">
            {e.action}{" "}
            <span className="font-mono text-[15px] text-ink">
              {e.target}
            </span>
          </h1>
          <p className="text-[12px] text-ink-muted">{e.detail}</p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4">
          <p className="text-[13px] text-ink leading-relaxed">{e.body}</p>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft mb-2">
            Metadata
          </div>
          <ul className="space-y-1">
            {Object.entries(e.metadata).map(([k, v]) => (
              <li
                key={k}
                className="flex justify-between text-[12px] font-mono"
              >
                <span className="text-ink-muted">{k}</span>
                <span className="text-ink">{v}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
