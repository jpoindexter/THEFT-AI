import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";

export default async function CostsPage({
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

  const total = usage.reduce((s, u) => s + u.cost_usd, 0);
  const budget = o.budget_monthly_usd ?? 800;
  const pctOfBudget = Math.min(100, (total / budget) * 100);

  const byAgent = new Map<string, { model: string; spent: number }>();
  for (const u of usage) {
    const name = u.agent_name ?? "Unknown";
    const existing = byAgent.get(name);
    if (existing) {
      existing.spent += u.cost_usd;
    } else {
      byAgent.set(name, { model: u.model, spent: u.cost_usd });
    }
  }
  const agentRows = [...byAgent.entries()]
    .map(([agent, d]) => ({ agent, ...d }))
    .sort((a, b) => b.spent - a.spent);

  // Build last-14-days series
  const series: number[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const dayStr = d.toISOString().slice(0, 10);
    return usage
      .filter((u) => u.created_at.startsWith(dayStr))
      .reduce((s, u) => s + u.cost_usd, 0);
  });
  const max = Math.max(...series, 1);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Costs</h1>
            <p className="text-sm text-ink-muted">
              Token usage, model spend, and per-agent costs across the workspace.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/${org}/costs/breakdown`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Breakdown
            </Link>
            <Link
              href={`/${org}/costs/budget`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Budget & limits
            </Link>
          </div>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">
              ${total.toFixed(2)} of ${budget} monthly budget
            </span>
            <span className="font-mono text-ink-soft">
              {pctOfBudget.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-cream overflow-hidden">
            <div
              className={`h-full ${pctOfBudget > 80 ? "bg-brick" : "bg-sage"}`}
              style={{ width: `${pctOfBudget}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="This month" value={`$${total.toFixed(2)}`} />
          <Stat label="Agents" value={String(byAgent.size || 0)} />
          <Stat label="Runs" value={String(usage.length)} />
        </div>

        <section className="rounded-lg border border-line/70 bg-paper p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Last 14 days
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {series.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-mustard/40"
                style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "2px" : "0" }}
                title={`$${v.toFixed(4)}`}
              />
            ))}
          </div>
          {total === 0 && (
            <p className="text-xs text-ink-muted text-center mt-2">
              No usage recorded yet. Usage will appear once agents run tasks.
            </p>
          )}
        </section>

        {agentRows.length > 0 && (
          <section className="rounded-lg border border-line/70 bg-paper">
            <header className="px-4 py-2 border-b border-line/70 text-2xs uppercase tracking-wider text-ink-soft">
              Per agent
            </header>
            <div className="divide-y divide-line/60">
              {agentRows.map((r) => (
                <div
                  key={r.agent}
                  className="px-4 py-2 flex items-center justify-between text-base"
                >
                  <div>
                    <div className="font-medium">{r.agent}</div>
                    <div className="text-2xs text-ink-muted font-mono">
                      {r.model}
                    </div>
                  </div>
                  <div className="font-mono text-sm">${r.spent.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-paper p-3">
      <div className="text-2xs uppercase tracking-wider text-ink-soft">
        {label}
      </div>
      <div className="text-2xl tracking-tight font-medium mt-1">{value}</div>
    </div>
  );
}
