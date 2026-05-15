import type { Agent, Issue, IssueAttachment, IssueDocument, IssueDocumentSummary, IssueWorkProduct } from "@paperclipai/shared";

export type LibraryItemKind = "document" | "attachment" | "work_product";

export interface LibraryIssueBundle {
  issue: Issue;
  documents: Array<IssueDocument | IssueDocumentSummary>;
  attachments: IssueAttachment[];
  workProducts: IssueWorkProduct[];
}

export interface LibraryItem {
  id: string;
  kind: LibraryItemKind;
  title: string;
  subtitle: string;
  issueId: string;
  issueIdentifier: string | null;
  issueTitle: string;
  sourceTaskLabel: string;
  department: string;
  departmentKey: string;
  provenance: string;
  updatedAt: Date | string;
  createdAt: Date | string;
  href: string | null;
  key?: string;
  contentType?: string;
  byteSize?: number;
  status?: string;
  reviewState?: string;
  isImportant: boolean;
}

export interface LibrarySummary {
  totalItems: number;
  importantItems: number;
  departmentCount: number;
  latestUpdatedAt: Date | string | null;
}

export const THEFT_DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Support",
] as const;

const DEPARTMENT_ALIASES: Record<string, string> = {
  engineer: "Engineering",
  engineering: "Engineering",
  design: "Design",
  designer: "Design",
  marketing: "Marketing",
  marketer: "Marketing",
  sales: "Sales",
  operations: "Operations",
  ops: "Operations",
  finance: "Finance",
  legal: "Legal",
  support: "Support",
  customer: "Support",
  success: "Support",
};

export function departmentKey(department: string) {
  return department.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unassigned";
}

export function inferDepartment(issue: Pick<Issue, "assigneeAgentId" | "title" | "description">, agents: Agent[] = []) {
  const assignee = issue.assigneeAgentId
    ? agents.find((agent) => agent.id === issue.assigneeAgentId) ?? null
    : null;
  const candidates = [
    assignee?.title,
    assignee?.name,
    assignee?.role,
    issue.title,
    issue.description,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    for (const [needle, department] of Object.entries(DEPARTMENT_ALIASES)) {
      if (normalized.includes(needle)) return department;
    }
  }

  return "Unassigned";
}

function itemSortValue(item: Pick<LibraryItem, "updatedAt" | "createdAt">) {
  return new Date(item.updatedAt ?? item.createdAt).getTime() || 0;
}

export function buildLibraryItems(bundles: LibraryIssueBundle[], agents: Agent[] = []): LibraryItem[] {
  const items: LibraryItem[] = [];

  for (const bundle of bundles) {
    const department = inferDepartment(bundle.issue, agents);
    const base = {
      issueId: bundle.issue.id,
      issueIdentifier: bundle.issue.identifier ?? null,
      issueTitle: bundle.issue.title,
      sourceTaskLabel: bundle.issue.identifier ?? bundle.issue.title,
      department,
      departmentKey: departmentKey(department),
    };

    for (const document of bundle.documents) {
      const title = document.title?.trim() || document.key;
      items.push({
        ...base,
        id: `document:${document.issueId}:${document.key}`,
        kind: "document",
        title,
        subtitle: `Markdown document from ${bundle.issue.identifier ?? bundle.issue.title}`,
        provenance: `Saved document from ${bundle.issue.identifier ?? bundle.issue.title}`,
        key: document.key,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        href: null,
        status: `rev ${document.latestRevisionNumber}`,
        isImportant: document.key === "plan" || document.key.includes("brief") || document.key.includes("handoff"),
      });
    }

    for (const attachment of bundle.attachments) {
      items.push({
        ...base,
        id: `attachment:${attachment.id}`,
        kind: "attachment",
        title: attachment.originalFilename?.trim() || "Attachment",
        subtitle: attachment.contentType || "File attachment",
        provenance: `Attached file from ${bundle.issue.identifier ?? bundle.issue.title}`,
        contentType: attachment.contentType,
        byteSize: attachment.byteSize,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
        href: attachment.contentPath,
        isImportant: false,
      });
    }

    for (const product of bundle.workProducts) {
      items.push({
        ...base,
        id: `work_product:${product.id}`,
        kind: "work_product",
        title: product.title,
        subtitle: product.summary || product.type.replace(/_/g, " "),
        provenance: `Work product from ${bundle.issue.identifier ?? bundle.issue.title}`,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        href: product.url,
        status: product.status,
        reviewState: product.reviewState,
        isImportant: product.isPrimary || product.reviewState === "needs_board_review",
      });
    }
  }

  return items.sort((a, b) => itemSortValue(b) - itemSortValue(a));
}

export function summarizeLibraryItems(items: LibraryItem[]): LibrarySummary {
  const departments = new Set(items.map((item) => item.departmentKey));
  const sorted = [...items].sort((a, b) => itemSortValue(b) - itemSortValue(a));
  return {
    totalItems: items.length,
    importantItems: items.filter((item) => item.isImportant).length,
    departmentCount: departments.size,
    latestUpdatedAt: sorted[0]?.updatedAt ?? null,
  };
}

export function groupLibraryItemsByDepartment(items: LibraryItem[]) {
  const groups = new Map<string, { department: string; departmentKey: string; items: LibraryItem[] }>();
  for (const item of items) {
    const existing = groups.get(item.departmentKey);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(item.departmentKey, {
        department: item.department,
        departmentKey: item.departmentKey,
        items: [item],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const aIndex = THEFT_DEPARTMENTS.findIndex((department) => department === a.department);
    const bIndex = THEFT_DEPARTMENTS.findIndex((department) => department === b.department);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return a.department.localeCompare(b.department);
  });
}
