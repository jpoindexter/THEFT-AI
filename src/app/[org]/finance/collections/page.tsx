import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill, StatCard } from "@/components/ui/primitives";
import { ArrowLeft, Mail, PhoneCall } from "lucide-react";

type RiskTier = "critical" | "warning" | "watch";

type CollectionsItem = {
  id: string;
  company: string;
  contact: string;
  amount: number;
  daysOverdue: number;
  invoiceRef: string;
  lastAction: string;
  risk: RiskTier;
  notes: string | null;
};

const COLLECTIONS: CollectionsItem[] = [
  {
    id: "1",
    company: "Ironside Data",
    contact: "Nick Russo",
    amount: 4200,
    daysOverdue: 68,
    invoiceRef: "INV-0441",
    lastAction: "2nd reminder sent 3w ago",
    risk: "critical",
    notes: "VP Sales. Previously paid on time. Card on file declined twice.",
  },
  {
    id: "2",
    company: "Nucleus Labs",
    contact: "Emma Sato",
    amount: 1800,
    daysOverdue: 61,
    invoiceRef: "INV-0439",
    lastAction: "1st reminder sent 4w ago",
    risk: "critical",
    notes: "COO — Expanded to EU, may have billing entity change. Follow up.",
  },
  {
    id: "3",
    company: "Draftline Media",
    contact: "Tom Walsh",
    amount: 2400,
    daysOverdue: 34,
    invoiceRef: "INV-0447",
    lastAction: "Auto-reminder sent 1w ago",
    risk: "warning",
    notes: null,
  },
  {
    id: "4",
    company: "Apex Solutions",
    contact: "Lia Ferreira",
    amount: 880,
    daysOverdue: 18,
    invoiceRef: "INV-0451",
    lastAction: "Invoice sent — no reply",
    risk: "watch",
    notes: null,
  },
  {
    id: "5",
    company: "Clearpath Tech",
    contact: "Marcus Hill",
    amount: 9100,
    daysOverdue: 11,
    invoiceRef: "INV-0453",
    lastAction: "Invoice sent 11d ago",
    risk: "watch",
    notes: "CTO — large deal, give until 30d before escalating.",
  },
];

const RISK_META: Record<RiskTier, { label: string; tone: "brick" | "mustard" | "neutral"; desc: string }> = {
  critical: { label: "Critical",  tone: "brick",    desc: ">60d overdue — escalate now"        },
  warning:  { label: "Warning",   tone: "mustard",  desc: "30–60d overdue — follow up this week" },
  watch:    { label: "Watch",     tone: "neutral",  desc: "<30d overdue — auto-remind active"    },
};

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const critical = COLLECTIONS.filter((c) => c.risk === "critical");
  const warning = COLLECTIONS.filter((c) => c.risk === "warning");
  const watch = COLLECTIONS.filter((c) => c.risk === "watch");
  const totalOverdue = COLLECTIONS.reduce((s, c) => s + c.amount, 0);

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
            <PageTitle>Collections Queue</PageTitle>
            <Hint>
              Overdue invoices grouped by severity. Critical = escalate now.
              Warning = follow up this week. Watch = auto-remind running.
            </Hint>
          </div>
          <button
            type="button"
            className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            Run dunning
          </button>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total overdue" value={fmtUsd(totalOverdue)} tone="brick" />
          <StatCard label="Critical (>60d)" value={String(critical.length)} tone="brick" />
          <StatCard label="Warning (30–60d)" value={String(warning.length)} tone="mustard" />
          <StatCard label="Watch (<30d)" value={String(watch.length)} />
        </div>

        {(["critical", "warning", "watch"] as RiskTier[]).map((tier) => {
          const items = COLLECTIONS.filter((c) => c.risk === tier);
          if (items.length === 0) return null;
          const meta = RISK_META[tier];
          return (
            <div key={tier} className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill tone={meta.tone}>{meta.label}</Pill>
                <span className="text-xs text-ink-muted">{meta.desc} · {items.length} accounts</span>
              </div>
              <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 space-y-1.5 ${i < items.length - 1 ? "border-b border-line/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-ink">{item.company}</div>
                        <div className="text-2xs text-ink-muted">{item.contact} · {item.invoiceRef}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-medium text-ink">{fmtUsd(item.amount)}</span>
                        <span
                          className={`text-2xs font-medium ${
                            item.daysOverdue > 60
                              ? "text-brick-ink"
                              : item.daysOverdue > 30
                                ? "text-mustard-ink"
                                : "text-ink-muted"
                          }`}
                        >
                          {item.daysOverdue}d overdue
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-2xs border border-line/70 rounded px-2 py-0.5 hover:border-line-strong text-ink-muted"
                          >
                            <Mail className="size-2.5" /> Remind
                          </button>
                          {tier === "critical" && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-2xs border border-brick/40 rounded px-2 py-0.5 hover:border-brick/60 text-brick-ink bg-brick/5"
                            >
                              <PhoneCall className="size-2.5" /> Escalate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xs text-ink-soft">Last action: {item.lastAction}</div>
                    {item.notes && (
                      <div className="text-2xs text-ink-muted bg-canvas/60 rounded px-2 py-1 border border-line/40">
                        {item.notes}
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
