import type { Issue } from "@paperclipai/shared";
import { formatAssigneeUserLabel } from "../assignees";
import { issueLastActivityTimestamp, sortIssuesByMostRecentActivity } from "./activity";
import { resolveIssueWorkspaceGroup } from "./search";
import type {
  InboxGroupedSection,
  InboxKeyboardGroupSection,
  InboxKeyboardNavEntry,
  InboxSearchSection,
  InboxWorkItem,
  InboxWorkItemGroup,
  InboxWorkItemGroupBy,
  InboxWorkspaceGroupingOptions,
} from "./types";

const inboxWorkItemKindOrder: InboxWorkItem["kind"][] = [
  "issue",
  "approval",
  "failed_run",
  "join_request",
];

const inboxWorkItemKindLabels: Record<InboxWorkItem["kind"], string> = {
  issue: "Issues",
  approval: "Approvals",
  failed_run: "Failed runs",
  join_request: "Join requests",
};

function resolveIssueAssigneeGroup(
  issue: Pick<Issue, "assigneeAgentId" | "assigneeUserId">,
  {
    agentById,
    currentUserId,
    userLabelById,
  }: Pick<InboxWorkspaceGroupingOptions, "agentById" | "currentUserId" | "userLabelById">,
): { key: string; label: string } {
  if (issue.assigneeAgentId) {
    const agentName = agentById?.get(issue.assigneeAgentId)?.trim();
    return {
      key: `assignee:agent:${issue.assigneeAgentId}`,
      label: agentName || issue.assigneeAgentId.slice(0, 8),
    };
  }

  if (issue.assigneeUserId) {
    return {
      key: `assignee:user:${issue.assigneeUserId}`,
      label: formatAssigneeUserLabel(issue.assigneeUserId, currentUserId, userLabelById) ?? "User",
    };
  }

  return { key: "assignee:none", label: "Unassigned" };
}

function resolveIssueProjectGroup(
  issue: Pick<Issue, "projectId">,
  { projectById }: Pick<InboxWorkspaceGroupingOptions, "projectById">,
): { key: string; label: string } {
  if (!issue.projectId) return { key: "project:none", label: "No project" };

  const projectName = projectById?.get(issue.projectId)?.name?.trim();
  return {
    key: `project:${issue.projectId}`,
    label: projectName || issue.projectId.slice(0, 8),
  };
}

function groupInboxWorkItemsByIssueGroup(
  items: InboxWorkItem[],
  resolveIssueGroup: (issue: Issue) => { key: string; label: string },
): InboxWorkItemGroup[] {
  const groups = new Map<string, { label: string; items: InboxWorkItem[]; latestTimestamp: number }>();
  for (const item of items) {
    const resolvedGroup = item.kind === "issue"
      ? resolveIssueGroup(item.issue)
      : { key: `kind:${item.kind}`, label: inboxWorkItemKindLabels[item.kind] };
    const existing = groups.get(resolvedGroup.key);
    if (existing) {
      existing.items.push(item);
      existing.latestTimestamp = Math.max(existing.latestTimestamp, item.timestamp);
    } else {
      groups.set(resolvedGroup.key, {
        label: resolvedGroup.label,
        items: [item],
        latestTimestamp: item.timestamp,
      });
    }
  }

  return [...groups.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
      latestTimestamp: value.latestTimestamp,
    }))
    .sort((a, b) => {
      const timestampDiff = b.latestTimestamp - a.latestTimestamp;
      if (timestampDiff !== 0) return timestampDiff;
      return a.label.localeCompare(b.label);
    })
    .map(({ key, label, items: groupItems }) => ({
      key,
      label,
      items: groupItems,
    }));
}

export function groupInboxWorkItems(
  items: InboxWorkItem[],
  groupBy: InboxWorkItemGroupBy,
  options: InboxWorkspaceGroupingOptions = {},
): InboxWorkItemGroup[] {
  if (groupBy === "none") {
    return [{ key: "__all", label: null, items }];
  }

  if (groupBy === "workspace") {
    return groupInboxWorkItemsByIssueGroup(items, (issue) => resolveIssueWorkspaceGroup(issue, options));
  }

  if (groupBy === "assignee") {
    return groupInboxWorkItemsByIssueGroup(items, (issue) => resolveIssueAssigneeGroup(issue, options));
  }

  if (groupBy === "project") {
    return groupInboxWorkItemsByIssueGroup(items, (issue) => resolveIssueProjectGroup(issue, options));
  }

  const groups = new Map<InboxWorkItem["kind"], InboxWorkItem[]>();
  for (const item of items) {
    const existing = groups.get(item.kind) ?? [];
    existing.push(item);
    groups.set(item.kind, existing);
  }

  const orderedGroups: InboxWorkItemGroup[] = [];
  for (const kind of inboxWorkItemKindOrder) {
    const groupItems = groups.get(kind) ?? [];
    if (groupItems.length === 0) continue;
    orderedGroups.push({
      key: kind,
      label: inboxWorkItemKindLabels[kind],
      items: groupItems,
    });
  }
  return orderedGroups;
}

