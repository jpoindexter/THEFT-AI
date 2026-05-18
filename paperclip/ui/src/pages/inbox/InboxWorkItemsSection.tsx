import type { ReactNode, RefObject } from "react";
import type { HeartbeatRun, Issue, JoinRequest } from "@paperclipai/shared";

import { Separator } from "@/components/ui/separator";
import { IssueGroupHeader } from "../../components/IssueGroupHeader";
import { SwipeToArchive } from "../../components/SwipeToArchive";
import type { CompanyUserProfile } from "../../lib/company-members";
import {
  getInboxWorkItemKey,
  type InboxGroupedSection,
  type InboxIssueColumn,
  type InboxWorkItem,
  type InboxWorkItemGroupBy,
  type InboxWorkspaceGroupingOptions,
} from "../../lib/inbox";
import { cn } from "../../lib/utils";
import { FailedRunInboxRow } from "./FailedRunInboxRow";
import {
  ApprovalInboxRow,
  JoinRequestInboxRow,
  type NonIssueUnreadState,
} from "./InboxDecisionRows";
import { InboxIssueWorkItemRow } from "./InboxIssueWorkItemRow";

type InboxWorkItemsSectionProps = {
  agentName: (id: string | null) => string | null;
  archiveIssue: (id: string) => void;
  archiveIssuePending: boolean;
  archiveNonIssue: (key: string) => void;
  archivingIssueIds: ReadonlySet<string>;
  archivingNonIssueIds: ReadonlySet<string>;
  availableIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  canArchiveFromTab: boolean;
  childFlatIndex: ReadonlyMap<string, number>;
  collapsedGroupKeys: ReadonlySet<string>;
  collapsedInboxParents: ReadonlySet<string>;
  companyUserLabelMap: ReadonlyMap<string, string>;
  companyUserProfileMap: ReadonlyMap<string, CompanyUserProfile>;
  currentUserId: string | null;
  fadingOutIssues: ReadonlySet<string>;
  groupBy: InboxWorkItemGroupBy;
  groupFlatIndex: ReadonlyMap<string, number>;
  groupedSections: InboxGroupedSection[];
  issueById: ReadonlyMap<string, Issue>;
  issueLinkState: unknown;
  listRef: RefObject<HTMLDivElement | null>;
  liveIssueIds: ReadonlySet<string>;
  markIssueRead: (id: string) => void;
  markNonIssueRead: (key: string) => void;
  nestingEnabled: boolean;
  nonIssueUnreadState: (key: string) => NonIssueUnreadState;
  onApprove: (id: string) => void;
  onApproveJoinRequest: (joinRequest: JoinRequest) => void;
  onDismissRun: (key: string) => void;
  onReject: (id: string) => void;
  onRejectJoinRequest: (joinRequest: JoinRequest) => void;
  onRetryRun: (run: HeartbeatRun) => void;
  projectById: ReadonlyMap<string, { name: string; color: string | null }>;
  retryingRunIds: ReadonlySet<string>;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  showSeparator: boolean;
  toggleGroupCollapse: (groupKey: string) => void;
  toggleInboxParentCollapse: (parentId: string) => void;
  topFlatIndex: ReadonlyMap<string, number>;
  visibleIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  visibleTrailingIssueColumns: InboxIssueColumn[];
  workspaceGrouping: InboxWorkspaceGroupingOptions;
  decisionPending: boolean;
  joinDecisionPending: boolean;
};

