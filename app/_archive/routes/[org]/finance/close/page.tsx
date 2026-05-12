import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow } from "@/components/ui/primitives";
import { ArrowLeft, CheckCircle2, Circle, Download, AlertTriangle } from "lucide-react";

type CheckStatus = "done" | "pending" | "blocked";

type CloseItem = {
  label: string;
  status: CheckStatus;
  owner: string;
  note: string | null;
};

const CLOSE_CHECKLIST: CloseItem[] = [
  { label: "Pull Stripe billing summary",            status: "done",    owner: "Finance Agent", note: "Exported Apr 1–30. $68,400 gross, $3,200 refunds." },
  { label: "Reconcile failed payments",              status: "done",    owner: "Finance Agent", note: "3 failed · 2 retried successfully · 1 manual follow-up pending" },
  { label: "Review refunds and credits log",         status: "pending", owner: "Finance Agent", note: null },
  { label: "Compile exceptions list",                status: "pending", owner: "Finance Agent", note: null },
  { label: "Update revenue spreadsheet",             status: "pending", owner: "You",           note: null },
  { label: "Confirm deferred revenue adjustments",   status: "blocked", owner: "You",           note: "Waiting on decision about Blueridge Capital — annual vs. monthly recognition." },
  { label: "Export CSV for accountant",              status: "pending", owner: "Finance Agent", note: null },
  { label: "Send close pack to bookkeeper",          status: "pending", owner: "You",           note: null },
];

const BILLING_SUMMARY = [
  { label: "Gross MRR",         value: "$12,400", delta: "+$800 vs Mar" },
  { label: "New MRR",           value: "$2,200",  delta: "3 new customers" },
  { label: "Expansion MRR",     value: "$480",    delta: "2 upgrades" },
  { label: "Churned MRR",       value: "−$400",   delta: "1 cancellation" },
  { label: "Refunds issued",    value: "−$320",   delta: "1 case (Lumina Studio)" },
  { label: "Stripe fees",       value: "−$1,140", delta: "2.9% + 30¢/txn" },
  { label: "Net to bank",       value: "$10,940", delta: "" },
];

const EXCEPTIONS = [
  { type: "Failed payment",   company: "Ironside Data",   amount: 4200, note: "Card declined 2×. Manual follow-up required." },
  { type: "Refund dispute",   company: "Lumina Studio",   amount: 320,  note: "Requested after cancellation. Reviewing eligibility." },
  { type: "Deferred revenue", company: "Blueridge Capital",amount: 24000,note: "Annual deal — recognition schedule not confirmed." },
];

function fmtUsd(n: number) {
  return `$${Math.abs(n).toLocaleString()}`;
}

const STATUS_ICON: Record<CheckStatus, React.FC<{ className?: string }>> = {
  done: CheckCircle2,
  pending: Circle,
  blocked: AlertTriangle,
};

const STATUS_CLS: Record<CheckStatus, string> = {
  done:    "text-sage-ink",
  pending: "text-ink-soft",
  blocked: "text-mustard-ink",
};

export default async function MonthEndClosePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const done = CLOSE_CHECKLIST.filter((c) => c.status === "done").length;
  const total = CLOSE_CHECKLIST.length;

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/finance`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Finance
            </Link>
            <PageTitle>Month-End Close — April 2025</PageTitle>
            <Hint>
              Billing summary, reconciliation, exceptions, and export pack for
              accounting handoff. {done}/{total} checklist items complete.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            <Download className="size-3.5" /> Export pack
          </button>
        </header>

        {/* Progress */}
        <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">Close progress</span>
            <span className="font-medium text-ink">{done}/{total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-canvas overflow-hidden">
            <div
              className="h-full rounded-full bg-sage/60"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Billing summary */}
        <div className="space-y-2">
          <Eyebrow>Billing summary — April</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {BILLING_SUMMARY.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  i < BILLING_SUMMARY.length - 1 ? "border-b border-line/40" : ""
                } ${row.label === "Net to bank" ? "bg-canvas/40 font-medium" : ""}`}
              >
                <span className="text-xs text-ink">{row.label}</span>
                <div className="flex items-center gap-4">
                  {row.delta && (
                    <span className="text-2xs text-ink-soft">{row.delta}</span>
                  )}
                  <span className={`text-xs font-mono ${row.label === "Net to bank" ? "text-ink font-semibold" : "text-ink-muted"}`}>
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <Eyebrow>Close checklist</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {CLOSE_CHECKLIST.map((item, i) => {
              const Icon = STATUS_ICON[item.status];
              return (
                <div
                  key={i}
                  className={`px-4 py-3 space-y-1 ${i < CLOSE_CHECKLIST.length - 1 ? "border-b border-line/40" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className={`size-3.5 mt-0.5 shrink-0 ${STATUS_CLS[item.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-ink">{item.label}</div>
                      <div className="text-2xs text-ink-soft mt-0.5">Owner: {item.owner}</div>
                    </div>
                  </div>
                  {item.note && (
                    <div className="ml-6 text-2xs text-ink-muted bg-canvas/60 rounded px-2 py-1 border border-line/40 leading-snug">
                      {item.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Exceptions */}
        <div className="space-y-2">
          <Eyebrow>Exceptions — requires decision</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {EXCEPTIONS.map((ex, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 ${i < EXCEPTIONS.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <div className="size-5 rounded-full bg-mustard/10 border border-mustard/30 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="size-2.5 text-mustard-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink">{ex.company}</span>
                    <span className="text-2xs text-ink-muted">{ex.type} · ${ex.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-2xs text-ink-muted mt-0.5 leading-snug">{ex.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
