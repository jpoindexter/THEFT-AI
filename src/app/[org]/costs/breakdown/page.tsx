import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  StatCard,
} from "@/components/ui/primitives";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { db } from "@/lib/db/store";

const MODELS = ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"];

export default async function CostBreakdownPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const usage = await db.listUsage(o.id, { since: fourteenDaysAgo });
  const thisWeek = usage.filter((u) => u.created_at >= sevenDaysAgo);
  const prevWeek = usage.filter((u) => u.created_at >= fourteenDaysAgo && u.created_at < sevenDaysAgo);

  const total = thisWeek.reduce((s, u) => s + u.cost_usd, 0);
  const prevTotal = prevWeek.reduce((s, u) => s + u.cost_usd, 0);
  const delta = total - prevTotal;
  const deltaPct = prevTotal > 0 ? Math.round((delta / prevTotal) * 100) : 0;

  // Build agent × model matrix
  const agentSet = new Set(thisWeek.map((u) => u.agent_name ?? "Unknown"));
  const agents = [...agentSet].sort();
  const matrix: Record<string, Record<string, number>> = {};
  for (const a of agents) {
    matrix[a] = {};
    for (const m of MODELS) matrix[a][m] = 0;
  }
  for (const u of thisWeek) {
    const a = u.agent_name ?? "Unknown";
    const m = u.model;
    if (!matrix[a]) matrix[a] = {};
    matrix[a][m] = (matrix[a][m] ?? 0) + u.cost_usd;
  }

  const allCells = agents.flatMap((a) => MODELS.map((m) => matrix[a]?.[m] ?? 0));
  const max = Math.max(0.001, ...allCells);

  const topDriver = [...thisWeek]
    .sort((a, b) => b.cost_usd - a.cost_usd)[0];

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href={`/${org}/costs`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to costs
        </Link>

        <header>
          <Eyebrow>This week</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <BarChart3 className="size-5 text-ink-muted" /> Spend breakdown
          </PageTitle>
          <Hint>
            Agent × model heatmap of API spend. Use it to spot whether
            Sonnet would do the same job as Opus on a given agent.
          </Hint>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={`$${total.toFixed(2)}`} />
          <StatCard
            label="vs last week"
            tone={delta >= 0 ? "mustard" : "sage"}
            value={
              <span className="inline-flex items-center gap-1">
                {delta >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                {delta >= 0 ? "+" : ""}${Math.abs(delta).toFixed(2)} ({deltaPct >= 0 ? "+" : ""}{deltaPct}%)
              </span>
            }
          />
          <StatCard
            label="Top driver"
            value={topDriver ? `${topDriver.agent_name ?? "?"} · ${topDriver.model.replace("claude-", "").split("-")[0]}` : "—"}
          />
        </div>

        {agents.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-ink-muted text-center py-4">
                No spend recorded this week.
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="p-0">
              <div
                className="grid border-b border-line/60 text-2xs uppercase tracking-wider text-ink-soft"
                style={{ gridTemplateColumns: `140px repeat(${MODELS.length}, 1fr) 80px` }}
              >
                <div className="px-3 py-2">Agent</div>
                {MODELS.map((m) => (
                  <div key={m} className="px-3 py-2 font-mono normal-case tracking-normal">
                    {m.replace("claude-", "")}
                  </div>
                ))}
                <div className="px-3 py-2 text-right">Total</div>
              </div>
              <div className="divide-y divide-line/60">
                {agents.map((a) => {
                  const rowTotal = MODELS.reduce((s, m) => s + (matrix[a]?.[m] ?? 0), 0);
                  return (
                    <div
                      key={a}
                      className="grid items-center text-sm"
                      style={{ gridTemplateColumns: `140px repeat(${MODELS.length}, 1fr) 80px` }}
                    >
                      <div className="px-3 py-2 font-medium tracking-tight truncate">{a}</div>
                      {MODELS.map((m) => (
                        <Cell key={m} v={matrix[a]?.[m] ?? 0} max={max} />
                      ))}
                      <div className="px-3 py-2 text-right text-ink-muted">
                        ${rowTotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function Cell({ v, max }: { v: number; max: number }) {
  if (v === 0) {
    return <div className="px-3 py-2 text-2xs text-ink-soft">—</div>;
  }
  const intensity = Math.min(1, v / max);
  const tone =
    intensity > 0.7 ? "brick" : intensity > 0.4 ? "mustard" : "sage";
  const bg =
    tone === "brick"
      ? "bg-brick/10 text-brick-ink"
      : tone === "mustard"
        ? "bg-mustard/15 text-mustard-ink"
        : "bg-sage/15 text-sage-ink";
  return (
    <div className="px-3 py-2">
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${bg}`}>
        ${v.toFixed(2)}
      </span>
    </div>
  );
}
