import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill, StatCard } from "@/components/ui/primitives";
import { ArrowLeft, CheckCircle2, Circle, XCircle, Download, FileText } from "lucide-react";

type PackStatus = "ready" | "pending" | "blocked";

type PackItem = {
  label: string;
  status: PackStatus;
  owner: "ops" | "finance";
  notes: string | null;
};

const PACK_ITEMS: PackItem[] = [
  { label: "Reconciled transaction summary — Apr 1–30", status: "ready",   owner: "ops",     notes: null },
  { label: "Export-ready billing table (CSV)",           status: "ready",   owner: "ops",     notes: "Exported 2025-04-30. Available in Google Sheets." },
  { label: "Stripe balance snapshot",                    status: "ready",   owner: "ops",     notes: "$31,240.18 closing balance." },
  { label: "Unmatched receipt queue — cleared",          status: "pending", owner: "ops",     notes: "2 of 8 items still need manual match." },
  { label: "Failed payment log — reviewed",              status: "ready",   owner: "ops",     notes: "3 failed; 2 recovered, 1 churned." },
  { label: "Exceptions memo for Finance",                status: "pending", owner: "ops",     notes: "Refund dispute ($320) and deferred revenue note outstanding." },
  { label: "MRR roll-forward confirmed by Finance",      status: "blocked", owner: "finance", notes: "Waiting on Finance to confirm expansion MRR from Nucleus Labs." },
  { label: "Accounting close entries complete",          status: "blocked", owner: "finance", notes: "Finance owns. ETA: May 5." },
];

type TxCategory = "subscription" | "refund" | "fee" | "failed";

type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: TxCategory;
  matched: boolean;
};

const TRANSACTIONS: Transaction[] = [
  { date: "Apr 30", description: "Nucleus Labs — monthly subscription",    amount:  3000,  category: "subscription", matched: true  },
  { date: "Apr 30", description: "Apex Ops Inc — monthly subscription",    amount:  1200,  category: "subscription", matched: true  },
  { date: "Apr 29", description: "Stripe fee — April volume",              amount:   -412, category: "fee",          matched: true  },
  { date: "Apr 28", description: "Refund — Brightline (prorated)",         amount:   -320, category: "refund",       matched: false },
  { date: "Apr 27", description: "Tandem Health — monthly subscription",   amount:   800,  category: "subscription", matched: true  },
  { date: "Apr 26", description: "Dunmore Agency — failed payment",        amount:     0,  category: "failed",       matched: false },
  { date: "Apr 25", description: "Mesa Retail — monthly subscription",     amount:   500,  category: "subscription", matched: true  },
  { date: "Apr 24", description: "Stripe fee — mid-month",                 amount:   -196, category: "fee",          matched: true  },
];

const EXCEPTIONS = [
  { label: "Refund dispute",        detail: "Brightline — $320 prorated refund, not yet matched to invoice. Awaiting confirmation." },
  { label: "Deferred revenue",      detail: "Nucleus Labs paid Q2 upfront. $6k needs to be split across Apr/May/Jun in accounting." },
  { label: "Dunmore failed charge", detail: "3rd failed attempt. Auto-dunning paused pending manual outreach decision." },
];

const PACK_ICON: Record<PackStatus, React.FC<{ className?: string }>> = {
  ready:   CheckCircle2,
  pending: Circle,
  blocked: XCircle,
};
const PACK_CLS: Record<PackStatus, string> = {
  ready:   "text-sage-ink",
  pending: "text-mustard-ink",
  blocked: "text-brick-ink",
};
const PACK_TONE: Record<PackStatus, "sage" | "mustard" | "brick"> = {
  ready:   "sage",
  pending: "mustard",
  blocked: "brick",
};

const TX_TONE: Record<TxCategory, string> = {
  subscription: "text-sage-ink",
  refund:       "text-mustard-ink",
  fee:          "text-ink-muted",
  failed:       "text-brick-ink",
};

function fmtAmount(n: number) {
  if (n === 0) return "—";
  const abs = Math.abs(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return n < 0 ? `(${abs})` : abs;
}

export default async function HandoffPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const ready   = PACK_ITEMS.filter((i) => i.status === "ready").length;
  const pending = PACK_ITEMS.filter((i) => i.status === "pending").length;
  const blocked = PACK_ITEMS.filter((i) => i.status === "blocked").length;

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/operations`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Operations
            </Link>
            <PageTitle>Finance Handoff Pack</PageTitle>
            <Hint>
              Weekly operating pack for Finance and leadership. Ops prepares;
              Finance confirms and closes.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Download className="size-3.5" /> Export pack
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Items ready"   value={String(ready)}   tone="sage"    />
          <StatCard label="Items pending" value={String(pending)} tone="mustard" />
          <StatCard label="Blocked"       value={String(blocked)} />
        </div>

        {/* Progress bar */}
        <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-sage-ink" />{ready} ready</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-mustard-ink" />{pending} pending</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brick-ink" />{blocked} blocked</span>
          </div>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-canvas">
            <div className="bg-sage/60 rounded-l-full" style={{ width: `${(ready / PACK_ITEMS.length) * 100}%` }} />
            <div className="bg-mustard/50" style={{ width: `${(pending / PACK_ITEMS.length) * 100}%` }} />
            <div className="bg-brick/40 flex-1 rounded-r-full" />
          </div>
        </div>

        {/* Pack checklist */}
        <div className="space-y-2">
          <Eyebrow>Pack checklist — April close</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {PACK_ITEMS.map((item, i) => {
              const Icon = PACK_ICON[item.status];
              return (
                <div
                  key={i}
                  className={`px-4 py-3 space-y-1 ${i < PACK_ITEMS.length - 1 ? "border-b border-line/40" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className={`size-3.5 mt-0.5 shrink-0 ${PACK_CLS[item.status]}`} />
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-ink">{item.label}</span>
                      <Pill tone={PACK_TONE[item.status]}>{item.status}</Pill>
                      <Pill tone="neutral">{item.owner}</Pill>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="ml-6 text-2xs text-ink-muted bg-canvas/60 rounded px-2 py-1 border border-line/40 leading-snug">
                      {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction summary */}
        <div className="space-y-2">
          <Eyebrow>Reconciled transaction summary</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-left px-4 py-2 font-medium">Category</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                  <th className="text-left px-4 py-2 font-medium">Matched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {TRANSACTIONS.map((tx, i) => (
                  <tr key={i} className="hover:bg-canvas/50">
                    <td className="px-4 py-2 text-2xs text-ink-soft font-mono">{tx.date}</td>
                    <td className="px-4 py-2 text-xs text-ink max-w-xs truncate">{tx.description}</td>
                    <td className="px-4 py-2">
                      <span className={`text-2xs ${TX_TONE[tx.category]}`}>{tx.category}</span>
                    </td>
                    <td className={`px-4 py-2 text-xs font-mono text-right ${tx.amount < 0 ? "text-brick-ink" : "text-ink"}`}>
                      {fmtAmount(tx.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <Pill tone={tx.matched ? "sage" : "mustard"}>{tx.matched ? "yes" : "review"}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exceptions */}
        <div className="space-y-2">
          <Eyebrow>Exceptions for Finance</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {EXCEPTIONS.map((ex, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 px-4 py-3 ${i < EXCEPTIONS.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <FileText className="size-3.5 text-mustard-ink shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-ink">{ex.label}</div>
                  <div className="text-2xs text-ink-muted mt-0.5 leading-snug">{ex.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
