import { Link } from "@/lib/router";
import type { OrgNode } from "@/api/agents";
import { StatusBadge } from "@/components/StatusBadge";
import { EntityRow } from "@/components/EntityRow";
import { relativeTime, cn, agentRouteRef, agentUrl } from "@/lib/utils";
import { agentStatusDot, agentStatusDotDefault } from "@/lib/status-colors";
import { getAdapterLabel } from "@/adapters/adapter-display-registry";
import { AGENT_ROLE_LABELS, type Agent } from "@paperclipai/shared";

export type FilterTab = "all" | "active" | "paused" | "error";
export type LiveRunByAgent = Map<string, { runId: string; liveCount: number }>;

const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;
const ORG_TREE_DEPTH_CLASSES = ["pl-0", "pl-6", "pl-12", "pl-16", "pl-20", "pl-24", "pl-28"];

function orgTreeDepthClass(depth: number) {
  return ORG_TREE_DEPTH_CLASSES[Math.min(Math.max(depth, 0), ORG_TREE_DEPTH_CLASSES.length - 1)];
}

function matchesFilter(status: string, tab: FilterTab, showTerminated: boolean): boolean {
  if (status === "terminated") return showTerminated;
  if (tab === "all") return true;
  if (tab === "active") return status === "active" || status === "running" || status === "idle";
  if (tab === "paused") return status === "paused";
  if (tab === "error") return status === "error";
  return true;
}

