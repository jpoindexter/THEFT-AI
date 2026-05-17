import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Agent, Goal, Issue, Project } from "@paperclipai/shared";
import { agentsApi } from "../api/agents";
import { goalsApi } from "../api/goals";
import { issuesApi } from "../api/issues";
import { projectsApi } from "../api/projects";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { TheftChip, TheftPageShell, TheftSectionHeader, TheftStat, TheftSurface } from "@/components/theft";
import { ArrowRight, CheckCircle2, GitBranch, Layers3, Plus, Route, Target, Users } from "lucide-react";
import { cn } from "../lib/utils";

interface TechTreeNodeView {
  goal: Goal;
  depth: number;
  stage: "foundation" | "build" | "scale";
  stageLabel: string;
  owner: string;
  dependency: string;
  evidence: string;
  nextAction: string;
  startWorkTitle: string;
  openIssueCount: number;
  doneIssueCount: number;
  linkedIssueCount: number;
  linkedProjectCount: number;
  childCount: number;
}

export interface TechTreeStageView {
  key: TechTreeNodeView["stage"];
  label: string;
  description: string;
  nodes: TechTreeNodeView[];
}

function isProjectLinkedToGoal(project: Project, goalId: string) {
  if (project.goalIds.includes(goalId)) return true;
  if (project.goals.some((goalRef) => goalRef.id === goalId)) return true;
  return project.goalId === goalId;
}

