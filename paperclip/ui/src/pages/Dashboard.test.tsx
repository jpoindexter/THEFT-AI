// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Agent, Company, Goal, Issue, IssueDocument } from "@paperclipai/shared";
import { buildOnboardingContextBlock } from "../lib/onboarding-context";
import { Dashboard } from "./Dashboard";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockSetBreadcrumbs = vi.hoisted(() => vi.fn());
const mockAgentsList = vi.hoisted(() => vi.fn());
const mockIssuesList = vi.hoisted(() => vi.fn());
const mockGoalsList = vi.hoisted(() => vi.fn());
const mockApprovalsList = vi.hoisted(() => vi.fn());
const mockInteractionsList = vi.hoisted(() => vi.fn());
const mockDocumentsList = vi.hoisted(() => vi.fn());
const mockIssueCreate = vi.hoisted(() => vi.fn());

const company = {
  id: "company-1",
  name: "THEFT Studio",
  issuePrefix: "THE",
  description: [
    "A local AI company OS.",
    "",
    buildOnboardingContextBlock({
      stage: "building",
      initialBrief: "A local AI company OS.",
      operatorName: "Operator",
      setupItems: [{ key: "first-customer", label: "First customer", status: "todo" }],
    }),
  ].join("\n"),
} as Company;

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({
    selectedCompanyId: company.id,
    selectedCompany: company,
    companies: [company],
  }),
}));

vi.mock("../context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({ setBreadcrumbs: mockSetBreadcrumbs }),
}));

vi.mock("../context/DialogContext", () => ({
  useDialogActions: () => ({ openOnboarding: vi.fn() }),
}));

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../api/agents", () => ({
  agentsApi: { list: mockAgentsList },
}));

vi.mock("../api/issues", () => ({
  issuesApi: {
    list: mockIssuesList,
    listInteractions: mockInteractionsList,
    listDocuments: mockDocumentsList,
    create: mockIssueCreate,
  },
}));

vi.mock("../api/goals", () => ({
  goalsApi: { list: mockGoalsList },
}));

vi.mock("../api/approvals", () => ({
  approvalsApi: { list: mockApprovalsList },
}));

function agent(input: Partial<Agent>): Agent {
  return {
    id: input.id ?? "agent-1",
    name: input.name ?? "Agent",
    title: input.title ?? null,
    role: input.role ?? "general",
    status: input.status ?? "active",
  } as Agent;
}

function issue(input: Partial<Issue>): Issue {
  return {
    id: input.id ?? "issue-1",
    identifier: input.identifier ?? "THE-1",
    title: input.title ?? "Task",
    status: input.status ?? "todo",
    assigneeAgentId: input.assigneeAgentId ?? null,
    updatedAt: input.updatedAt ?? new Date("2026-05-14T10:00:00Z"),
  } as Issue;
}

function documentOutput(input: Partial<IssueDocument>): IssueDocument {
  return {
    id: input.id ?? "doc-1",
    companyId: company.id,
    issueId: input.issueId ?? "issue-1",
    key: input.key ?? "brief",
    title: input.title ?? "Launch brief",
    format: "markdown",
    body: input.body ?? "# Launch brief",
    latestRevisionId: null,
    latestRevisionNumber: 1,
    createdByAgentId: null,
    createdByUserId: null,
    updatedByAgentId: null,
    updatedByUserId: null,
    createdAt: input.createdAt ?? new Date("2026-05-14T10:00:00Z"),
    updatedAt: input.updatedAt ?? new Date("2026-05-14T11:00:00Z"),
  };
}

function renderDashboard() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>,
    );
  });

  return { container, root };
}

describe("Dashboard", () => {
  let root: Root | null = null;

  beforeEach(() => {
    mockSetBreadcrumbs.mockClear();
    mockAgentsList.mockResolvedValue([
      agent({ id: "operator", name: "Operator", role: "ceo" }),
      agent({ id: "engineering", name: "Engineering Lead", role: "cto" }),
      agent({ id: "design", name: "Design Lead", role: "designer" }),
    ]);
    mockIssuesList.mockResolvedValue([
      issue({
        id: "issue-blocked",
        identifier: "THE-9",
        title: "Unblock launch page",
        status: "blocked",
        assigneeAgentId: "engineering",
        updatedAt: new Date("2026-05-14T12:00:00Z"),
      }),
      issue({
        id: "issue-output",
        identifier: "THE-8",
        title: "Create launch brief",
        status: "todo",
        assigneeAgentId: "design",
        updatedAt: new Date("2026-05-14T11:00:00Z"),
      }),
    ]);
    mockGoalsList.mockResolvedValue([
      {
        id: "goal-1",
        title: "Launch first offer",
        status: "active",
        level: "company",
        parentId: null,
        description: "Open the path to first revenue.",
        createdAt: new Date("2026-05-14T09:00:00Z"),
      } as Goal,
    ]);
    mockApprovalsList.mockResolvedValue([]);
    mockInteractionsList.mockResolvedValue([]);
    mockDocumentsList.mockImplementation((issueId: string) =>
      Promise.resolve(issueId === "issue-output" ? [documentOutput({ issueId })] : []),
    );
    mockIssueCreate.mockResolvedValue(issue({ id: "issue-created" }));
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
  });

  it("renders THEFT Mission Control with objective, constraints, strategy map, decisions, outcomes, and Operator dock", async () => {
    const rendered = renderDashboard();
    root = rendered.root;

    await act(async () => {
      await vi.waitFor(() => expect(rendered.container.textContent).toContain("THEFT Studio"));
      await vi.waitFor(() => expect(rendered.container.textContent).toContain("Launch brief"));
    });

    const text = rendered.container.textContent ?? "";
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([{ label: "Mission Control" }]);
    expect(text).toContain("Objective");
    expect(text).toContain("Launch first offer");
    expect(text).toContain("Operator guide");
    expect(text).toContain("Unblock launch page");
    expect(text).toContain("Idea");
    expect(text).toContain("Departments");
    expect(text).toContain("Library");
    expect(text).toContain("Task output should land in Library before approval.");
    expect(text).toContain("Next Move");
    expect(text).toContain("Blocked task");
    expect(text).toContain("Unblock launch page");
    expect(text).toContain("Strategy map");
    expect(text).toContain("Constraints");
    expect(text).toContain("Decisions");
    expect(text).toContain("Execution state");
    expect(text).toContain("Outcomes");
    expect(text).toContain("Operator dock");
    expect(text).toContain("Open guide");
    expect(text).toContain("Tech Tree");
    expect(text).not.toContain("Paperclip agents and assigned issues");
    expect(text).not.toContain("Create Paperclip task");
  });
});
