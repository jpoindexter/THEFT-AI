import Link from "next/link";

const SERIES = [3, 8, 5, 12, 18, 14, 22, 30, 28, 36, 41, 38, 47, 52];
const MONTHLY_BUDGET = 800;

export default async function CostsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const max = Math.max(...SERIES);
  const total = SERIES.reduce((a, b) => a + b, 0);
  const pctOfBudget = Math.min(100, (total / MONTHLY_BUDGET) * 100);
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Costs</h1>
            <p className="text-[12px] text-ink-muted">
              Token usage, model spend, and per-agent costs across the workspace.
            </p>
          </div>
          <Link
            href={`/${org}/costs/budget`}
            className="text-[11px] rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
          >
            Budget & limits
          </Link>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-muted">
              ${total.toFixed(2)} of ${MONTHLY_BUDGET} monthly budget
            </span>
            <span className="font-mono text-ink-soft">
              {pctOfBudget.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-cream overflow-hidden">
            <div
              className={`h-full ${
                pctOfBudget > 80 ? "bg-red-500" : "bg-emerald-500"
              }`}
              style={{ width: `${pctOfBudget}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="This month" value={`$${total.toFixed(2)}`} />
          <Stat label="Last month" value="$214.83" />
          <Stat label="Daily average" value="$3.71" />
        </div>

        <section className="rounded-lg border border-line/70 bg-paper p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-soft">
              Last 14 days
            </div>
            <select className="text-[11px] rounded-md border border-line bg-paper px-2 py-0.5">
              <option>By day</option>
              <option>By agent</option>
              <option>By model</option>
            </select>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {SERIES.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-amber-200/80"
                style={{ height: `${(v / max) * 100}%` }}
                title={`Day ${i + 1}: $${v}`}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper">
          <header className="px-4 py-2 border-b border-line/70 text-[10px] uppercase tracking-wider text-ink-soft">
            Per agent
          </header>
          <div className="divide-y divide-line/60">
            {[
              { agent: "Engineer", model: "claude-sonnet-4-6", spent: 142.5 },
              { agent: "Marketing", model: "claude-sonnet-4-6", spent: 38.2 },
              { agent: "Design", model: "claude-opus-4-7", spent: 76.4 },
              { agent: "Sales", model: "claude-sonnet-4-6", spent: 12.0 },
            ].map((r) => (
              <div
                key={r.agent}
                className="px-4 py-2 flex items-center justify-between text-[13px]"
              >
                <div>
                  <div className="font-medium">{r.agent}</div>
                  <div className="text-[10px] text-ink-muted font-mono">
                    {r.model}
                  </div>
                </div>
                <div className="font-mono text-[12px]">
                  ${r.spent.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-paper p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-soft">
        {label}
      </div>
      <div className="text-2xl tracking-tight font-medium mt-1">{value}</div>
    </div>
  );
}