function flattenGoalTree(goals: Goal[]) {
  const goalIds = new Set(goals.map((goal) => goal.id));
  const roots = goals.filter((goal) => !goal.parentId || !goalIds.has(goal.parentId));
  const sortedChildren = (parentId: string) =>
    goals
      .filter((goal) => goal.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const rows: Array<{ goal: Goal; depth: number }> = [];

  const visit = (goal: Goal, depth: number) => {
    rows.push({ goal, depth });
    sortedChildren(goal.id).forEach((child) => visit(child, depth + 1));
  };

  roots
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((goal) => visit(goal, 0));

  return rows;
}

const TECH_TREE_STAGE_META: Record<TechTreeNodeView["stage"], Pick<TechTreeStageView, "label" | "description">> = {
  foundation: {
    label: "Foundation",
    description: "Clarify the company objective, constraints, and first proof.",
  },
  build: {
    label: "Build",
    description: "Turn strategy into department-owned execution.",
  },
  scale: {
    label: "Scale",
    description: "Compound proven work into repeatable company systems.",
  },
};

function techTreeStageForDepth(depth: number): TechTreeNodeView["stage"] {
  if (depth === 0) return "foundation";
  if (depth === 1) return "build";
  return "scale";
}

export function buildTechTreeNodeViews({
  goals,
  agents,
  projects,
  issues,
}: {
  goals: Goal[];
  agents: Agent[];
  projects: Project[];
  issues: Issue[];
}): TechTreeNodeView[] {
  const childrenByGoal = new Map<string, Goal[]>();
  goals.forEach((goal) => {
    if (!goal.parentId) return;
    childrenByGoal.set(goal.parentId, [...(childrenByGoal.get(goal.parentId) ?? []), goal]);
  });

  return flattenGoalTree(goals).map(({ goal, depth }) => {
    const ownerAgent = goal.ownerAgentId
      ? agents.find((agent) => agent.id === goal.ownerAgentId)
      : null;
    const linkedProjects = projects.filter((project) => isProjectLinkedToGoal(project, goal.id));
    const linkedIssues = issues.filter((issue) => issue.goalId === goal.id);
    const openIssue = linkedIssues.find((issue) => !["done", "cancelled"].includes(issue.status));
    const activeProject = linkedProjects.find((project) => !["completed", "cancelled"].includes(project.status));
    const childGoals = childrenByGoal.get(goal.id) ?? [];
    const activeChild = childGoals.find((child) => child.status !== "achieved" && child.status !== "cancelled");
    const doneProjects = linkedProjects.filter((project) => project.status === "completed").length;
    const doneIssues = linkedIssues.filter((issue) => issue.status === "done").length;
    const openIssues = linkedIssues.filter((issue) => !["done", "cancelled"].includes(issue.status));
    const stage = techTreeStageForDepth(depth);

    let nextAction = "Create first department task";
    let startWorkTitle = `Advance ${goal.title}`;
    if (goal.status === "achieved") {
      nextAction = "Review evidence and keep as company memory";
      startWorkTitle = `Review evidence for ${goal.title}`;
    } else if (openIssue) {
      nextAction = `Advance task: ${openIssue.title}`;
      startWorkTitle = openIssue.title;
    } else if (activeProject) {
      nextAction = `Move project: ${activeProject.name}`;
      startWorkTitle = `Move ${activeProject.name}`;
    } else if (activeChild) {
      nextAction = `Advance node: ${activeChild.title}`;
      startWorkTitle = `Advance ${activeChild.title}`;
    } else if (childGoals.length > 0) {
      nextAction = "Promote the next child node";
      startWorkTitle = `Promote next child for ${goal.title}`;
    }

    return {
      goal,
      depth,
      stage,
      stageLabel: TECH_TREE_STAGE_META[stage].label,
      owner: ownerAgent ? `${ownerAgent.name}${ownerAgent.title ? ` · ${ownerAgent.title}` : ""}` : "Operator",
      dependency: goal.parentId
        ? `Depends on parent node`
        : childGoals.length > 0
          ? `${childGoals.length} downstream node${childGoals.length === 1 ? "" : "s"}`
          : "Root roadmap node",
      evidence:
        linkedProjects.length || linkedIssues.length
          ? `${doneProjects}/${linkedProjects.length} workstreams · ${doneIssues}/${linkedIssues.length} tasks done`
          : "No evidence linked yet",
      nextAction,
      startWorkTitle,
      openIssueCount: openIssues.length,
      doneIssueCount: doneIssues,
      linkedIssueCount: linkedIssues.length,
      linkedProjectCount: linkedProjects.length,
      childCount: childGoals.length,
    };
  });
}

export function buildTechTreeStageViews(nodes: TechTreeNodeView[]): TechTreeStageView[] {
  return (["foundation", "build", "scale"] as const).map((key) => ({
    key,
    ...TECH_TREE_STAGE_META[key],
    nodes: nodes.filter((node) => node.stage === key),
  }));
}

export function getNextTechTreeNode(nodes: TechTreeNodeView[]): TechTreeNodeView | null {
  return (
    nodes.find((node) => node.goal.status !== "achieved" && node.openIssueCount > 0)
    ?? nodes.find((node) => node.goal.status !== "achieved" && node.linkedIssueCount === 0)
    ?? nodes.find((node) => node.goal.status !== "achieved")
    ?? nodes[0]
    ?? null
  );
}

export function Goals() {
  const { selectedCompanyId } = useCompany();
  const { openNewGoal, openNewIssue } = useDialogActions();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Tech Tree" }]);
  }, [setBreadcrumbs]);

  const { data: goals, isLoading, error } = useQuery({
    queryKey: queryKeys.goals.list(selectedCompanyId!),
    queryFn: () => goalsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const techTreeNodes = buildTechTreeNodeViews({
    goals: goals ?? [],
    agents: agents ?? [],
    projects: projects ?? [],
    issues: issues ?? [],
  });
  const nextNode = getNextTechTreeNode(techTreeNodes);

  if (!selectedCompanyId) {
    return <EmptyState icon={Target} message="Select a company to view the Tech Tree." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <TheftPageShell
      eyebrow="Strategy map / Tech Tree"
      title="Tech Tree"
      description="Company build order, dependencies, evidence, and next unlocks."
      actions={(
        <Button size="sm" variant="outline" onClick={() => openNewGoal()}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Node
        </Button>
      )}
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-destructive">{error.message}</p>}

        {goals && goals.length === 0 && (
          <EmptyState icon={Target} message="No Tech Tree nodes yet." action="Add Node" onAction={() => openNewGoal()} />
        )}

        {goals && goals.length > 0 && (
          <TheftSurface tone="panel" padding="none" className="overflow-hidden">
            <div className="theft-tech-tree-layout grid min-w-0 gap-4 p-4">
              <TechTreeFilterRail />
              <main className="min-w-0">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <TheftSectionHeader
                    eyebrow="Build order"
                    title="Strategy map"
                    description="Company build order, dependencies, evidence, and next unlocks."
                  />
                  <div className="theft-tech-tree-stats grid grid-cols-3 gap-2 text-center">
                    <TheftStat label="nodes" value={goals.length} />
                    <TheftStat label="active" value={goals.filter((goal) => goal.status === "active").length} />
                    <TheftStat label="done" value={goals.filter((goal) => goal.status === "achieved").length} />
                  </div>
                </div>

                <TechTreeBuildOrder nodes={techTreeNodes} selectedNode={nextNode} />

                <TheftSurface tone="plain" padding="md" className="mt-4">
                  <TheftSectionHeader
                    eyebrow="Recommended next move"
                    title={nextNode?.goal.title ?? "Create first build-order node"}
                    actions={<TheftChip>High impact</TheftChip>}
                  />
                  <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                    <InspectorMetric label="Rationale" value={nextNode?.nextAction ?? "Start the company roadmap"} />
                    <InspectorMetric label="Impact" value="Unlocks downstream work" />
                    <InspectorMetric label="Alternative" value="Route through Operator" />
                  </div>
                </TheftSurface>
              </main>
              <TechTreeInspector
                node={nextNode}
                onStartWork={() => {
                  if (!nextNode) return;
                  openNewIssue({
                    goalId: nextNode.goal.id,
                    title: nextNode.startWorkTitle,
                    description: `Advance Tech Tree node: ${nextNode.goal.title}`,
                  });
                }}
              />
            </div>
          </TheftSurface>
        )}
      </div>
    </TheftPageShell>
  );
}

function TechTreeStageSection({ stage }: { stage: TechTreeStageView }) {
  return (
    <section className="theft-surface-muted min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">{stage.label}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{stage.nodes.length} nodes</span>
      </div>
      <div className="space-y-2 p-2">
        {stage.nodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/40 px-4 py-4 text-sm text-muted-foreground">
            No nodes in this stage yet.
          </div>
        ) : (
          stage.nodes.map((node) => <TechTreeNodeCard key={node.goal.id} node={node} />)
        )}
      </div>
    </section>
  );
}