export function filterAgents(agents: Agent[], tab: FilterTab, showTerminated: boolean): Agent[] {
  return agents
    .filter((agent) => matchesFilter(agent.status, tab, showTerminated))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterOrgTree(nodes: OrgNode[], tab: FilterTab, showTerminated: boolean): OrgNode[] {
  return nodes
    .reduce<OrgNode[]>((acc, node) => {
      const filteredReports = filterOrgTree(node.reports, tab, showTerminated);
      if (matchesFilter(node.status, tab, showTerminated) || filteredReports.length > 0) {
        acc.push({ ...node, reports: filteredReports });
      }
      return acc;
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getConfiguredModel(agent: Agent): string | null {
  const value = agent.adapterConfig?.model;
  if (typeof value !== "string") return null;
  const model = value.trim();
  return model.length > 0 ? model : null;
}

export function AgentsListPanel({
  agents,
  liveRunByAgent,
  tab,
}: {
  agents: Agent[];
  liveRunByAgent: LiveRunByAgent;
  tab: FilterTab;
}) {
  return (
    <div className="border border-border">
      {agents.map((agent) => (
        <EntityRow
          key={agent.id}
          title={agent.name}
          subtitle={`${roleLabels[agent.role] ?? agent.role}${agent.title ? ` - ${agent.title}` : ""}`}
          to={agentUrl(agent)}
          className={agent.pausedAt && tab !== "paused" ? "opacity-50" : ""}
          leading={
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${agentStatusDot[agent.status] ?? agentStatusDotDefault}`}
              />
            </span>
          }
          trailing={
            <div className="flex items-center gap-3">
              <span className="sm:hidden">
                {liveRunByAgent.has(agent.id) ? (
                  <LiveRunIndicator
                    agentRef={agentRouteRef(agent)}
                    runId={liveRunByAgent.get(agent.id)!.runId}
                    liveCount={liveRunByAgent.get(agent.id)!.liveCount}
                  />
                ) : (
                  <StatusBadge status={agent.status} />
                )}
              </span>
              <div className="hidden items-center gap-3 sm:flex">
                {liveRunByAgent.has(agent.id) && (
                  <LiveRunIndicator
                    agentRef={agentRouteRef(agent)}
                    runId={liveRunByAgent.get(agent.id)!.runId}
                    liveCount={liveRunByAgent.get(agent.id)!.liveCount}
                  />
                )}
                <span className="w-28 whitespace-nowrap text-left font-mono text-xs text-muted-foreground">
                  {getAdapterLabel(agent.adapterType)}
                </span>
                <span
                  className="w-36 truncate text-left font-mono text-xs text-muted-foreground"
                  title={getConfiguredModel(agent) ?? undefined}
                >
                  {getConfiguredModel(agent) ?? "—"}
                </span>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {agent.lastHeartbeatAt ? relativeTime(agent.lastHeartbeatAt) : "—"}
                </span>
                <span className="flex w-20 justify-end">
                  <StatusBadge status={agent.status} />
                </span>
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
}

export function AgentsOrgTree({
  agentMap,
  liveRunByAgent,
  nodes,
  tab,
}: {
  agentMap: Map<string, Agent>;
  liveRunByAgent: LiveRunByAgent;
  nodes: OrgNode[];
  tab: FilterTab;
}) {
  return (
    <div className="border border-border py-1">
      {nodes.map((node) => (
        <OrgTreeNode key={node.id} node={node} depth={0} agentMap={agentMap} liveRunByAgent={liveRunByAgent} tab={tab} />
      ))}
    </div>
  );
}

function OrgTreeNode({
  node,
  depth,
  agentMap,
  liveRunByAgent,
  tab,
}: {
  node: OrgNode;
  depth: number;
  agentMap: Map<string, Agent>;
  liveRunByAgent: LiveRunByAgent;
  tab: FilterTab;
}) {
  const agent = agentMap.get(node.id);
  const statusColor = agentStatusDot[node.status] ?? agentStatusDotDefault;

  return (
    <div className={orgTreeDepthClass(depth)}>
      <Link
        to={agent ? agentUrl(agent) : `/agents/${node.id}`}
        className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-inherit no-underline transition-colors hover:bg-accent/30", agent?.pausedAt && tab !== "paused" && "opacity-50")}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className={`absolute inline-flex h-full w-full rounded-full ${statusColor}`} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">{node.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {roleLabels[node.role] ?? node.role}
            {agent?.title ? ` - ${agent.title}` : ""}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="sm:hidden">
            {liveRunByAgent.has(node.id) ? (
              <LiveRunIndicator
                agentRef={agent ? agentRouteRef(agent) : node.id}
                runId={liveRunByAgent.get(node.id)!.runId}
                liveCount={liveRunByAgent.get(node.id)!.liveCount}
              />
            ) : (
              <StatusBadge status={node.status} />
            )}
          </span>
          <div className="hidden items-center gap-3 sm:flex">
            {liveRunByAgent.has(node.id) && (
              <LiveRunIndicator
                agentRef={agent ? agentRouteRef(agent) : node.id}
                runId={liveRunByAgent.get(node.id)!.runId}
                liveCount={liveRunByAgent.get(node.id)!.liveCount}
              />
            )}
            {agent && (
              <>
                <span className="w-28 whitespace-nowrap text-left font-mono text-xs text-muted-foreground">
                  {getAdapterLabel(agent.adapterType)}
                </span>
                <span
                  className="w-36 truncate text-left font-mono text-xs text-muted-foreground"
                  title={getConfiguredModel(agent) ?? undefined}
                >
                  {getConfiguredModel(agent) ?? "—"}
                </span>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {agent.lastHeartbeatAt ? relativeTime(agent.lastHeartbeatAt) : "—"}
                </span>
              </>
            )}
            <span className="flex w-20 justify-end">
              <StatusBadge status={node.status} />
            </span>
          </div>
        </div>
      </Link>
      {node.reports && node.reports.length > 0 && (
        <div className="ml-4 border-l border-border/50">
          {node.reports.map((child) => (
            <OrgTreeNode key={child.id} node={child} depth={depth + 1} agentMap={agentMap} liveRunByAgent={liveRunByAgent} tab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveRunIndicator({
  agentRef,
  runId,
  liveCount,
}: {
  agentRef: string;
  runId: string;
  liveCount: number;
}) {
  return (
    <Link
      to={`/agents/${agentRef}/runs/${runId}`}
      className="flex items-center gap-1.5 rounded-full bg-chart-1/10 px-2 py-0.5 no-underline transition-colors hover:bg-chart-1/20"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-chart-1 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-1" />
      </span>
      <span className="text-xs font-medium text-chart-1">
        Live{liveCount > 1 ? ` (${liveCount})` : ""}
      </span>
    </Link>
  );
}
