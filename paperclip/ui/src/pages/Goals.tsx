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
import { ArrowRight, CheckCircle2, GitBranch, Layers3, Plus, Route, Sparkles, Target, Users } from "lucide-react";
import { cn } from "../lib/utils";

interface TechTreeNodeView {
  goal: Goal;
  depth: number;
  owner: string;
  dependency: string;
  evidence: string;
  nextAction: string;
  childCount: number;
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

    let nextAction = "Create first department task";
    if (goal.status === "achieved") {
      nextAction = "Review evidence and keep as company memory";
    } else if (openIssue) {
      nextAction = `Advance task: ${openIssue.title}`;
    } else if (activeProject) {
      nextAction = `Move project: ${activeProject.name}`;
    } else if (activeChild) {
      nextAction = `Advance node: ${activeChild.title}`;
    } else if (childGoals.length > 0) {
      nextAction = "Promote the next child node";
    }

    return {
      goal,
      depth,
      owner: ownerAgent ? `${ownerAgent.name}${ownerAgent.title ? ` · ${ownerAgent.title}` : ""}` : "Operator",
      dependency: goal.parentId
        ? `Depends on parent node`
        : childGoals.length > 0
          ? `${childGoals.length} downstream node${childGoals.length === 1 ? "" : "s"}`
          : "Root roadmap node",
      evidence:
        linkedProjects.length || linkedIssues.length
          ? `${doneProjects}/${linkedProjects.length} projects · ${doneIssues}/${linkedIssues.length} tasks done`
          : "No evidence linked yet",
      nextAction,
      childCount: childGoals.length,
    };
  });
}

export function Goals() {
  const { selectedCompanyId } = useCompany();
  const { openNewGoal } = useDialogActions();
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

  if (!selectedCompanyId) {
    return <EmptyState icon={Target} message="Select a company to view the Tech Tree." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {goals && goals.length === 0 && (
        <EmptyState icon={Target} message="No Tech Tree nodes yet." action="Add Node" onAction={() => openNewGoal()} />
      )}

      {goals && goals.length > 0 && (
        <>
          <section className="overflow-hidden border border-border bg-[#fbfaf7]">
            <div className="flex flex-col gap-4 border-b border-border bg-white/75 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  THEFT roadmap
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
                  Tech Tree
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A company-building roadmap backed by Paperclip goals. Each node shows owner, dependencies,
                  linked evidence, and the next action needed to keep the company moving.
                </p>
              </div>
              <div className="grid min-w-[260px] grid-cols-3 border border-border bg-white text-center">
                <TechTreeStat value={goals.length} label="nodes" />
                <TechTreeStat value={goals.filter((goal) => goal.status === "active").length} label="active" />
                <TechTreeStat value={goals.filter((goal) => goal.status === "achieved").length} label="done" />
              </div>
            </div>
            <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-2">
                {buildTechTreeNodeViews({
                  goals,
                  agents: agents ?? [],
                  projects: projects ?? [],
                  issues: issues ?? [],
                }).map((node) => (
                  <TechTreeNodeCard key={node.goal.id} node={node} />
                ))}
              </div>
              <aside className="border border-border bg-white p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Route className="h-4 w-4 text-emerald-700" />
                  Roadmap rule
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tech Tree nodes are accepted only when they point to evidence: department tasks, projects,
                  Library outputs, or a clear next action.
                </p>
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <RoadmapRule icon={Users} label="Owner" value="Department or Operator" />
                  <RoadmapRule icon={GitBranch} label="Dependency" value="Parent and child nodes" />
                  <RoadmapRule icon={CheckCircle2} label="Evidence" value="Completed work" />
                </div>
              </aside>
            </div>
          </section>
          <div className="flex items-center justify-start">
            <Button size="sm" variant="outline" onClick={() => openNewGoal()}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Node
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function TechTreeStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-border px-3 py-3 last:border-r-0">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

function RoadmapRule({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-border bg-[#fbfaf7] px-2 py-2">
      <span className="flex items-center gap-2 text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function TechTreeNodeCard({ node }: { node: TechTreeNodeView }) {
  return (
    <Link
      to={`/goals/${node.goal.id}`}
      className={cn(
        "group grid gap-3 border border-border bg-white p-3 text-sm text-inherit no-underline transition-colors hover:border-emerald-700/40 hover:bg-emerald-50/20 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]",
        node.depth > 0 && "ml-4 border-l-4 border-l-emerald-700/20",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-emerald-700" />
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{node.goal.level}</span>
          <StatusBadge status={node.goal.status} />
        </div>
        <div className="mt-2 truncate text-base font-medium">{node.goal.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{node.dependency}</div>
      </div>
      <div className="min-w-0 space-y-1 text-xs">
        <MetaLine label="Owner" value={node.owner} />
        <MetaLine label="Evidence" value={node.evidence} />
      </div>
      <div className="flex min-w-0 items-center justify-between gap-3 border-l border-border pl-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Next action</div>
          <div className="mt-1 truncate text-sm">{node.nextAction}</div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700" />
      </div>
    </Link>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value}</span>
    </div>
  );
}
