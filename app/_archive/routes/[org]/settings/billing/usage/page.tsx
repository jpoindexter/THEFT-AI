import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { ArrowLeft } from "lucide-react";

const DEFAULT_BUDGET_USD = 299;

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
  const budget = o.budget_monthly_usd ?? DEFAULT_BUDGET_USD;
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
        <p className="text-xs text-ink-muted text-center py-2">
          No invoices yet — your first invoice posts at the end of the billing cycle.
        </p>
      </SettingsCard>
    </>
  );
}