export function InboxWorkItemsSection(props: InboxWorkItemsSectionProps) {
  const renderWithSwipe = (key: string, selected: boolean, disabled: boolean, child: ReactNode) => (
    <SwipeToArchive selected={selected} disabled={disabled} onArchive={() => props.archiveNonIssue(key)}>
      {child}
    </SwipeToArchive>
  );

  const renderIssueTree = (
    group: InboxGroupedSection,
    issue: Issue,
    depth: number,
    seen: ReadonlySet<string>,
  ): ReactNode[] => {
    if (seen.has(issue.id)) return [];
    const nextSeen = new Set(seen);
    nextSeen.add(issue.id);
    const navIdx = props.childFlatIndex.get(issue.id) ?? -1;
    const selected = props.selectedIndex === navIdx;
    const children = group.childrenByIssueId.get(issue.id) ?? [];
    const expanded = children.length > 0 && !props.collapsedInboxParents.has(issue.id);
    const row = wrapIssueRow(group, issue, depth, selected, navIdx, children);
    return expanded ? [row, ...children.flatMap((child) => renderIssueTree(group, child, depth + 1, nextSeen))] : [row];
  };

  const wrapIssueRow = (
    group: InboxGroupedSection,
    issue: Issue,
    depth: number,
    selected: boolean,
    navIdx: number,
    children: Issue[],
  ) => {
    const allowArchive = props.canArchiveFromTab && group.searchSection === "none";
    const issueRow = (
      <InboxIssueWorkItemRow
        agentName={props.agentName}
        allowArchive={allowArchive}
        archiveIssue={props.archiveIssue}
        archiveIssuePending={props.archiveIssuePending}
        archivingIssueIds={props.archivingIssueIds}
        availableIssueColumnSet={props.availableIssueColumnSet}
        childCount={children.length}
        collapseParentId={issue.id}
        companyUserLabelMap={props.companyUserLabelMap}
        companyUserProfileMap={props.companyUserProfileMap}
        currentUserId={props.currentUserId}
        depth={depth}
        fadingOutIssues={props.fadingOutIssues}
        hasChildren={children.length > 0}
        isExpanded={children.length > 0 && !props.collapsedInboxParents.has(issue.id)}
        issue={issue}
        issueById={props.issueById}
        issueLinkState={props.issueLinkState}
        liveIssueIds={props.liveIssueIds}
        markIssueRead={props.markIssueRead}
        nestingEnabled={props.nestingEnabled}
        projectById={props.projectById}
        selected={selected}
        toggleInboxParentCollapse={props.toggleInboxParentCollapse}
        visibleIssueColumnSet={props.visibleIssueColumnSet}
        visibleTrailingIssueColumns={props.visibleTrailingIssueColumns}
        workspaceGrouping={props.workspaceGrouping}
      />
    );

    return (
      <div key={`sel-issue:${issue.id}`} data-inbox-item className="relative" onClick={() => props.setSelectedIndex(navIdx)}>
        {allowArchive ? (
          <SwipeToArchive
            selected={selected}
            disabled={props.archivingIssueIds.has(issue.id) || props.archiveIssuePending}
            onArchive={() => props.archiveIssue(issue.id)}
          >
            {issueRow}
          </SwipeToArchive>
        ) : issueRow}
      </div>
    );
  };

  let previousTimestamp = Number.POSITIVE_INFINITY;

  return (
    <>
      {props.showSeparator ? <Separator /> : null}
      <div>
        <div ref={props.listRef} className="overflow-hidden rounded-xl">
          {props.groupedSections.flatMap((group, groupIndex) => {
            const elements: ReactNode[] = [];
            const isGroupCollapsed = props.collapsedGroupKeys.has(group.key);
            if (group.searchSection !== "none" && group.searchSection !== props.groupedSections[groupIndex - 1]?.searchSection) {
              elements.push(<SearchDivider key={`${group.searchSection}-search-divider`} label={group.searchSection === "archived" ? "Archived" : "Other results"} />);
            }
            if (group.label) {
              const groupNavIdx = props.groupFlatIndex.get(group.key) ?? -1;
              const isGroupSelected = groupNavIdx >= 0 && props.selectedIndex === groupNavIdx;
              elements.push(
                <div
                  key={`group-${group.key}`}
                  data-inbox-item
                  className={cn("px-3 sm:px-4", groupIndex > 0 && "pt-2", isGroupSelected && "bg-accent/50")}
                  onClick={() => {
                    if (groupNavIdx >= 0) props.setSelectedIndex(groupNavIdx);
                  }}
                >
                  <IssueGroupHeader label={group.label} collapsible collapsed={isGroupCollapsed} onToggle={() => props.toggleGroupCollapse(group.key)} />
                </div>,
              );
            }
            if (isGroupCollapsed) return elements;

            for (let index = 0; index < group.displayItems.length; index += 1) {
              elements.push(...renderWorkItem(group, group.displayItems[index]!, index));
            }
            return elements;
          })}
        </div>
      </div>
    </>
  );

  function renderWorkItem(group: InboxGroupedSection, item: InboxWorkItem, index: number): ReactNode[] {
    const navIdx = props.topFlatIndex.get(`${group.key}:${getInboxWorkItemKey(item)}`) ?? 0;
    const selected = props.selectedIndex === navIdx;
    const elements: ReactNode[] = [];
    const todayCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const showTodayDivider = props.groupBy === "none" && item.timestamp > 0 && item.timestamp < todayCutoff && previousTimestamp >= todayCutoff;
    previousTimestamp = item.timestamp > 0 ? item.timestamp : previousTimestamp;
    if (showTodayDivider) elements.push(<SearchDivider key={`today-divider-${group.key}-${index}`} label="Earlier" muted />);

    if (item.kind === "approval") {
      const key = `approval:${item.approval.id}`;
      const row = (
        <ApprovalInboxRow
          approval={item.approval}
          selected={selected}
          requesterName={props.agentName(item.approval.requestedByAgentId)}
          onApprove={() => props.onApprove(item.approval.id)}
          onReject={() => props.onReject(item.approval.id)}
          isPending={props.decisionPending}
          unreadState={props.nonIssueUnreadState(key)}
          onMarkRead={() => props.markNonIssueRead(key)}
          onArchive={props.canArchiveFromTab ? () => props.archiveNonIssue(key) : undefined}
          archiveDisabled={props.archivingNonIssueIds.has(key)}
          className={archiveClass(props.archivingNonIssueIds.has(key))}
        />
      );
      return [...elements, wrapNonIssue(key, navIdx, selected, row)];
    }

    if (item.kind === "failed_run") {
      const key = `run:${item.run.id}`;
      const row = (
        <FailedRunInboxRow
          run={item.run}
          selected={selected}
          issueById={props.issueById}
          agentName={props.agentName(item.run.agentId)}
          issueLinkState={props.issueLinkState}
          onDismiss={() => props.onDismissRun(key)}
          onRetry={() => props.onRetryRun(item.run)}
          isRetrying={props.retryingRunIds.has(item.run.id)}
          unreadState={props.nonIssueUnreadState(key)}
          onMarkRead={() => props.markNonIssueRead(key)}
          onArchive={props.canArchiveFromTab ? () => props.archiveNonIssue(key) : undefined}
          archiveDisabled={props.archivingNonIssueIds.has(key)}
          className={archiveClass(props.archivingNonIssueIds.has(key))}
        />
      );
      return [...elements, wrapNonIssue(key, navIdx, selected, row)];
    }

    if (item.kind === "join_request") {
      const key = `join:${item.joinRequest.id}`;
      const row = (
        <JoinRequestInboxRow
          joinRequest={item.joinRequest}
          onApprove={() => props.onApproveJoinRequest(item.joinRequest)}
          onReject={() => props.onRejectJoinRequest(item.joinRequest)}
          isPending={props.joinDecisionPending}
          unreadState={props.nonIssueUnreadState(key)}
          onMarkRead={() => props.markNonIssueRead(key)}
          onArchive={props.canArchiveFromTab ? () => props.archiveNonIssue(key) : undefined}
          archiveDisabled={props.archivingNonIssueIds.has(key)}
          className={archiveClass(props.archivingNonIssueIds.has(key))}
        />
      );
      return [...elements, wrapNonIssue(key, navIdx, selected, row)];
    }

    const children = group.childrenByIssueId.get(item.issue.id) ?? [];
    const row = wrapIssueRow(group, item.issue, 0, selected, navIdx, children);
    return children.length > 0 && !props.collapsedInboxParents.has(item.issue.id)
      ? [...elements, row, ...children.flatMap((child) => renderIssueTree(group, child, 1, new Set([item.issue.id])))]
      : [...elements, row];
  }

  function wrapNonIssue(key: string, navIdx: number, selected: boolean, child: ReactNode) {
    const isArchiving = props.archivingNonIssueIds.has(key);
    const content = props.canArchiveFromTab ? renderWithSwipe(key, selected, isArchiving, child) : child;
    return (
      <div key={`sel-${key}`} data-inbox-item className="relative" onClick={() => props.setSelectedIndex(navIdx)}>
        {content}
      </div>
    );
  }
}

function SearchDivider({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={muted ? "my-2 flex items-center gap-3 px-4" : "flex items-center gap-3 border-y border-border/70 bg-muted/30 px-4 py-2"}>
      <div className={muted ? "flex-1 border-t border-zinc-600" : "h-px flex-1 bg-border/80"} />
      <span className={muted ? "shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500" : "shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground"}>
        {label}
      </span>
      <div className={muted ? "flex-1 border-t border-zinc-600" : "h-px flex-1 bg-border/80"} />
    </div>
  );
}

function archiveClass(isArchiving: boolean) {
  return isArchiving
    ? "pointer-events-none -translate-x-4 scale-[0.98] opacity-0 transition-all duration-200 ease-out"
    : "transition-all duration-200 ease-out";
}
