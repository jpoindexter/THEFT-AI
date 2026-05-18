import type { DashboardRunActivityDay, HeartbeatRun } from "@paperclipai/shared";

/* ---- Utilities ---- */

export function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const BAR_HEIGHT_CLASSES = [
  "h-0",
  "h-1",
  "h-2",
  "h-3",
  "h-4",
  "h-5",
  "h-6",
  "h-7",
  "h-8",
  "h-9",
  "h-10",
  "h-12",
  "h-14",
  "h-16",
  "h-20",
];

function barHeightClass(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) return BAR_HEIGHT_CLASSES[0];
  const clamped = Math.min(Math.max(value / maxValue, 0), 1);
  return BAR_HEIGHT_CLASSES[Math.round(clamped * (BAR_HEIGHT_CLASSES.length - 1))];
}

/* ---- Sub-components ---- */

function DateLabels({ days }: { days: string[] }) {
  return (
    <div className="mt-1.5 flex gap-1">
      {days.map((day, i) => (
        <div key={day} className="flex-1 text-center">
          {(i === 0 || i === 6 || i === 13) ? (
            <span className="text-nano tabular-nums text-muted-foreground">{formatDayLabel(day)}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ items }: { items: { className: string; label: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1 text-nano text-muted-foreground">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {subtitle && <span className="text-nano text-muted-foreground/60">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

/* ---- Chart Components ---- */

type RunChartProps =
  | { activity?: DashboardRunActivityDay[] | null; runs?: never }
  | { runs?: HeartbeatRun[] | null; activity?: never };

function aggregateRuns(runs: readonly HeartbeatRun[] = []): DashboardRunActivityDay[] {
  const days = getLast14Days();
  const grouped = new Map<string, DashboardRunActivityDay>();
  for (const day of days) grouped.set(day, { date: day, succeeded: 0, failed: 0, other: 0, total: 0 });
  for (const run of runs) {
    const day = new Date(run.createdAt).toISOString().slice(0, 10);
    const entry = grouped.get(day);
    if (!entry) continue;
    if (run.status === "succeeded") entry.succeeded++;
    else if (run.status === "failed" || run.status === "timed_out") entry.failed++;
    else entry.other++;
    entry.total++;
  }
  return Array.from(grouped.values());
}

function resolveRunActivity(props: RunChartProps): DashboardRunActivityDay[] {
  if (Array.isArray(props.activity)) return props.activity;
  if (Array.isArray(props.runs)) return aggregateRuns(props.runs);
  return [];
}

export function RunActivityChart(props: RunChartProps) {
  const activity = resolveRunActivity(props);
  const days = activity.length > 0 ? activity.map((day) => day.date) : getLast14Days();
  const grouped = new Map(activity.map((day) => [day.date, day]));

  const maxValue = Math.max(...activity.map(v => v.total), 1);
  const hasData = activity.some(v => v.total > 0);

  if (!hasData) return <p className="text-xs text-muted-foreground">No runs yet</p>;

  return (
    <div>
      <div className="flex h-20 items-end gap-1">
        {days.map(day => {
          const entry = grouped.get(day) ?? { date: day, succeeded: 0, failed: 0, other: 0, total: 0 };
          const total = entry.total;
          return (
            <div key={day} className="flex h-full flex-1 flex-col justify-end" title={`${day}: ${total} runs`}>
              {total > 0 ? (
                <div className="flex flex-col-reverse overflow-hidden">
                  {entry.succeeded > 0 && <div className={`bg-chart-2 ${barHeightClass(entry.succeeded, maxValue)}`} />}
                  {entry.failed > 0 && <div className={`bg-destructive ${barHeightClass(entry.failed, maxValue)}`} />}
                  {entry.other > 0 && <div className={`bg-muted-foreground ${barHeightClass(entry.other, maxValue)}`} />}
                </div>
              ) : (
                <div className="h-0.5 rounded-sm bg-muted/30" />
              )}
            </div>
          );
        })}
      </div>
      <DateLabels days={days} />
    </div>
  );
}

const priorityClasses: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-chart-1",
  medium: "bg-chart-3",
  low: "bg-muted-foreground",
};

const priorityOrder = ["critical", "high", "medium", "low"] as const;

export function PriorityChart({ issues }: { issues: { priority: string; createdAt: Date }[] }) {
  const days = getLast14Days();
  const grouped = new Map<string, Record<string, number>>();
  for (const day of days) grouped.set(day, { critical: 0, high: 0, medium: 0, low: 0 });
  for (const issue of issues) {
    const day = new Date(issue.createdAt).toISOString().slice(0, 10);
    const entry = grouped.get(day);
    if (!entry) continue;
    if (issue.priority in entry) entry[issue.priority]++;
  }

  const maxValue = Math.max(...Array.from(grouped.values()).map(v => Object.values(v).reduce((a, b) => a + b, 0)), 1);
  const hasData = Array.from(grouped.values()).some(v => Object.values(v).reduce((a, b) => a + b, 0) > 0);

  if (!hasData) return <p className="text-xs text-muted-foreground">No issues</p>;

  return (
    <div>
      <div className="flex h-20 items-end gap-1">
        {days.map(day => {
          const entry = grouped.get(day)!;
          const total = Object.values(entry).reduce((a, b) => a + b, 0);
          return (
            <div key={day} className="flex h-full flex-1 flex-col justify-end" title={`${day}: ${total} issues`}>
              {total > 0 ? (
                <div className="flex flex-col-reverse overflow-hidden">
                  {priorityOrder.map(p => entry[p] > 0 ? (
                    <div key={p} className={`${priorityClasses[p]} ${barHeightClass(entry[p], maxValue)}`} />
                  ) : null)}
                </div>
              ) : (
                <div className="h-0.5 rounded-sm bg-muted/30" />
              )}
            </div>
          );
        })}
      </div>
      <DateLabels days={days} />
      <ChartLegend items={priorityOrder.map(p => ({ className: priorityClasses[p], label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
    </div>
  );
}

const statusClasses: Record<string, string> = {
  todo: "bg-chart-1",
  in_progress: "bg-chart-3",
  in_review: "bg-chart-4",
  done: "bg-chart-2",
  blocked: "bg-destructive",
  cancelled: "bg-muted-foreground",
  backlog: "bg-muted-foreground/60",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
  cancelled: "Cancelled",
  backlog: "Backlog",
};

export function IssueStatusChart({ issues }: { issues: { status: string; createdAt: Date }[] }) {
  const days = getLast14Days();
  const allStatuses = new Set<string>();
  const grouped = new Map<string, Record<string, number>>();
  for (const day of days) grouped.set(day, {});
  for (const issue of issues) {
    const day = new Date(issue.createdAt).toISOString().slice(0, 10);
    const entry = grouped.get(day);
    if (!entry) continue;
    entry[issue.status] = (entry[issue.status] ?? 0) + 1;
    allStatuses.add(issue.status);
  }

  const statusOrder = ["todo", "in_progress", "in_review", "done", "blocked", "cancelled", "backlog"].filter(s => allStatuses.has(s));
  const maxValue = Math.max(...Array.from(grouped.values()).map(v => Object.values(v).reduce((a, b) => a + b, 0)), 1);
  const hasData = allStatuses.size > 0;

  if (!hasData) return <p className="text-xs text-muted-foreground">No issues</p>;

  return (
    <div>
      <div className="flex h-20 items-end gap-1">
        {days.map(day => {
          const entry = grouped.get(day)!;
          const total = Object.values(entry).reduce((a, b) => a + b, 0);
          return (
            <div key={day} className="flex h-full flex-1 flex-col justify-end" title={`${day}: ${total} issues`}>
              {total > 0 ? (
                <div className="flex flex-col-reverse overflow-hidden">
                  {statusOrder.map(s => (entry[s] ?? 0) > 0 ? (
                    <div key={s} className={`${statusClasses[s] ?? "bg-muted-foreground"} ${barHeightClass(entry[s] ?? 0, maxValue)}`} />
                  ) : null)}
                </div>
              ) : (
                <div className="h-0.5 rounded-sm bg-muted/30" />
              )}
            </div>
          );
        })}
      </div>
      <DateLabels days={days} />
      <ChartLegend items={statusOrder.map(s => ({ className: statusClasses[s] ?? "bg-muted-foreground", label: statusLabels[s] ?? s }))} />
    </div>
  );
}

export function SuccessRateChart(props: RunChartProps) {
  const activity = resolveRunActivity(props);
  const days = activity.length > 0 ? activity.map((day) => day.date) : getLast14Days();
  const grouped = new Map(activity.map((day) => [day.date, day]));

  const hasData = activity.some(v => v.total > 0);
  if (!hasData) return <p className="text-xs text-muted-foreground">No runs yet</p>;

  return (
    <div>
      <div className="flex h-20 items-end gap-1">
        {days.map(day => {
          const entry = grouped.get(day) ?? { date: day, succeeded: 0, failed: 0, other: 0, total: 0 };
          const rate = entry.total > 0 ? entry.succeeded / entry.total : 0;
          const tone = rate >= 0.8 ? "bg-chart-2" : rate >= 0.5 ? "bg-chart-3" : "bg-destructive";
          return (
            <div key={day} className="flex h-full flex-1 flex-col justify-end" title={`${day}: ${entry.total > 0 ? Math.round(rate * 100) : 0}% (${entry.succeeded}/${entry.total})`}>
              {entry.total > 0 ? (
                <div className={`${tone} ${barHeightClass(rate, 1)}`} />
              ) : (
                <div className="h-0.5 rounded-sm bg-muted/30" />
              )}
            </div>
          );
        })}
      </div>
      <DateLabels days={days} />
    </div>
  );
}
