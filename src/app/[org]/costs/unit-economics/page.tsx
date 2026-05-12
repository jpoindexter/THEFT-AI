import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { TrendingDown } from "lucide-react";

const MOCK_ECONOMICS = {
  mrr: 12400,
  arpu: 248,
  ltv: 2976,
  cac: 620,
  paybackMonths: 2.5,
  grossMarginPct: 82,
  monthlyChurnPct: 3.2,
  revenueChurnPct: 2.8,
};

const CHURN_HISTORY = [
  { month: "Nov", logo: 2.8, revenue: 2.4 },
  { month: "Dec", logo: 3.1, revenue: 2.7 },
  { month: "Jan", logo: 4.0, revenue: 3.5 },
  { month: "Feb", logo: 3.6, revenue: 3.1 },
  { month: "Mar", logo: 3.2, revenue: 2.9 },
  { month: "Apr", logo: 3.2, revenue: 2.8 },
];

const COHORTS = [
  { month: "Nov 2024", customers: 18, d30: 17, d60: 15, d90: 14 },
  { month: "Dec 2024", customers: 22, d30: 21, d60: 18, d90: 17 },
  { month: "Jan 2025", customers: 16, d30: 15, d60: 13, d90: null },
  { month: "Feb 2025", customers: 24, d30: 22, d60: 19, d90: null },
  { month: "Mar 2025", customers: 20, d30: 19, d60: null, d90: null },
  { month: "Apr 2025", customers: 28, d30: null, d60: null, d90: null },
];

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

function RetentionCell({ cohort, retained }: { cohort: number; retained: number | null }) {
  if (retained === null) return <td className="px-4 py-2.5 text-xs text-ink-soft">—</td>;
  const pctVal = Math.round((retained / cohort) * 100);
  const cls = pctVal >= 85 ? "text-sage-ink" : pctVal >= 70 ? "text-mustard-ink" : "text-brick-ink";
  return (
    <td className="px-4 py-2.5 text-xs">
      <span className={cls}>{pctVal}%</span>
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

  const e = MOCK_ECONOMICS;
  const ltvCac = (e.ltv / e.cac).toFixed(1);
  const ltvCacNum = parseFloat(ltvCac);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <PageTitle>Unit Economics</PageTitle>
            <Hint>LTV, CAC, churn, and payback — the numbers that determine if the business is structurally sound.</Hint>
          </div>
          <Link href={`/${org}/costs`} className="text-xs text-ink-muted hover:text-ink">
            ← Agent costs
          </Link>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="MRR" value={fmtUsd(e.mrr)} />
          <StatCard label="ARPU" value={fmtUsd(e.arpu)} />
          <StatCard label="LTV" value={fmtUsd(e.ltv)} tone="sage" />
          <StatCard label="CAC" value={fmtUsd(e.cac)} />
          <StatCard
            label="LTV : CAC"
            value={`${ltvCac}×`}
            tone={ltvCacNum >= 3 ? "sage" : "mustard"}
          />
          <StatCard
            label="Payback period"
            value={`${e.paybackMonths}mo`}
            tone={e.paybackMonths <= 6 ? "sage" : "mustard"}
          />
          <StatCard label="Gross margin" value={`${e.grossMarginPct}%`} />
          <StatCard
            label="Monthly churn"
            value={`${e.monthlyChurnPct}%`}
            tone={e.monthlyChurnPct > 5 ? "brick" : e.monthlyChurnPct > 3 ? "mustard" : "sage"}
          />
        </div>

        {/* Formula reference */}
        <div className="rounded-xl border border-line/70 bg-canvas/40 p-4 space-y-2">
          <Eyebrow>Formulas</Eyebrow>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-ink-muted font-mono">
            <span>LTV = ARPU / monthly churn %</span>
            <span>LTV:CAC target = 3:1 minimum</span>
            <span>CAC = total sales + mktg / new customers</span>
            <span>Payback = CAC / (ARPU × gross margin)</span>
          </div>
        </div>

        {/* Churn */}
        <div className="space-y-2">
          <Eyebrow>Churn — last 6 months</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <div className="grid grid-cols-3 gap-3 p-4">
              <div className="space-y-1">
                <div className="text-2xs uppercase tracking-wider text-ink-soft">Logo churn (this month)</div>
                <div className="text-2xl font-medium tracking-tight text-ink">{e.monthlyChurnPct}%</div>
                <div className="inline-flex items-center gap-1 text-xs text-sage-ink">
                  <TrendingDown className="size-3" /> −0.4pp vs last month
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xs uppercase tracking-wider text-ink-soft">Revenue churn</div>
                <div className="text-2xl font-medium tracking-tight text-ink">{e.revenueChurnPct}%</div>
                <div className="inline-flex items-center gap-1 text-xs text-sage-ink">
                  <TrendingDown className="size-3" /> −0.3pp vs last month
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xs uppercase tracking-wider text-ink-soft">Churned last 30d</div>
                <div className="text-2xl font-medium tracking-tight text-ink">2</div>
                <div className="text-xs text-ink-muted">customers</div>
              </div>
            </div>

            <div className="border-t border-line/40 p-4">
              <div className="flex items-end gap-2 h-20">
                {CHURN_HISTORY.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-14">
                      <div
                        className="flex-1 rounded-sm bg-brick/30"
                        style={{ height: `${(d.logo / 5) * 100}%` }}
                        title={`Logo ${d.logo}%`}
                      />
                      <div
                        className="flex-1 rounded-sm bg-mustard/40"
                        style={{ height: `${(d.revenue / 5) * 100}%` }}
                        title={`Revenue ${d.revenue}%`}
                      />
                    </div>
                    <div className="text-2xs text-ink-soft">{d.month}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 text-2xs text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-brick/30 inline-block" /> Logo churn
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-mustard/40 inline-block" /> Revenue churn
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cohort retention */}
        <div className="space-y-2">
          <Eyebrow>Customer cohort retention</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Cohort</th>
                  <th className="text-left px-4 py-2 font-medium">Customers</th>
                  <th className="text-left px-4 py-2 font-medium">30d</th>
                  <th className="text-left px-4 py-2 font-medium">60d</th>
                  <th className="text-left px-4 py-2 font-medium">90d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {COHORTS.map((c) => (
                  <tr key={c.month} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-ink">{c.month}</td>
                    <td className="px-4 py-2.5 text-xs text-ink">{c.customers}</td>
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
