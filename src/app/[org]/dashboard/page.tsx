import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";

const TASKS_BY_DAY = [4, 7, 5, 8, 11, 9, 14];
const COST_BY_DAY = [3.2, 5.1, 4.4, 7.8, 9.6, 8.0, 12.4];
const APPROVAL_LATENCY_MIN = [22, 18, 14, 12, 8, 9, 6];

const KPIS = [
  { label: "Tasks shipped this week", value: "58", delta: "+22%", tone: "sage" as const },
  { label: "Spend this week", value: "$50.50", delta: "+12%", tone: "neutral" as const },
  { label: "Avg approval latency", value: "13m", delta: "-41%", tone: "sage" as const },
  { label: "Pending reviews", value: "4", delta: "+1", tone: "mustard" as const },
];

const TOP_AGENTS = [
  { agent: "Engineer", tasks: 18, cost: 41.2, share: 0.82 },
  { agent: "Marketing", tasks: 14, cost: 12.1, share: 0.55 },
  { agent: "Operations", tasks: 9, cost: 4.0, share: 0.34 },
  { agent: "Sales", tasks: 7, cost: 2.6, share: 0.21 },
];

export default async function DashboardPage() {
  const taskMax = Math.max(...TASKS_BY_DAY);
  const costMax = Math.max(...COST_BY_DAY);
  const latMax = Math.max(...APPROVAL_LATENCY_MIN);
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Dashboard</PageTitle>
          <Hint>
            Weekly trends across throughput, spend, and how fast approvals are
            getting decided.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          {KPIS.map((k) => (
            <Card key={k.label}>
              <CardBody className="!p-3 space-y-1">
                <Eyebrow>{k.label}</Eyebrow>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl tracking-tight font-medium">
                    {k.value}
                  </span>
                  <Pill tone={k.tone}>{k.delta}</Pill>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Sparkline label="Tasks / day" series={TASKS_BY_DAY} max={taskMax} unit="" />
          <Sparkline
            label="Spend / day"
            series={COST_BY_DAY}
            max={costMax}
            unit="$"
          />
          <Sparkline
            label="Approval latency (min)"
            series={APPROVAL_LATENCY_MIN}
            max={latMax}
            unit=""
          />
        </div>

        <Card>
          <CardBody>
            <Eyebrow>Top agents this week</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {TOP_AGENTS.map((a) => (
                <AgentBar key={a.agent} a={a} />
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Sparkline({
  label,
  series,
  max,
  unit,
}: {
  label: string;
  series: number[];
  max: number;
  unit: string;
}) {
  return (
    <Card>
      <CardBody className="!p-3 space-y-2">
        <Eyebrow>{label}</Eyebrow>
        <div className="flex items-end gap-1 h-16">
          {series.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-mustard/50"
              style={{ height: `${(v / max) * 100}%` }}
              title={`${unit}${v}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-2xs text-ink-soft">
          <span>{series.length} days ago</span>
          <span>today</span>
        </div>
      </CardBody>
    </Card>
  );
}

function AgentBar({
  a,
}: {
  a: { agent: string; tasks: number; cost: number; share: number };
}) {
  return (
    <li className="py-2 flex items-center gap-3 text-sm">
      <span className="w-24 truncate">{a.agent}</span>
      <div className="flex-1 h-2 rounded-full bg-cream overflow-hidden">
        <div
          className="h-full bg-sage/70"
          style={{ width: `${a.share * 100}%` }}
        />
      </div>
      <span className="font-mono text-xs text-ink-muted shrink-0 w-20 text-right">
        {a.tasks} tasks · ${a.cost.toFixed(1)}
      </span>
    </li>
  );
}
