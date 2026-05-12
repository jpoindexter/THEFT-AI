import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill, StatCard } from "@/components/ui/primitives";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type Confidence = "auto" | "review" | "manual";

type ReconItem = {
  id: string;
  source: string;
  destination: string;
  description: string;
  amount: number;
  date: string;
  confidence: Confidence;
  matchReason: string | null;
  flag: string | null;
};

const RECON_ITEMS: ReconItem[] = [
  {
    id: "1",
    source: "Stripe",
    destination: "Spreadsheet",
    description: "Blueridge Capital — Apr invoice payment",
    amount: 24000,
    date: "Apr 28",
    confidence: "auto",
    matchReason: "Invoice ref INV-0438 matches, amount exact",
    flag: null,
  },
  {
    id: "2",
    source: "Stripe",
    destination: "Spreadsheet",
    description: "Meridian Health — subscription renewal",
    amount: 12000,
    date: "Apr 30",
    confidence: "auto",
    matchReason: "Subscription ID + amount match",
    flag: null,
  },
  {
    id: "3",
    source: "Stripe",
    destination: "Spreadsheet",
    description: "Forge Logistics — payment",
    amount: 8500,
    date: "Apr 29",
    confidence: "review",
    matchReason: "Amount matches but date is 2d off from expected",
    flag: null,
  },
  {
    id: "4",
    source: "Stripe",
    destination: "Attio CRM",
    description: "Nucleus Labs — active subscription",
    amount: 1800,
    date: "Apr 1",
    confidence: "review",
    matchReason: null,
    flag: "CRM shows 'churned' but Stripe shows active subscription",
  },
  {
    id: "5",
    source: "Spreadsheet",
    destination: "Stripe",
    description: "Refund — Lumina Studio",
    amount: 320,
    date: "Apr 24",
    confidence: "review",
    matchReason: "Refund in sheet, Stripe shows pending dispute — not a refund",
    flag: null,
  },
  {
    id: "6",
    source: "Stripe",
    destination: "Spreadsheet",
    description: "Ironside Data — failed payment",
    amount: 4200,
    date: "Apr 18",
    confidence: "manual",
    matchReason: null,
    flag: "Failed payment — not in spreadsheet at all. Manual entry needed.",
  },
  {
    id: "7",
    source: "Stripe",
    destination: "Spreadsheet",
    description: "Apex Solutions — first payment",
    amount: 880,
    date: "Apr 15",
    confidence: "manual",
    matchReason: null,
    flag: "New customer — not in spreadsheet. Add row and assign account owner.",
  },
];

const CONF_META: Record<Confidence, { label: string; tone: "sage" | "mustard" | "brick"; desc: string }> = {
  auto:   { label: "Auto-match",    tone: "sage",    desc: "Safe to accept — high confidence" },
  review: { label: "Needs review",  tone: "mustard", desc: "Ambiguous — verify before accepting" },
  manual: { label: "Manual entry",  tone: "brick",   desc: "No match found — requires human action" },
};

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export default async function ReconciliationPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const auto   = RECON_ITEMS.filter((r) => r.confidence === "auto");
  const review = RECON_ITEMS.filter((r) => r.confidence === "review");
  const manual = RECON_ITEMS.filter((r) => r.confidence === "manual");

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
            <PageTitle>Reconciliation Queue</PageTitle>
            <Hint>
              Match receipts and records across Stripe, spreadsheets, and CRM.
              Auto-match = safe. Review = verify first. Manual = no match found.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <CheckCircle2 className="size-3.5" /> Accept all auto
          </button>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Auto-match" value={String(auto.length)} tone="sage" />
          <StatCard label="Needs review" value={String(review.length)} tone="mustard" />
          <StatCard label="Manual entry" value={String(manual.length)} tone="brick" />
        </div>

        {(["auto", "review", "manual"] as Confidence[]).map((conf) => {
          const items = RECON_ITEMS.filter((r) => r.confidence === conf);
          const meta = CONF_META[conf];
          return (
            <div key={conf} className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill tone={meta.tone}>{meta.label}</Pill>
                <span className="text-xs text-ink-muted">{meta.desc} · {items.length} items</span>
              </div>
              <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 space-y-1.5 ${i < items.length - 1 ? "border-b border-line/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-ink">{item.description}</div>
                        <div className="text-2xs text-ink-muted mt-0.5">
                          {item.source} → {item.destination} · {item.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-medium text-ink">
                          {fmtUsd(item.amount)}
                        </span>
                        {conf === "auto" && (
                          <button
                            type="button"
                            className="text-2xs border border-sage/40 rounded px-2 py-0.5 text-sage-ink bg-sage/5 hover:bg-sage/10"
                          >
                            Accept
                          </button>
                        )}
                        {conf !== "auto" && (
                          <button
                            type="button"
                            className="text-2xs border border-line/70 rounded px-2 py-0.5 text-ink-muted hover:border-line-strong"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                    {item.matchReason && (
                      <div className="text-2xs text-ink-muted bg-canvas/60 rounded px-2 py-1 border border-line/40">
                        {item.matchReason}
                      </div>
                    )}
                    {item.flag && (
                      <div className="text-2xs text-brick-ink bg-brick/5 rounded px-2 py-1 border border-brick/20">
                        {item.flag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
