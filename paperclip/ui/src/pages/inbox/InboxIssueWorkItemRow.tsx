import type { Issue } from "@paperclipai/shared";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InboxIssueMetaLeading,
  InboxIssueTrailingColumns,
  issueActivityText,
} from "../../components/IssueColumns";
import { IssueRow } from "../../components/IssueRow";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import type { CompanyUserProfile } from "../../lib/company-members";
import {
  resolveIssueWorkspaceName,
  type InboxIssueColumn,
  type InboxWorkspaceGroupingOptions,
} from "../../lib/inbox";
import { cn } from "../../lib/utils";

type InboxIssueWorkItemRowProps = {
  agentName: (id: string | null) => string | null;
  allowArchive?: boolean;
  archiveIssue: (id: string) => void;
  archiveIssuePending: boolean;
  archivingIssueIds: ReadonlySet<string>;
  availableIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  childCount?: number;
  collapseParentId?: string | null;
  companyUserLabelMap: ReadonlyMap<string, string>;
  companyUserProfileMap: ReadonlyMap<string, CompanyUserProfile>;
  currentUserId: string | null;
  depth: number;
  fadingOutIssues: ReadonlySet<string>;
  hasChildren?: boolean;
  isExpanded?: boolean;
  issue: Issue;
  issueById: ReadonlyMap<string, Issue>;
  issueLinkState: unknown;
  liveIssueIds: ReadonlySet<string>;
  markIssueRead: (id: string) => void;
  nestingEnabled: boolean;
  projectById: ReadonlyMap<string, { name: string; color: string | null }>;
  selected: boolean;
  toggleInboxParentCollapse: (parentId: string) => void;
  visibleIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  visibleTrailingIssueColumns: InboxIssueColumn[];
  workspaceGrouping: InboxWorkspaceGroupingOptions;
};

export function InboxIssueWorkItemRow({
  agentName,
  allowArchive = true,
  archiveIssue,
  archiveIssuePending,
  archivingIssueIds,
  availableIssueColumnSet,
  childCount = 0,
  collapseParentId = null,
  companyUserLabelMap,
  companyUserProfileMap,
  currentUserId,
  depth,
  fadingOutIssues,
  hasChildren = false,
  isExpanded = false,
  issue,
  issueById,
  issueLinkState,
  liveIssueIds,
  markIssueRead,
  nestingEnabled,
  projectById,
  selected,
  toggleInboxParentCollapse,
  visibleIssueColumnSet,
  visibleTrailingIssueColumns,
  workspaceGrouping,
}: InboxIssueWorkItemRowProps) {
  const isUnread = issue.isUnreadForMe && !fadingOutIssues.has(issue.id);
  const isArchiving = archivingIssueIds.has(issue.id);
  const project = issue.projectId ? projectById.get(issue.projectId) ?? null : null;
  const assigneeUserProfile = issue.assigneeUserId
    ? companyUserProfileMap.get(issue.assigneeUserId) ?? null
    : null;

  return (
    <IssueRow
      key={`issue:${issue.id}`}
      issue={issue}
      issueLinkState={issueLinkState}
      selected={selected}
      className={isArchiving ? "pointer-events-none -translate-x-4 scale-[0.98] opacity-0 transition-all duration-200 ease-out" : "transition-all duration-200 ease-out"}
      desktopMetaLeading={
        <>
          {nestingEnabled ? (
            depth === 0 && hasChildren && collapseParentId ? (
              <InboxParentToggle
                expanded={isExpanded}
                className="hidden h-4 w-4 shrink-0 p-0 sm:inline-flex"
                onToggle={() => toggleInboxParentCollapse(collapseParentId)}
              />
            ) : (
              <span className="hidden w-4 shrink-0 sm:block" />
            )
          ) : null}
          {depth > 0 ? <span className="hidden w-4 shrink-0 sm:block" /> : null}
          <InboxIssueMetaLeading
            issue={issue}
            isLive={liveIssueIds.has(issue.id)}
            showStatus={visibleIssueColumnSet.has("status") && availableIssueColumnSet.has("status")}
            showIdentifier={visibleIssueColumnSet.has("id") && availableIssueColumnSet.has("id")}
          />
        </>
      }
      titleSuffix={hasChildren && !isExpanded && depth === 0 ? (
        <span className="ml-1.5 text-xs text-muted-foreground">
          ({childCount} sub-task{childCount !== 1 ? "s" : ""})
        </span>
      ) : undefined}
      mobileMeta={issueActivityText(issue).toLowerCase()}
      mobileLeading={depth === 0 && hasChildren && collapseParentId ? (
        <InboxParentToggle
          expanded={isExpanded}
          className="h-6 w-6 p-0"
          onToggle={() => toggleInboxParentCollapse(collapseParentId)}
        />
      ) : undefined}
      unreadState={isUnread ? "visible" : fadingOutIssues.has(issue.id) ? "fading" : "hidden"}
      onMarkRead={() => markIssueRead(issue.id)}
      onArchive={allowArchive ? () => archiveIssue(issue.id) : undefined}
      archiveDisabled={isArchiving || archiveIssuePending}
      desktopTrailing={visibleTrailingIssueColumns.length > 0 ? (
        <InboxIssueTrailingColumns
          issue={issue}
          columns={visibleTrailingIssueColumns}
          projectName={project?.name ?? null}
          projectColor={project?.color ?? null}
          workspaceName={resolveIssueWorkspaceName(issue, workspaceGrouping)}
          assigneeName={agentName(issue.assigneeAgentId)}
          assigneeUserName={
            formatAssigneeUserLabel(issue.assigneeUserId, currentUserId, companyUserLabelMap)
            ?? assigneeUserProfile?.label
            ?? null
          }
          assigneeUserAvatarUrl={assigneeUserProfile?.image ?? null}
          currentUserId={currentUserId}
          parentIdentifier={issue.parentId ? (issueById.get(issue.parentId)?.identifier ?? null) : null}
          parentTitle={issue.parentId ? (issueById.get(issue.parentId)?.title ?? null) : null}
        />
      ) : undefined}
    />
  );
}

function InboxParentToggle({
  className,
  expanded,
  onToggle,
}: {
  className: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
    </Button>
  );
}
