import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const APPROVALS = [
  {
    id: "approval_001",
    agent: "Engineer",
    title: "Approve schema migration: add `subscriptions` table",
    body: "The Engineer wants to apply migration 0014 which adds a `subscriptions` table with FK to `auth.users`. Backfill is empty. Reversible.",
    impact: "low",
    waiting: "2m",
  },
  {
    id: "approval_002",
    agent: "Marketing",
    title: "Send launch email to 1,240 subscribers",
    body: "Reviewed by Cofounder. Subject: \"PDF Champ is live.\" Send time: today 5pm.",
    impact: "medium",
    waiting: "8m",
  },
  {
    id: "approval_003",
    agent: "Sales",
    title: "Spend $200 on outbound prospect data",
    body: "Sales wants to pull 500 mortgage broker contacts via Clay (~$200). Cost would draw down monthly budget.",
    impact: "medium",
    waiting: "21m",
  },
];

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight">Approvals</h1>
          <p className="text-sm text-ink-muted">
            Decisions agents need from you before continuing.
          </p>
        </header>
        <ul className="space-y-2">
          {APPROVALS.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-line/70 bg-paper p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-soft">
                    {a.agent} · waiting {a.waiting}
                  </div>
                  <h2 className="text-md font-medium tracking-tight">
                    <Link
                      href={`/${org}/approvals/${a.id}`}
                      className="hover:underline decoration-stone-300 underline-offset-2"
                    >
                      {a.title}
                    </Link>
                  </h2>
                </div>
                <span
                  className={`text-2xs uppercase rounded px-1.5 py-0.5 ${
                    a.impact === "low"
                      ? "bg-sage/30 text-sage-ink"
                      : a.impact === "medium"
                        ? "bg-mustard/30 text-mustard-ink"
                        : "bg-brick/15 text-brick-ink"
                  }`}
                >
                  {a.impact} impact
                </span>
              </div>
              <p className="text-sm text-ink-muted leading-snug">
                {a.body}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/${org}/approvals/${a.id}`}
                  className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                >
                  <AlertCircle className="size-3" /> Discuss
                </Link>
                <button className="inline-flex items-center gap-1 text-xs rounded-md border border-brick/40 bg-paper text-brick-ink px-2 py-1 hover:bg-brick/10">
                  <XCircle className="size-3" /> Decline
                </button>
                <button className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-2 py-1">
                  <CheckCircle2 className="size-3" /> Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
