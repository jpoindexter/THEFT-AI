import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import ApprovalActions from "@/components/approval-actions";
import { db } from "@/lib/db/store";

function waitingLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ org: string; approval: string }>;
}) {
  const { org, approval } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const approvals = await db.listApprovals(o.id);
  const a = approvals.find((x) => x.id === approval);
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
              waiting {waitingLabel(a.created_at)}
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

        {a.status !== "pending" && (
          <section className="rounded-lg border border-line/70 bg-paper p-4">
            <div className="text-2xs uppercase tracking-wider text-ink-soft inline-flex items-center gap-1 mb-1">
              <ShieldAlert className="size-3" /> Decision
            </div>
            <p className="text-sm text-ink">
              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              {a.decided_at && (
                <span className="text-ink-muted ml-2">
                  · {new Date(a.decided_at).toLocaleString()}
                </span>
              )}
            </p>
          </section>
        )}

        {a.status === "pending" && <ApprovalActions org={org} id={approval} />}
      </div>
    </div>
  );
}
