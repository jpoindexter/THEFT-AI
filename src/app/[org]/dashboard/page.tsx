import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { db } from "@/lib/db/store";

export default async function DashboardPage({
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

  const [allTasks, agents, usage] = await Promise.all([
    db.listTasks(o.id),
    db.listAgents(o.id),
    db.listUsage(o.id, { since: fourteenDaysAgo }),
  ]);

  const agentName = new Map(agents.map((a) => [a.id, a.name]));

  const thisWeekDone = allTasks.filter((t) => t.status === "done" && t.updated_at >= sevenDaysAgo);
  const prevWeekDone = allTasks.filter((t) => t.status === "done" && t.updated_at >= fourteenDaysAgo && t.updated_at < sevenDaysAgo);
  const pendingReviews = allTasks.filter((t) => t.status === "in_review").length;
  const thisWeekCost = usage.filter((u) => u.created_at >= sevenDaysAgo).reduce((s, u) => s + u.cost_usd, 0);

  const taskDelta = prevWeekDone.length === 0 ? null : Math.round(((thisWeekDone.length - prevWeekDone.length) / prevWeekDone.length) * 100);
  const kpis = [
    { label: "Tasks done this week", value: String(thisWeekDone.length), delta: taskDelta !== null ? `${taskDelta >= 0 ? "+" : ""}${taskDelta}%` : "—", tone: (taskDelta ?? 0) >= 0 ? "sage" as const : "brick" as const },
    { label: "Spend this week", value: `$${thisWeekCost.toFixed(2)}`, delta: "—", tone: "neutral" as const },
    { label: "Pending reviews", value: String(pendingReviews), delta: pendingReviews > 3 ? "High" : "—", tone: pendingReviews > 3 ? "mustard" as const : "neutral" as const },
    { label: "Active agents", value: String(agents.filter((a) => a.status === "running").length), delta: `${agents.length} total`, tone: "neutral" as const },
  ];

  // Tasks per day for last 7 days
  const tasksByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().slice(0, 10);
    return allTasks.filter((t) => t.status === "done" && t.updated_at.startsWith(day)).length;
  });

  // Spend per day last 7 days
  const costByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().slice(0, 10);
    return usage.filter((u) => u.created_at.startsWith(day)).reduce((s, u) => s + u.cost_usd, 0);
  });

  // Per-agent stats
  const agentStats = new Map<string, { tasks: number; cost: number }>();
  for (const t of thisWeekDone) {
    const name = t.agent_id ? (agentName.get(t.agent_id) ?? "Agent") : "You";
    const s = agentStats.get(name) ?? { tasks: 0, cost: 0 };
    s.tasks++;
    agentStats.set(name, s);
  }
  for (const u of usage.filter((u) => u.created_at >= sevenDaysAgo)) {
    const name = u.agent_name ?? "Agent";
    const s = agentStats.get(name) ?? { tasks: 0, cost: 0 };
    s.cost += u.cost_usd;
    agentStats.set(name, s);
  }
  const topAgents = [...agentStats.entries()]
    .map(([agent, d]) => ({ agent, ...d }))
    .sort((a, b) => b.tasks - a.tasks || b.cost - a.cost)
    .slice(0, 5);
  const maxTasks = Math.max(1, ...topAgents.map((a) => a.tasks));

  const taskMax = Math.max(1, ...tasksByDay);
  const costMax = Math.max(0.001, ...costByDay);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Dashboard</PageTitle>
          <Hint>
            Weekly trends across throughput, spend, and pending reviews.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardBody className="!p-3 space-y-1">
                <Eyebrow>{k.label}</Eyebrow>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl tracking-tight font-medium">{k.value}</span>
                  <Pill tone={k.tone}>{k.delta}</Pill>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Sparkline label="Tasks done / day" series={tasksByDay} max={taskMax} unit="" />
          <Sparkline label="Spend / day" series={costByDay} max={costMax} unit="$" />
        </div>

        {topAgents.length > 0 && (
          <Card>
            <CardBody>
              <Eyebrow>Top agents this week</Eyebrow>
              <ul className="divide-y divide-line/60 mt-2">
                {topAgents.map((a) => (
                  <li key={a.agent} className="py-2 flex items-center gap-3 text-sm">
                    <span className="w-24 truncate">{a.agent}</span>
                    <div className="flex-1 h-2 rounded-full bg-cream overflow-hidden">
                      <div className="h-full bg-sage/70" style={{ width: `${(a.tasks / maxTasks) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs text-ink-muted shrink-0 w-24 text-right">
                      {a.tasks} task{a.tasks !== 1 ? "s" : ""} · ${a.cost.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {topAgents.length === 0 && allTasks.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-sm text-ink-muted text-center py-4">
                No activity yet. Create a task to see dashboard metrics.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function Sparkline({ label, series, max, unit }: { label: string; series: number[]; max: number; unit: string }) {
  return (
    <Card>
      <CardBody className="!p-3 space-y-2">
        <Eyebrow>{label}</Eyebrow>
        <div className="flex items-end gap-1 h-16">
          {series.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-mustard/50"
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "2px" : "0" }}
              title={`${unit}${typeof v === "number" ? v.toFixed(unit === "$" ? 2 : 0) : v}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-2xs text-ink-soft">
          <span>7d ago</span>
          <span>today</span>
        </div>
      </CardBody>
    </Card>
  );
}
