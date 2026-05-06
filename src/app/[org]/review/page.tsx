import Link from "next/link";
import { Eye, GitPullRequest, Megaphone, Mail, Database } from "lucide-react";

const QUEUE = [
  {
    id: "pr-42",
    href: "/publishing",
    icon: GitPullRequest,
    kind: "PR",
    title: "feat/subscriptions-table",
    by: "Engineer",
    detail: "Migration adds non-null column. Backfill plan attached.",
    waitingOn: "Merge",
    age: "12m",
  },
  {
    id: "email-may",
    href: "/library",
    icon: Mail,
    kind: "Email",
    title: "Launch broadcast — May",
    by: "Marketing",
    detail: "Draft + subject line variants ready for approval.",
    waitingOn: "Send",
    age: "23m",
  },
  {
    id: "brand",
    href: "/design",
    icon: Megaphone,
    kind: "Brand",
    title: "Pitch deck cover",
    by: "Design",
    detail: "Two visual directions. Pick one before send.",
    waitingOn: "Pick direction",
    age: "1h",
  },
  {
    id: "schema",
    href: "/database",
    icon: Database,
    kind: "Schema",
    title: "Add accounts.suspended_at",
    by: "Engineer",
    detail: "Reversible. Locks table 200ms in prod.",
    waitingOn: "Approve",
    age: "2h",
  },
];

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight inline-flex items-center gap-2">
            <Eye className="size-5 text-ink-muted" /> Review
          </h1>
          <p className="text-[12px] text-ink-muted">
            Things agents prepared that need a human decision before they ship,
            send, or merge.
          </p>
        </header>

        <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
          {QUEUE.map((q) => {
            const Icon = q.icon;
            return (
              <li key={q.id}>
                <Link
                  href={`/${org}${q.href}`}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-canvas"
                >
                  <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                        {q.kind}
                      </span>
                      <span className="text-[10px] text-ink-soft">
                        · by {q.by} · {q.age} ago
                      </span>
                    </div>
                    <div className="text-[13px] font-medium tracking-tight mt-0.5">
                      {q.title}
                    </div>
                    <div className="text-[12px] text-ink-muted mt-0.5">
                      {q.detail}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 shrink-0 self-center">
                    {q.waitingOn}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] text-ink-muted text-center">
          {QUEUE.length} items waiting. Action one to reduce the queue.
        </p>
      </div>
    </div>
  );
}
