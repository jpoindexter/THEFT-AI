import type { Agent, Company, Goal, Issue, IssueThreadInteraction } from "@paperclipai/shared";
import { DEPARTMENT_SEED_SPECS } from "./onboarding-seed";
import { parseOnboardingContextBlock } from "./onboarding-context";
import type { OnboardingStage, OnboardingSetupStatus } from "./onboarding-context";

export interface CompanyProfileSummary {
  stage: OnboardingStage | null;
  setupItems: Array<{
    key: string;
    label: string;
    status: OnboardingSetupStatus;
    note: string | null;
  }>;
  brief: string | null;
}

export interface DepartmentCanvasRow {
  key: string;
  title: string;
  agent: Agent | null;
  issues: Issue[];
  activeCount: number;
  reviewCount: number;
  doneCount: number;
}

const DEPARTMENT_BY_KEY = new Map(DEPARTMENT_SEED_SPECS.map((department) => [department.key, department]));

export const THEFT_STAGE_LABELS: Record<OnboardingStage, string> = {
  "pre-idea": "Pre-idea",
  idea: "Idea",
  validating: "Validating",
  building: "Building",
  launched: "Launched",
  revenue: "Revenue",
  scaling: "Scaling",
  "existing-business": "Existing business",
};

export const ACTIVE_ISSUE_STATUSES = new Set(["backlog", "todo", "in_progress", "blocked"]);

function prettifySetupLabel(key: string) {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseCompanyProfileSummary(company: Pick<Company, "description">): CompanyProfileSummary {
  const description = company.description ?? "";
  const contextStart = description.indexOf("[theft-onboarding]");
  const brief = (contextStart >= 0 ? description.slice(0, contextStart) : description).trim() || null;
  const parsedContext = parseOnboardingContextBlock(description);

  if (parsedContext) {
    const parsedBrief = parsedContext.initialBrief.trim() || null;
    return {
      stage: parsedContext.stage,
      brief: brief ?? parsedBrief,
      setupItems: parsedContext.setupItems.map((item) => ({
        key: item.key,
        label: item.label || prettifySetupLabel(item.key),
        status: item.status,
        note: item.note?.trim() || null,
      })),
    };
  }

  const context = contextStart >= 0 ? description.slice(contextStart).split(/\r?\n/) : [];
  let stage: OnboardingStage | null = null;
  const setupItems: CompanyProfileSummary["setupItems"] = [];
  for (const line of context) {
    const stageMatch = line.match(/^stage=(.+)$/);
    if (stageMatch && stageMatch[1] && stageMatch[1] in THEFT_STAGE_LABELS) stage = stageMatch[1] as OnboardingStage;
    const setupMatch = line.match(/^- ([^:]+):(todo|done|skipped)(?: \((.*)\))?$/);
    if (!setupMatch || !setupMatch[1] || !setupMatch[2]) continue;
    setupItems.push({
      key: setupMatch[1],
      label: prettifySetupLabel(setupMatch[1]),
      status: setupMatch[2] as OnboardingSetupStatus,
      note: setupMatch[3]?.trim() || null,
    });
  }

  return { stage, setupItems, brief };
}

function normalized(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findOperatorAgent(agents: Agent[]): Agent | null {
  return (
    agents.find((agent) => normalized(agent.name).includes("operator")) ??
    agents.find((agent) => agent.role === "ceo") ??
    null
  );
}

function findDepartmentAgent(agents: Agent[], departmentKey: string): Agent | null {
  const department = DEPARTMENT_BY_KEY.get(departmentKey);
  if (!department) return null;
  const title = normalized(department.title);
  const seedName = normalized(department.agentName);
  const role = department.role;

  return (
    agents.find((agent) => normalized(agent.name) === seedName) ??
    agents.find((agent) => normalized(agent.title) === title) ??
    agents.find((agent) => normalized(agent.name).includes(title)) ??
    agents.find((agent) => agent.role === role) ??
    null
  );
}

export function buildDepartmentCanvasRows(agents: Agent[], issues: Issue[]): DepartmentCanvasRow[] {
  return DEPARTMENT_SEED_SPECS.map((department) => {
    const agent = findDepartmentAgent(agents, department.key);
    const departmentIssues = agent
      ? issues.filter((issue) => issue.assigneeAgentId === agent.id)
      : [];
    return {
      key: department.key,
      title: department.title,
      agent,
      issues: departmentIssues,
      activeCount: departmentIssues.filter((issue) => ACTIVE_ISSUE_STATUSES.has(issue.status)).length,
      reviewCount: departmentIssues.filter((issue) => issue.status === "in_review").length,
      doneCount: departmentIssues.filter((issue) => issue.status === "done").length,
    };
  });
}

export function getIssueAttentionScore(issue: Issue): number {
  if (issue.status === "blocked") return 4;
  if (issue.successfulRunHandoff?.required) return 4;
  if (issue.productivityReview) return 3;
  if (issue.status === "in_review") return 2;
  if (issue.blockerAttention?.state === "needs_attention") return 2;
  return 0;
}

export function getAttentionIssues(issues: Issue[]): Issue[] {
  return issues
    .filter((issue) => getIssueAttentionScore(issue) > 0)
    .sort((a, b) => {
      const scoreDelta = getIssueAttentionScore(b) - getIssueAttentionScore(a);
      if (scoreDelta !== 0) return scoreDelta;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export function getPendingInteractionsByIssue(
  interactionsByIssueId: Record<string, IssueThreadInteraction[] | undefined>,
) {
  return Object.entries(interactionsByIssueId).flatMap(([issueId, interactions]) =>
    (interactions ?? [])
      .filter((interaction) => interaction.status === "pending")
      .map((interaction) => ({ issueId, interaction })),
  );
}

export function getRoadmapGoals(goals: Goal[]): Goal[] {
  return [...goals]
    .filter((goal) => !["achieved", "cancelled"].includes(goal.status))
    .sort((a, b) => {
      const levelDelta = goalLevelRank(a.level) - goalLevelRank(b.level);
      if (levelDelta !== 0) return levelDelta;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

function goalLevelRank(level: string) {
  if (level === "company") return 0;
  if (level === "project") return 1;
  return 2;
}
