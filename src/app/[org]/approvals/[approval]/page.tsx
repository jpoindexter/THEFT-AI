import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ShieldAlert,
} from "lucide-react";
import ApprovalActions from "@/components/approval-actions";

const APPROVALS: Record<
  string,
  {
    agent: string;
    title: string;
    body: string;
    impact: "low" | "medium" | "high";
    waiting: string;
    risks: string[];
    plan: string[];
    rollback: string;
  }
> = {
  approval_001: {
    agent: "Engineer",
    title: "Apply migration: add `subscriptions` table",
    body: "Migration 0014 adds a new `subscriptions` table with a foreign key to `auth.users`. The table starts empty.",
    impact: "low",
    waiting: "2m",
    risks: [
      "FK to auth.users — verify no orphan deletes are expected.",
      "Adds 4 columns; no existing data is touched.",
    ],
    plan: [
      "Run migration on staging branch.",
      "Verify table exists and FK constraint resolves.",
      "Promote to production.",
    ],
    rollback: "DROP TABLE public.subscriptions;",
  },
  approval_002: {
    agent: "Marketing",
    title: "Send launch email to 1,240 subscribers",
    body: "Reviewed by Cofounder. Subject: \"PDF Champ is live.\" Send time: today 5pm.",
    impact: "medium",
    waiting: "8m",
    risks: [
      "Once sent, cannot be unsent.",
      "Subject line is committed across providers (Postmark + downstream).",
    ],
    plan: [
      "Render email in three clients (Gmail, Outlook, iOS Mail).",
      "Confirm subject line and preview text.",
      "Schedule via Postmark for 5pm.",
    ],
    rollback: "Cannot rollback once sent. Pre-send checks only.",
  },
  approval_003: {
    agent: "Sales",
    title: "Spend $200 on outbound prospect data",
    body: "Sales wants to pull 500 mortgage broker contacts via Clay (~$200). Cost would draw down monthly budget.",
    impact: "medium",
    waiting: "21m",
    risks: [
      "Burns 18% of remaining sales budget.",
      "Data quality varies across Clay providers.",
    ],
    plan: [
      "Pull 50-row sample first.",
      "Spot-check deliverability.",
      "Pull remaining 450 if sample passes.",
    ],
    rollback: "Refund window with Clay is 24h.",
  },
};

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ org: string; approval: string }>;
}) {
  const { org, approval } = await params;
  const a = APPROVALS[approval];
  if (!a) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/${org}/approvals`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to approvals
        </Link>

        <header className="space-y-1">
          <div className="text-2xs uppercase tracking-wider text-ink-soft inline-flex items-center gap-2">
            {a.agent}
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <Clock className="size-3" />
              waiting {a.waiting}
            </span>
          </div>
          <h1 className="text-xl tracking-tight">{a.title}</h1>
          <span
            className={`inline-block text-2xs uppercase rounded px-1.5 py-0.5 mt-1 ${
              a.impact === "low"
                ? "bg-sage/30 text-sage-ink"
                : a.impact === "medium"
                  ? "bg-mustard/30 text-mustard-ink"
                  : "bg-brick/15 text-brick-ink"
            }`}
          >
            {a.impact} impact
          </span>
          <p className="text-base text-ink leading-relaxed pt-2 max-w-prose">
            {a.body}
          </p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft inline-flex items-center gap-1">
            <ShieldAlert className="size-3" /> Risks
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink">
            {a.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Execution plan
          </div>
          <ol className="space-y-1.5 text-base text-ink">
            {a.plan.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-4 rounded-full border border-line-strong inline-flex items-center justify-center text-2xs text-ink-muted shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Rollback
          </div>
          <pre className="text-xs font-mono text-ink whitespace-pre-wrap">
            {a.rollback}
          </pre>
        </section>

        <ApprovalActions org={org} id={approval} />
      </div>
    </div>
  );
}
