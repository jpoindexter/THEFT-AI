import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow } from "@/components/ui/primitives";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "flat";

const METRICS: {
  label: string;
  value: string;
  formula: string;
  trend: Trend;
  trendLabel: string;
}[] = [
  {
    label: "MRR",
    value: "$12,400",
    formula: "MRR = sum of monthly recurring revenue",
    trend: "up",
    trendLabel: "+8% vs last month",
  },
  {
    label: "ARPU",
    value: "$248",
    formula: "ARPU = MRR / active customers",
    trend: "up",
    trendLabel: "+3% vs last month",
  },
  {
    label: "LTV",
    value: "$2,976",
    formula: "LTV = ARPU × avg lifetime (mo)",
    trend: "up",
    trendLabel: "+5% vs last month",
  },
  {
    label: "CAC",
    value: "$620",
    formula: "CAC = total sales + mktg / new customers",
    trend: "down",
    trendLabel: "−4% vs last month",
  },
  {
    label: "LTV : CAC",
    value: "4.8×",
    formula: "LTV:CAC = LTV / CAC (target ≥ 3×)",
    trend: "up",
    trendLabel: "+0.3× vs last month",
  },
  {
    label: "Payback period",
    value: "2.5mo",
    formula: "Payback = CAC / (ARPU × gross margin)",
    trend: "flat",
    trendLabel: "No change",
  },
  {
    label: "Monthly churn",
    value: "3.2%",
    formula: "Churn = churned customers / total at start of month",
    trend: "down",
    trendLabel: "−0.4pp vs last month",
  },
];

// Bar chart: 6 months of logo churn %
const CHURN_HISTORY = [
  { month: "Nov", logo: 2.8 },
  { month: "Dec", logo: 3.1 },
  { month: "Jan", logo: 4.0 },
  { month: "Feb", logo: 3.6 },
  { month: "Mar", logo: 3.2 },
  { month: "Apr", logo: 3.2 },
] as const;

const CHURN_MAX = Math.max(...CHURN_HISTORY.map((d) => d.logo), 1);

// 4 cohort rows
const COHORTS = [
  { month: "Jan 2025", customers: 16, d30: 15, d60: 13, d90: 12 },
  { month: "Feb 2025", customers: 24, d30: 22, d60: 19, d90: null },
  { month: "Mar 2025", customers: 20, d30: 19, d60: null, d90: null },
  { month: "Apr 2025", customers: 28, d30: null, d60: null, d90: null },
] as const;

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up")
    return <TrendingUp className="size-3 text-sage-ink" aria-hidden />;
  if (trend === "down")
    return <TrendingDown className="size-3 text-brick-ink" aria-hidden />;
  return <Minus className="size-3 text-ink-soft" aria-hidden />;
}

function MetricCard({
  label,
  value,
  formula,
  trend,
  trendLabel,
}: (typeof METRICS)[number]) {
  return (
    <div className="rounded-md border border-line/70 bg-paper p-3 flex flex-col gap-1">
      <div className="text-2xs uppercase tracking-wider text-ink-soft">
        {label}
      </div>
      <div className="text-xl font-medium tracking-tight text-ink">{value}</div>
      <div className="text-2xs text-ink-soft font-mono leading-snug">{formula}</div>
      <div className="flex items-center gap-1 mt-0.5">
        <TrendIcon trend={trend} />
        <span
          className={`text-2xs ${
            trend === "up"
              ? "text-sage-ink"
              : trend === "down"
              ? "text-brick-ink"
              : "text-ink-soft"
          }`}
        >
          {trendLabel}
        </span>
      </div>
    </div>
  );
}

function RetentionCell({
  cohort,
  retained,
}: {
  cohort: number;
  retained: number | null;
}) {
  if (retained === null)
    return <td className="px-4 py-2.5 text-xs text-ink-soft">—</td>;
  const pct = Math.round((retained / cohort) * 100);
  const cls =
    pct >= 85
      ? "text-sage-ink"
      : pct >= 70
      ? "text-mustard-ink"
      : "text-brick-ink";
  return (
    <td className="px-4 py-2.5 text-xs">
      <span className={cls}>{pct}%</span>
      <span className="text-ink-soft ml-1">({retained})</span>
    </td>
  );
}

export default async function UnitEconomicsPage({
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
        <header className="flex items-start justify-between">
          <div>
            <PageTitle>Unit Economics</PageTitle>
            <Hint>
              LTV, CAC, churn, and payback — the numbers that determine if the
              business is structurally sound.
            </Hint>
          </div>
          <Link
            href={`/${org}/costs`}
            className="text-xs text-ink-muted hover:text-ink"
          >
            ← Agent costs
          </Link>
        </header>

        {/* 7 metric cards */}
        <div className="grid grid-cols-4 gap-3">
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Bar chart: monthly logo churn % */}
        <div className="space-y-2">
          <Eyebrow>Monthly logo churn % — last 6 months</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper p-4">
            <div className="flex items-end gap-2 h-24">
              {CHURN_HISTORY.map((d) => (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-sm bg-brick/35"
                    style={{ height: `${(d.logo / CHURN_MAX) * 80}px` }}
                    title={`${d.logo}%`}
                    role="img"
                    aria-label={`${d.month}: ${d.logo}% churn`}
                  />
                  <div className="text-2xs text-ink-soft">{d.month}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-2xs text-ink-muted mt-2">
              <span>0%</span>
              <span>{CHURN_MAX}% max</span>
            </div>
          </div>
        </div>

        {/* Cohort retention table */}
        <div className="space-y-2">
          <Eyebrow>Customer cohort retention</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Cohort</th>
                  <th className="text-left px-4 py-2 font-medium">Customers</th>
                  <th className="text-left px-4 py-2 font-medium">Retained 30d</th>
                  <th className="text-left px-4 py-2 font-medium">Retained 60d</th>
                  <th className="text-left px-4 py-2 font-medium">Retained 90d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {COHORTS.map((c) => (
                  <tr key={c.month} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-ink">
                      {c.month}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink">
                      {c.customers}
                    </td>
                    <RetentionCell cohort={c.customers} retained={c.d30} />
                    <RetentionCell cohort={c.customers} retained={c.d60} />
                    <RetentionCell cohort={c.customers} retained={c.d90} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
