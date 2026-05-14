import { describe, expect, it } from "vitest";
import type { Agent, Issue, IssueAttachment, IssueDocument, IssueWorkProduct } from "@paperclipai/shared";
import { buildLibraryItems, groupLibraryItemsByDepartment, inferDepartment, summarizeLibraryItems, type LibraryItem } from "./library-items";

const now = new Date("2026-05-14T12:00:00.000Z");

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    companyId: "company-1",
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    title: "Draft launch positioning",
    description: null,
    status: "todo",
    workMode: "standard",
    priority: "medium",
    assigneeAgentId: "agent-marketing",
    assigneeUserId: null,
    checkoutRunId: null,
    executionRunId: null,
    executionAgentNameKey: null,
    executionLockedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    issueNumber: 7,
    identifier: "THF-7",
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const agents = [
  {
    id: "agent-marketing",
    companyId: "company-1",
    name: "Marketing",
    urlKey: "marketing",
    role: "general",
    title: "Marketing department",
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
  },
] satisfies Agent[];

describe("library item mapping", () => {
  it("infers department from assigned THEFT department agent", () => {
    expect(inferDepartment(issue(), agents)).toBe("Marketing");
  });

  it("maps issue documents, attachments, and work products into sorted Library items", () => {
    const document: IssueDocument = {
      id: "doc-1",
      companyId: "company-1",
      issueId: "issue-1",
      key: "campaign_brief",
      title: "Campaign brief",
      format: "markdown",
      body: "# Campaign",
      latestRevisionId: "rev-1",
      latestRevisionNumber: 2,
      createdByAgentId: null,
      createdByUserId: null,
      updatedByAgentId: "agent-marketing",
      updatedByUserId: null,
      createdAt: "2026-05-14T10:00:00.000Z" as unknown as Date,
      updatedAt: "2026-05-14T11:00:00.000Z" as unknown as Date,
    };
    const attachment: IssueAttachment = {
      id: "attachment-1",
      companyId: "company-1",
      issueId: "issue-1",
      issueCommentId: null,
      assetId: "asset-1",
      provider: "local",
      objectKey: "assets/attachment-1",
      contentType: "text/plain",
      byteSize: 128,
      sha256: "abc",
      originalFilename: "notes.txt",
      createdByAgentId: null,
      createdByUserId: null,
      createdAt: "2026-05-14T09:00:00.000Z" as unknown as Date,
      updatedAt: "2026-05-14T09:00:00.000Z" as unknown as Date,
      contentPath: "/api/attachments/attachment-1/content",
    };
    const workProduct: IssueWorkProduct = {
      id: "work-1",
      companyId: "company-1",
      projectId: null,
      issueId: "issue-1",
      executionWorkspaceId: null,
      runtimeServiceId: null,
      type: "artifact",
      provider: "paperclip",
      externalId: null,
      title: "Launch memo",
      url: null,
      status: "ready_for_review",
      reviewState: "needs_board_review",
      isPrimary: true,
      healthStatus: "unknown",
      summary: "Positioning output",
      metadata: null,
      createdByRunId: null,
      createdAt: "2026-05-14T08:00:00.000Z" as unknown as Date,
      updatedAt: "2026-05-14T12:00:00.000Z" as unknown as Date,
    };

    const items = buildLibraryItems([{ issue: issue(), documents: [document], attachments: [attachment], workProducts: [workProduct] }], agents);

    expect(items.map((item) => item.kind)).toEqual(["work_product", "document", "attachment"]);
    expect(items[0]).toMatchObject({
      title: "Launch memo",
      department: "Marketing",
      isImportant: true,
    });
    expect(items[1]).toMatchObject({
      title: "Campaign brief",
      key: "campaign_brief",
      isImportant: true,
    });
  });

  it("orders department groups by the THEFT operating model", () => {
    const base = {
      id: "item",
      kind: "document",
      title: "Doc",
      subtitle: "Doc",
      issueId: "issue",
      issueIdentifier: null,
      issueTitle: "Issue",
      updatedAt: now,
      createdAt: now,
      href: null,
      isImportant: false,
    } satisfies Omit<LibraryItem, "department" | "departmentKey">;
    const groups = groupLibraryItemsByDepartment([
      { ...base, id: "legal", department: "Legal", departmentKey: "legal" },
      { ...base, id: "engineering", department: "Engineering", departmentKey: "engineering" },
    ]);

    expect(groups.map((group) => group.department)).toEqual(["Engineering", "Legal"]);
  });

  it("summarizes Library memory for the company shelf", () => {
    const base = {
      id: "item",
      kind: "document",
      title: "Doc",
      subtitle: "Doc",
      issueId: "issue",
      issueIdentifier: null,
      issueTitle: "Issue",
      createdAt: now,
      href: null,
    } satisfies Omit<LibraryItem, "department" | "departmentKey" | "updatedAt" | "isImportant">;

    expect(
      summarizeLibraryItems([
        {
          ...base,
          id: "engineering",
          department: "Engineering",
          departmentKey: "engineering",
          updatedAt: new Date("2026-05-14T12:00:00.000Z"),
          isImportant: true,
        },
        {
          ...base,
          id: "legal",
          department: "Legal",
          departmentKey: "legal",
          updatedAt: new Date("2026-05-14T11:00:00.000Z"),
          isImportant: false,
        },
      ]),
    ).toEqual({
      totalItems: 2,
      importantItems: 1,
      departmentCount: 2,
      latestUpdatedAt: new Date("2026-05-14T12:00:00.000Z"),
    });
  });
});
