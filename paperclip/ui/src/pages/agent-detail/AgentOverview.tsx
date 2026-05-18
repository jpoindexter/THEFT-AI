import { Link } from "@/lib/router";
import type { AgentDetail as AgentDetailRecord, AgentRuntimeState, HeartbeatRun } from "@paperclipai/shared";
import { ChartCard, IssueStatusChart, PriorityChart, RunActivityChart, SuccessRateChart } from "../../components/ActivityCharts";
import { EntityRow } from "../../components/EntityRow";
import { StatusBadge } from "../../components/StatusBadge";
import { formatCents, formatDate, formatTokens } from "../../lib/utils";
import { LatestRunCard } from "./LatestRunCard";
import { runMetrics } from "./RunsTab";

export function AgentOverview({
  agent,
  runs,
  assignedIssues,
  runtimeState,
  agentId,
  agentRouteId,
}: {
  agent: AgentDetailRecord;
  runs: HeartbeatRun[];
  assignedIssues: { id: string; title: string; status: string; priority: string; identifier?: string | null; createdAt: Date }[];
  runtimeState?: AgentRuntimeState;
  agentId: string;
  agentRouteId: string;
}) {
  return (
    <div className="space-y-8">
      <LatestRunCard runs={runs} agentId={agentRouteId} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ChartCard title="Run Activity" subtitle="Last 14 days">
          <RunActivityChart runs={runs} />
        </ChartCard>
        <ChartCard title="Issues by Priority" subtitle="Last 14 days">
          <PriorityChart issues={assignedIssues} />
        </ChartCard>
        <ChartCard title="Issues by Status" subtitle="Last 14 days">
          <IssueStatusChart issues={assignedIssues} />
        </ChartCard>
        <ChartCard title="Success Rate" subtitle="Last 14 days">
          <SuccessRateChart runs={runs} />
        </ChartCard>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Recent Issues</h3>
          <Link to={`/issues?participantAgentId=${agentId}`} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            See All &rarr;
          </Link>
        </div>
        {assignedIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent issues.</p>
        ) : (
          <div className="rounded-lg border border-border">
            {assignedIssues.slice(0, 10).map((issue) => (
              <EntityRow
                key={issue.id}
                identifier={issue.identifier ?? issue.id.slice(0, 8)}
                title={issue.title}
                to={`/issues/${issue.identifier ?? issue.id}`}
                trailing={<StatusBadge status={issue.status} />}
              />
            ))}
            {assignedIssues.length > 10 ? (
              <div className="border-t border-border px-3 py-2 text-center text-xs text-muted-foreground">
                +{assignedIssues.length - 10} more issues
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Runtime usage</h3>
        <CostsSection runtimeState={runtimeState} runs={runs} />
      </div>
    </div>
  );
}

function CostsSection({ runtimeState, runs }: { runtimeState?: AgentRuntimeState; runs: HeartbeatRun[] }) {
  const runsWithCost = runs
    .filter((run) => {
      const metrics = runMetrics(run);
      return metrics.cost > 0 || metrics.input > 0 || metrics.output > 0 || metrics.cached > 0;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {runtimeState ? (
        <div className="rounded-lg border border-border p-4">
          <div className="grid grid-cols-2 gap-4 tabular-nums md:grid-cols-4">
            <Metric label="Input tokens" value={formatTokens(runtimeState.totalInputTokens)} />
            <Metric label="Output tokens" value={formatTokens(runtimeState.totalOutputTokens)} />
            <Metric label="Cached tokens" value={formatTokens(runtimeState.totalCachedInputTokens)} />
            <Metric label="Total cost" value={formatCents(runtimeState.totalCostCents)} />
          </div>
        </div>
      ) : null}
      {runsWithCost.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/20">
                {["Date", "Run", "Input", "Output", "Cost"].map((label, index) => (
                  <th key={label} className={index < 2 ? "px-3 py-2 text-left font-medium text-muted-foreground" : "px-3 py-2 text-right font-medium text-muted-foreground"}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runsWithCost.slice(0, 10).map((run) => {
                const metrics = runMetrics(run);
                return (
                  <tr key={run.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2">{formatDate(run.createdAt)}</td>
                    <td className="px-3 py-2 font-mono">{run.id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatTokens(metrics.input)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatTokens(metrics.output)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{metrics.cost > 0 ? `$${metrics.cost.toFixed(4)}` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
