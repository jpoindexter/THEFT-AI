import { describe, expect, it } from "vitest";
import type { Agent, Company, Goal, Issue, IssueThreadInteraction } from "@paperclipai/shared";
import { buildOnboardingContextBlock } from "./onboarding-context";
import {
  buildDepartmentCanvasRows,
  findOperatorAgent,
  getAttentionIssues,
  getCurrentBottleneck,
  getPendingInteractionsByIssue,
  getRoadmapGoals,
  parseCompanyProfileSummary,
} from "./theft-canvas";

function agent(input: Partial<Agent>): Agent {
  return {
    id: input.id ?? "agent-1",
    name: input.name ?? "Engineering Lead",
    title: input.title ?? null,
    role: input.role ?? "cto",
    status: input.status ?? "active",
  } as Agent;
}

function issue(input: Partial<Issue>): Issue {
  return {
    id: input.id ?? "issue-1",
    title: input.title ?? "Task",
    status: input.status ?? "todo",
    assigneeAgentId: input.assigneeAgentId ?? null,
    updatedAt: input.updatedAt ?? new Date("2026-05-14T10:00:00Z"),
  } as Issue;
}

describe("parseCompanyProfileSummary", () => {
  it("extracts THEFT onboarding stage, setup items, and plain company brief", () => {
    const company = {
      description: [
        "A focused local AI company.",
        "",
        buildOnboardingContextBlock({
          stage: "building",
          initialBrief: "A focused local AI company.",
          operatorName: "Operator",
          setupItems: [
            {
              key: "initial-idea",
              label: "Initial idea",
              status: "done",
              note: "AI operating company",
            },
            {
              key: "first-customer",
              label: "First customer",
              status: "todo",
            },
            {
              key: "launch-plan",
              label: "Launch plan",
              status: "skipped",
              note: "already exists elsewhere",
            },
          ],
        }),
      ].join("\n"),
    } as Company;

    expect(parseCompanyProfileSummary(company)).toEqual({
      stage: "building",
      brief: "A focused local AI company.",
      setupItems: [
        {
          key: "initial-idea",
          label: "Initial idea",
          status: "done",
          note: "AI operating company",
        },
        {
          key: "first-customer",
          label: "First customer",
          status: "todo",
          note: null,
        },
        {
          key: "launch-plan",
          label: "Launch plan",
          status: "skipped",
          note: "already exists elsewhere",
        },
      ],
    });
  });
});

describe("buildDepartmentCanvasRows", () => {
  it("maps department agents to their Paperclip issue queues", () => {
    const engineering = agent({ id: "eng-agent", name: "Engineering Lead", role: "cto" });
    const design = agent({ id: "design-agent", name: "Design Lead", role: "designer" });

    const rows = buildDepartmentCanvasRows(
      [engineering, design],
      [
        issue({ id: "eng-open", assigneeAgentId: "eng-agent", status: "todo" }),
        issue({ id: "eng-review", assigneeAgentId: "eng-agent", status: "in_review" }),
        issue({ id: "design-done", assigneeAgentId: "design-agent", status: "done" }),
      ],
    );

    const engineeringRow = rows.find((row) => row.key === "engineering");
    const designRow = rows.find((row) => row.key === "design");

    expect(engineeringRow?.agent?.id).toBe("eng-agent");
    expect(engineeringRow?.activeCount).toBe(1);
    expect(engineeringRow?.reviewCount).toBe(1);
    expect(designRow?.doneCount).toBe(1);
  });
});

describe("THEFT canvas attention helpers", () => {
  it("prefers operator by name and falls back to CEO", () => {
    expect(findOperatorAgent([agent({ id: "ceo", role: "ceo", name: "CEO" })])?.id).toBe("ceo");
    expect(
      findOperatorAgent([
        agent({ id: "ceo", role: "ceo", name: "CEO" }),
        agent({ id: "operator", role: "general", name: "Operator" }),
      ])?.id,
    ).toBe("operator");
  });

  it("sorts attention issues by severity then updated time", () => {
    expect(
      getAttentionIssues([
        issue({ id: "review", status: "in_review", updatedAt: new Date("2026-05-14T12:00:00Z") }),
        issue({ id: "blocked", status: "blocked", updatedAt: new Date("2026-05-14T11:00:00Z") }),
        issue({ id: "todo", status: "todo", updatedAt: new Date("2026-05-14T13:00:00Z") }),
      ]).map((item) => item.id),
    ).toEqual(["blocked", "review"]);
  });

  it("collects pending issue interactions", () => {
    const pending = { id: "interaction-1", status: "pending" } as IssueThreadInteraction;
    const answered = { id: "interaction-2", status: "answered" } as IssueThreadInteraction;

    expect(getPendingInteractionsByIssue({ "issue-1": [pending, answered] })).toEqual([
      { issueId: "issue-1", interaction: pending },
    ]);
  });

  it("summarizes the current company bottleneck from decisions before task state", () => {
    expect(
      getCurrentBottleneck({
        attentionIssues: [issue({ id: "blocked", status: "blocked", title: "Fix checkout" })],
        openIssues: [],
        setupItems: [],
        approvalsCount: 1,
        interactionsCount: 2,
      }),
    ).toMatchObject({
      label: "Founder decision required",
      detail: "1 approvals · 2 questions",
      issue: null,
      tone: "review",
    });
  });

  it("falls back through blocked work, setup gaps, active work, and clear state", () => {
    const blocked = issue({ id: "blocked", status: "blocked", title: "Unblock launch" });
    expect(
      getCurrentBottleneck({
        attentionIssues: [blocked],
        openIssues: [],
        setupItems: [],
        approvalsCount: 0,
        interactionsCount: 0,
      }),
    ).toMatchObject({ label: "Blocked task", issue: blocked, tone: "attention" });

    expect(
      getCurrentBottleneck({
        attentionIssues: [],
        openIssues: [],
        setupItems: [{ key: "customer", label: "First customer", status: "todo", note: null }],
        approvalsCount: 0,
        interactionsCount: 0,
      }),
    ).toMatchObject({ label: "Company setup gap", detail: "First customer", tone: "setup" });

    const active = issue({ id: "active", status: "todo", title: "Write landing page" });
    expect(
      getCurrentBottleneck({
        attentionIssues: [],
        openIssues: [active],
        setupItems: [],
        approvalsCount: 0,
        interactionsCount: 0,
      }),
    ).toMatchObject({ label: "Next task ready", issue: active, tone: "work" });

    expect(
      getCurrentBottleneck({
        attentionIssues: [],
        openIssues: [],
        setupItems: [],
        approvalsCount: 0,
        interactionsCount: 0,
      }),
    ).toMatchObject({ label: "No bottleneck", tone: "clear" });
  });

  it("orders active roadmap goals before completed work", () => {
    const goals = [
      { id: "done", status: "achieved", level: "company", createdAt: new Date("2026-05-14T09:00:00Z") },
      { id: "project", status: "active", level: "project", createdAt: new Date("2026-05-14T08:00:00Z") },
      { id: "company", status: "active", level: "company", createdAt: new Date("2026-05-14T10:00:00Z") },
    ] as Goal[];

    expect(getRoadmapGoals(goals).map((goal) => goal.id)).toEqual(["company", "project"]);
  });
});
