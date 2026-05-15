// @vitest-environment node

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildTechTreeNodeViews } from "./Goals";
import { GoalPropertiesToggleButton, getGoalLinkedIssues, getGoalLinkedProjects } from "./GoalDetail";
import type { Agent, Goal, Issue, Project } from "@paperclipai/shared";

describe("GoalPropertiesToggleButton", () => {
  it("shows the reopen control when the properties panel is hidden", () => {
    const html = renderToStaticMarkup(
      <GoalPropertiesToggleButton panelVisible={false} onShowProperties={() => {}} />,
    );

    expect(html).toContain('title="Show properties"');
    expect(html).toContain("opacity-100");
  });

  it("collapses the reopen control while the properties panel is already visible", () => {
    const html = renderToStaticMarkup(
      <GoalPropertiesToggleButton panelVisible onShowProperties={() => {}} />,
    );

    expect(html).toContain("opacity-0");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("w-0");
  });
});

const now = new Date("2026-05-15T10:00:00.000Z");

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: "goal-1",
    companyId: "company-1",
    title: "Launch company",
    description: null,
    level: "company",
    status: "active",
    parentId: null,
    ownerAgentId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function agent(overrides: Partial<Agent>): Agent {
  return {
    id: "agent-1",
    companyId: "company-1",
    name: "Marketing",
    urlKey: "marketing",
    title: "Growth department",
    role: "general",
    icon: null,
    status: "active",
    reportsTo: null,
    capabilities: null,
    adapterType: "process",
    adapterConfig: {},
    runtimeConfig: {},
    budgetMonthlyCents: 0,
    spentMonthlyCents: 0,
    pauseReason: null,
    pausedAt: null,
    permissions: { canCreateAgents: false },
    lastHeartbeatAt: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function project(overrides: Partial<Project>): Project {
  return {
    id: "project-1",
    companyId: "company-1",
    urlKey: "launch",
    goalId: null,
    goalIds: [],
    goals: [],
    name: "Launch plan",
    description: null,
    status: "in_progress",
    leadAgentId: null,
    targetDate: null,
    color: null,
    env: null,
    pauseReason: null,
    pausedAt: null,
    executionWorkspacePolicy: null,
    codebase: {
      workspaceId: null,
      repoUrl: null,
      repoRef: null,
      defaultRef: null,
      repoName: null,
      localFolder: null,
      managedFolder: "",
      effectiveLocalFolder: "",
      origin: "managed_checkout",
    },
    workspaces: [],
    primaryWorkspace: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function issue(overrides: Partial<Issue>): Issue {
  return {
    id: "issue-1",
    companyId: "company-1",
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    title: "Write launch brief",
    description: null,
    status: "todo",
    workMode: "standard",
    priority: "medium",
    assigneeAgentId: null,
    assigneeUserId: null,
    checkoutRunId: null,
    executionRunId: null,
    executionAgentNameKey: null,
    executionLockedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    issueNumber: null,
    identifier: "THE-1",
    requestDepth: 0,
    billingCode: null,
    assigneeAdapterOverrides: null,
    executionWorkspaceId: null,
    executionWorkspacePreference: null,
    executionWorkspaceSettings: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    hiddenAt: null,
    labels: [],
    blockedBy: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Tech Tree helpers", () => {
  it("builds owner, dependency, evidence, and next action for roadmap nodes", () => {
    const parent = goal({ id: "goal-parent", title: "Launch THEFT", ownerAgentId: "agent-1" });
    const child = goal({ id: "goal-child", title: "Create campaign", parentId: "goal-parent", status: "planned" });
    const rows = buildTechTreeNodeViews({
      goals: [parent, child],
      agents: [agent({ id: "agent-1", name: "Marketing", title: "Growth" })],
      projects: [project({ goalIds: ["goal-parent"], status: "completed" })],
      issues: [
        issue({ id: "issue-open", goalId: "goal-parent", title: "Write launch memo", status: "todo" }),
        issue({ id: "issue-done", goalId: "goal-parent", title: "Approve offer", status: "done" }),
      ],
    });

    expect(rows[0]).toMatchObject({
      depth: 0,
      owner: "Marketing · Growth",
      dependency: "1 downstream node",
      evidence: "1/1 projects · 1/2 tasks done",
      nextAction: "Advance task: Write launch memo",
      childCount: 1,
    });
    expect(rows[1]).toMatchObject({
      depth: 1,
      dependency: "Depends on parent node",
    });
  });

  it("links roadmap evidence through project and issue goal ids", () => {
    expect(getGoalLinkedProjects("goal-1", [
      project({ id: "a", goalId: "goal-1" }),
      project({ id: "b", goalIds: ["goal-1"] }),
      project({ id: "c", goals: [{ id: "goal-1", title: "Launch" }] }),
      project({ id: "d", goalId: "other" }),
    ])).toHaveLength(3);

    expect(getGoalLinkedIssues("goal-1", [
      issue({ id: "a", goalId: "goal-1" }),
      issue({ id: "b", goalId: "other" }),
    ])).toHaveLength(1);
  });
});