function InspectorMetric({ label, value }: { label: string; value: string }) {
  return (
    <TheftSurface tone="muted" padding="sm" className="min-w-0">
      <div className="theft-label-compact">{label}</div>
      <div className="mt-1 truncate text-xs text-foreground">{value}</div>
    </TheftSurface>
  );
}

const BUILD_ORDER_COLUMNS = ["Idea", "Validation", "Build", "Go-to-market", "Launch", "Scale"];
const FALLBACK_BUILD_NODES = [
  "Identify market opportunity",
  "Define paid offer",
  "Build landing page",
  "Create sales script",
  "Ship first artifact",
  "Systematize acquisition",
];

function TechTreeFilterRail() {
  return (
    <aside className="hidden min-w-0 space-y-5 border-r border-border pr-4 xl:block">
      <div>
        <p className="theft-label">View</p>
        <div className="mt-3 grid gap-2 text-sm">
          <Button variant="secondary" className="justify-start">Strategy Map</Button>
          <Button variant="outline" className="justify-start text-muted-foreground">Build Order</Button>
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <p className="theft-label">Filters</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {["All", "Idea", "Validation", "Build", "Go-to-market", "Launch", "Scale"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CircleMarker complete={item === "All"} />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <p className="theft-label">Legend</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>-- Dependency</p>
          <p>{"->"} Unlocks</p>
          <p>Lock Locked</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full">Show critical path</Button>
    </aside>
  );
}

function TechTreeBuildOrder({
  nodes,
  selectedNode,
}: {
  nodes: TechTreeNodeView[];
  selectedNode: TechTreeNodeView | null;
}) {
  const visibleNodes = BUILD_ORDER_COLUMNS.map((label, index) => nodes[index] ?? null);

  return (
    <TheftSurface tone="muted" padding="sm" className="overflow-hidden">
      <div className="grid min-w-0 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {BUILD_ORDER_COLUMNS.map((column, index) => {
          const node = visibleNodes[index];
          const title = node?.goal.title ?? FALLBACK_BUILD_NODES[index]!;
          const complete = node?.goal.status === "achieved" || index === 0;
          const active = node?.goal.id === selectedNode?.goal.id || (!node && index === 1);
          const locked = !node && index > 2;
          return (
            <div key={column} className="theft-tech-tree-build-column grid min-w-0 gap-2">
              <TheftSurface tone="plain" padding="sm" className="theft-tech-tree-phase-card flex h-full flex-col items-center justify-between text-center">
                <p className="line-clamp-2 text-sm font-medium">{column}</p>
                <p className="mt-1 text-xs text-muted-foreground">{index + 1}</p>
              </TheftSurface>
              {[0, 1, 2].map((row) => {
                const rowTitle = row === 0 ? title : row === 1 ? `${column} support task` : `${column} evidence gate`;
                return (
                  <TheftSurface
                    key={`${column}:${row}`}
                    tone="plain"
                    padding="sm"
                    className={cn(
                      "theft-tech-tree-build-node h-full overflow-hidden text-xs",
                      active && row === 0 && "theft-selected-surface",
                      locked && "opacity-50",
                    )}
                  >
                    <div className="flex h-full items-start justify-between gap-2">
                      <p className="min-w-0 break-words line-clamp-3 [overflow-wrap:anywhere]">{rowTitle}</p>
                      {locked ? <span className="shrink-0 text-xs text-muted-foreground">Lock</span> : <CircleMarker complete={complete && row === 0} />}
                    </div>
                  </TheftSurface>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid min-w-0 gap-2 rounded-lg border border-dashed border-border p-3 md:grid-cols-3 xl:grid-cols-6">
        {BUILD_ORDER_COLUMNS.map((column, index) => (
          <TheftSurface key={`${column}:artifact`} tone="plain" padding="sm" className="theft-tech-tree-artifact-card min-w-0 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {index === 0 ? "Customer interview notes" : index === 1 ? "Offer summary doc" : `${column} artifact`}
          </TheftSurface>
        ))}
      </div>
      <p className="theft-label mt-3 text-center">
        Evidence & artifacts (Library)
      </p>
    </TheftSurface>
  );
}

function TechTreeInspector({
  node,
  onStartWork,
}: {
  node: TechTreeNodeView | null;
  onStartWork: () => void;
}) {
  return (
    <aside className="min-w-0 border-t border-border pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
      <TheftSurface tone="plain" padding="md">
        <p className="theft-label">Selected node</p>
        {node ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex min-w-0 items-center gap-2">
                <CircleMarker />
                <h2 className="min-w-0 break-words text-lg font-medium [overflow-wrap:anywhere]">{node.goal.title}</h2>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={node.goal.status} />
                <span className="text-xs text-muted-foreground">{node.stageLabel}</span>
              </div>
            </div>
            <InspectorSection title="Why it matters" rows={[node.nextAction]} />
            <InspectorSection title="Prerequisites" rows={[node.dependency, node.evidence]} />
            <InspectorSection title="Evidence required" rows={["Owner decision", "Linked task output", "Library artifact"]} />
            <InspectorSection title="Owner" rows={[node.owner]} />
            <Button className="w-full" onClick={onStartWork}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Start this work
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Add a node to create the company build order.</p>
        )}
      </TheftSurface>
    </aside>
  );
}

function InspectorSection({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border-t border-border pt-3">
      <p className="theft-label">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
        {rows.map((row) => (
          <li key={row} className="min-w-0 break-words [overflow-wrap:anywhere]">{row}</li>
        ))}
      </ul>
    </div>
  );
}

function CircleMarker({ complete = false }: { complete?: boolean }) {
  return (
    <span className={cn("inline-flex size-3 shrink-0 rounded-full border", complete ? "border-foreground bg-foreground" : "border-muted-foreground")} />
  );
}

function RoadmapRule({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="theft-inset-surface flex items-center justify-between gap-4 px-2 py-2">
      <span className="flex items-center gap-2 text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right">{value}</span>
    </div>
  );
}

function TechTreeNodeCard({ node }: { node: TechTreeNodeView }) {
  return (
    <Link
      to={`/goals/${node.goal.id}`}
      className={cn(
        "theft-surface-plain theft-tech-tree-node-card group grid min-w-0 gap-4 p-4 text-sm text-inherit no-underline transition-colors hover:border-primary/70 hover:bg-accent/40",
        node.depth > 0 && "ml-4 border-l-4 border-l-primary/30",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-primary" />
          <span className="theft-label-compact">{node.goal.level}</span>
          <StatusBadge status={node.goal.status} />
        </div>
        <div className="mt-2 truncate text-base font-medium">{node.goal.title}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{node.dependency}</div>
      </div>
      <div className="min-w-0 space-y-1 text-xs">
        <MetaLine label="Owner" value={node.owner} />
        <MetaLine label="Evidence" value={node.evidence} />
      </div>
      <div className="flex min-w-0 items-center justify-between gap-4 border-l border-border pl-4">
        <div className="min-w-0">
          <div className="theft-label-compact">Next action</div>
          <div className="mt-1 truncate text-sm">{node.nextAction}</div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value}</span>
    </div>
  );
}
