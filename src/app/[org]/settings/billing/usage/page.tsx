import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const MOCK_PLAN = {
  name: "Growth",
  agentSeats: 12,
  monthlyUsd: 299,
  renewsOn: "Jun 1, 2026",
  features: [
    "12 agent seats",
    "Unlimited tasks",
    "Priority model access",
    "Eval suites",
    "Managed services",
  ],
};

const MOCK_INVOICES = [
  { id: "INV-2026-04", period: "Apr 2026", amount: 299, status: "paid",    date: "May 1, 2026" },
  { id: "INV-2026-03", period: "Mar 2026", amount: 299, status: "paid",    date: "Apr 1, 2026" },
  { id: "INV-2026-02", period: "Feb 2026", amount: 299, status: "paid",    date: "Mar 1, 2026" },
  { id: "INV-2026-01", period: "Jan 2026", amount: 249, status: "paid",    date: "Feb 1, 2026" },
];

export default async function BillingUsagePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const usage = await db.listUsage(o.id, { since: monthStart });

  const totalCost = usage.reduce((s, u) => s + u.cost_usd, 0);
  const totalInputTokens = usage.reduce((s, u) => s + u.input_tokens, 0);
  const totalOutputTokens = usage.reduce((s, u) => s + u.output_tokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const budget = o.budget_monthly_usd ?? MOCK_PLAN.monthlyUsd;
  const pct = Math.min(100, (totalCost / budget) * 100);

  const byModel = new Map<string, { cost: number; runs: number }>();
  for (const u of usage) {
    const existing = byModel.get(u.model);
    if (existing) {
      existing.cost += u.cost_usd;
      existing.runs += 1;
    } else {
      byModel.set(u.model, { cost: u.cost_usd, runs: 1 });
    }
  }
  const modelRows = [...byModel.entries()]
    .map(([model, d]) => ({ model, ...d }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <>
      <Link
        href={`/${org}/settings/billing`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="size-3" /> Billing
      </Link>

      <SectionHeader
        title="Billing & Usage"
        description={`Current period: ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`}
      />

      {/* Plan */}
      <SettingsCard title="Current plan">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold">{MOCK_PLAN.name}</div>
            <div className="text-xs text-ink-muted mt-0.5">
              ${MOCK_PLAN.monthlyUsd}/mo · renews {MOCK_PLAN.renewsOn}
            </div>
            <ul className="mt-3 space-y-1">
              {MOCK_PLAN.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <CheckCircle2 className="size-3 text-sage-ink shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href={`/${org}/billing/upgrade`}
            className="text-xs rounded-md border border-line px-2 py-1 hover:border-line-strong shrink-0"
          >
            Upgrade
          </Link>
        </div>
      </SettingsCard>

      {/* Usage summary */}
      <SettingsCard title="This month's usage">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">
              ${totalCost.toFixed(2)} of ${budget} AI budget
            </span>
            <span className="font-mono text-ink-soft">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-cream overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 80 ? "bg-brick" : "bg-sage"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Total cost", value: `$${totalCost.toFixed(2)}` },
              { label: "Total tokens", value: totalTokens.toLocaleString() },
              { label: "Runs", value: String(usage.length) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md border border-line/60 bg-canvas p-2.5">
                <div className="text-2xs text-ink-soft uppercase tracking-wider">{label}</div>
                <div className="font-mono text-sm mt-1">{value}</div>
              </div>
            ))}
          </div>
          {modelRows.length > 0 && (
            <div className="rounded-md border border-line/60 overflow-hidden mt-1">
              <div className="px-3 py-1.5 text-2xs uppercase tracking-wider text-ink-soft border-b border-line/60 bg-canvas">
                By model
              </div>
              {modelRows.map((r) => (
                <div key={r.model} className="flex items-center justify-between px-3 py-2 text-xs border-b border-line/40 last:border-0">
                  <span className="font-mono text-ink-muted">{r.model}</span>
                  <span className="font-mono">${r.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
          {usage.length === 0 && (
            <p className="text-xs text-ink-muted text-center py-2">
              No usage recorded this period.
            </p>
          )}
        </div>
      </SettingsCard>

      {/* Invoice history */}
      <SettingsCard title="Invoice history">
        <div className="rounded-md border border-line/60 overflow-hidden">
          {MOCK_INVOICES.map((inv, i) => (
            <div
              key={inv.id}
              className={`flex items-center justify-between px-3 py-2.5 text-xs ${i < MOCK_INVOICES.length - 1 ? "border-b border-line/40" : ""}`}
            >
              <div>
                <div className="font-medium">{inv.period}</div>
                <div className="text-ink-muted font-mono">{inv.id} · {inv.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">${inv.amount}</span>
                <span className="text-sage-ink">{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>
    </>
  );
}
