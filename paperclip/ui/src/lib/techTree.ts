import type { Agent, Goal, Issue, Project } from "@paperclipai/shared";

export interface TechTreeNodeView {
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
        ? "Depends on parent node"
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
