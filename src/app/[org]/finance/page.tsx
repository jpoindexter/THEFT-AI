import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import {
  DollarSign,
  AlertCircle,
  CreditCard,
  RotateCcw,
  FileText,
  Inbox,
  TrendingDown,
} from "lucide-react";

const DAILY_BRIEF = [
  { priority: 1, action: "2 invoices overdue >60d — escalate Ironside Data ($4,200) and Nucleus Labs ($1,800)" },
  { priority: 2, action: "3 failed payment retries queued — review before 5pm, retry window closes" },
  { priority: 3, action: "Month-end close due in 4 days — billing summary and export pack not started" },
  { priority: 4, action: "1 refund request pending >7d — Lumina Studio ($320), needs decision" },
  { priority: 5, action: "Stripe balance: $28,400 available, $1,200 reserved for disputes" },
];

const NAV_SECTIONS = [
  {
    href: "finance/collections",
    label: "Collections",
    description: "Overdue invoices, dunning queue, escalation tracker.",
    icon: AlertCircle,
    stat: "3 overdue",
    tone: "brick",
  },
  {
    href: "finance/close",
    label: "Month-End Close",
    description: "Billing summary, export pack, accounting handoff.",
    icon: FileText,
    stat: "4 days left",
    tone: "mustard",
  },
];

const RECENT_ACTIVITY = [
  { event: "Invoice paid",      company: "Blueridge Capital",  amount: 24000, time: "2h ago",  tone: "sage"    },
  { event: "Payment failed",    company: "Nucleus Labs",        amount: 1800,  time: "4h ago",  tone: "brick"   },
  { event: "Refund requested",  company: "Lumina Studio",       amount: 320,   time: "1d ago",  tone: "mustard" },
  { event: "Invoice sent",      company: "Clearpath Tech",      amount: 9100,  time: "1d ago",  tone: "neutral" },
  { event: "Payment failed",    company: "Ironside Data",       amount: 4200,  time: "2d ago",  tone: "brick"   },
  { event: "Invoice paid",      company: "Draftline Media",     amount: 4200,  time: "3d ago",  tone: "sage"    },
];

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export default async function FinancePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header>
          <PageTitle>Finance</PageTitle>
          <Hint>
            Billing, collections, close support, and accounting handoff. The
            Finance Agent handles exception queues — you handle judgment calls.
          </Hint>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Stripe balance" value="$28,400" />
          <StatCard label="Overdue MRR" value="$6,000" tone="brick" />
          <StatCard label="Failed payments" value="3" tone="brick" />
          <StatCard label="Pending refunds" value="1" tone="mustard" />
        </div>

        {/* Daily brief */}
        <div className="space-y-2">
          <Eyebrow>Daily brief — Finance Agent</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {DAILY_BRIEF.map((item, i) => (
              <div
                key={item.priority}
                className={`flex items-start gap-3 px-4 py-3 ${i < DAILY_BRIEF.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <span className="size-5 rounded-full bg-canvas border border-line/70 text-2xs text-ink-soft flex items-center justify-center shrink-0 mt-0.5">
                  {item.priority}
                </span>
                <span className="text-xs text-ink leading-snug">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav sections */}
        <div className="grid grid-cols-2 gap-3">
          {NAV_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={`/${org}/${s.href}`}
                className="group rounded-xl border border-line/70 bg-paper p-4 hover:border-line-strong transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-lg bg-canvas border border-line/70 flex items-center justify-center">
                    <Icon className="size-4 text-ink-muted" />
                  </div>
                  <span
                    className={`text-2xs px-2 py-0.5 rounded-full border font-medium ${
                      s.tone === "brick"
                        ? "bg-brick/10 border-brick/30 text-brick-ink"
                        : s.tone === "mustard"
                          ? "bg-mustard/10 border-mustard/30 text-mustard-ink"
                          : "bg-canvas border-line/70 text-ink-muted"
                    }`}
                  >
                    {s.stat}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                    {s.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent activity */}
        <div className="space-y-2">
          <Eyebrow>Recent billing activity</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {RECENT_ACTIVITY.map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < RECENT_ACTIVITY.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <div
                  className={`size-1.5 rounded-full shrink-0 ${
                    row.tone === "sage"
                      ? "bg-sage-ink"
                      : row.tone === "brick"
                        ? "bg-brick-ink"
                        : row.tone === "mustard"
                          ? "bg-mustard-ink"
                          : "bg-line-strong"
                  }`}
                />
                <span className="flex-1 text-xs text-ink-muted">{row.event}</span>
                <span className="text-xs font-medium text-ink">{row.company}</span>
                <span className="text-xs font-mono text-ink w-20 text-right">
                  {fmtUsd(row.amount)}
                </span>
                <span className="text-2xs text-ink-soft w-14 text-right">{row.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