export function buildInboxNesting(items: InboxWorkItem[]): {
  displayItems: InboxWorkItem[];
  childrenByIssueId: Map<string, Issue[]>;
} {
  const issueItems: (InboxWorkItem & { kind: "issue" })[] = [];
  const nonIssueItems: InboxWorkItem[] = [];
  for (const item of items) {
    if (item.kind === "issue") issueItems.push(item as InboxWorkItem & { kind: "issue" });
    else nonIssueItems.push(item);
  }

  const issueIdSet = new Set(issueItems.map((i) => i.issue.id));
  const childrenByIssueId = new Map<string, Issue[]>();
  const childIds = new Set<string>();

  for (const item of issueItems) {
    const { issue } = item;
    if (issue.parentId && issueIdSet.has(issue.parentId)) {
      childIds.add(issue.id);
      const arr = childrenByIssueId.get(issue.parentId) ?? [];
      arr.push(issue);
      childrenByIssueId.set(issue.parentId, arr);
    }
  }

  const subtreeActivityTimestamp = (issue: Issue, seen: ReadonlySet<string> = new Set()): number => {
    const ownTimestamp = issueLastActivityTimestamp(issue);
    if (seen.has(issue.id)) return ownTimestamp;
    const nextSeen = new Set(seen);
    nextSeen.add(issue.id);
    const children = childrenByIssueId.get(issue.id) ?? [];
    if (children.length === 0) return ownTimestamp;
    return Math.max(
      ownTimestamp,
      ...children.map((child) => subtreeActivityTimestamp(child, nextSeen)),
    );
  };

  for (const children of childrenByIssueId.values()) {
    children.sort((a, b) => {
      const activityDiff = subtreeActivityTimestamp(b) - subtreeActivityTimestamp(a);
      if (activityDiff !== 0) return activityDiff;
      return sortIssuesByMostRecentActivity(a, b);
    });
  }

  const rootIssueItems: InboxWorkItem[] = issueItems
    .filter((item) => !childIds.has(item.issue.id))
    .map((item) => {
      const children = childrenByIssueId.get(item.issue.id);
      if (!children?.length) return item;
      const maxChildTs = Math.max(...children.map((child) => subtreeActivityTimestamp(child)));
      return { ...item, timestamp: Math.max(item.timestamp, maxChildTs) };
    });

  const displayItems = [...rootIssueItems, ...nonIssueItems].sort((a, b) => {
    const diff = b.timestamp - a.timestamp;
    if (diff !== 0) return diff;
    if (a.kind === "issue" && b.kind === "issue") {
      return sortIssuesByMostRecentActivity(a.issue, b.issue);
    }
    return 0;
  });

  return { displayItems, childrenByIssueId };
}

export function buildGroupedInboxSections(
  items: InboxWorkItem[],
  groupBy: InboxWorkItemGroupBy,
  workspaceGrouping: InboxWorkspaceGroupingOptions,
  options?: { keyPrefix?: string; searchSection?: InboxSearchSection; nestingEnabled?: boolean },
): InboxGroupedSection[] {
  const keyPrefix = options?.keyPrefix ?? "";
  const searchSection = options?.searchSection ?? "none";
  const nestingEnabled = options?.nestingEnabled ?? false;

  return groupInboxWorkItems(items, groupBy, workspaceGrouping).map((group) => {
    const nestedGroup = nestingEnabled && group.items.some((item) => item.kind === "issue")
      ? buildInboxNesting(group.items)
      : { displayItems: group.items, childrenByIssueId: new Map<string, Issue[]>() };

    return {
      key: `${keyPrefix}${group.key}`,
      label: group.label,
      displayItems: nestedGroup.displayItems,
      childrenByIssueId: nestedGroup.childrenByIssueId,
      searchSection,
    };
  });
}

export function getInboxWorkItemKey(item: InboxWorkItem): string {
  if (item.kind === "issue") return `issue:${item.issue.id}`;
  if (item.kind === "approval") return `approval:${item.approval.id}`;
  if (item.kind === "failed_run") return `run:${item.run.id}`;
  return `join:${item.joinRequest.id}`;
}
