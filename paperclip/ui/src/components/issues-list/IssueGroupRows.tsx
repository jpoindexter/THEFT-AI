import type { MouseEvent } from "react";
import type { Issue } from "@paperclipai/shared";
import { ChevronRight, CircleDot, CircleSlash2 } from "lucide-react";
import { TheftChip } from "@/components/theft";
import { Button } from "@/components/ui/button";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import { resolveIssueFilterWorkspaceId } from "../../lib/issue-filters";
import { buildIssueTree, countDescendants } from "../../lib/issue-tree";
import { resolveIssueWorkspaceName } from "../../lib/inbox";
import { isSuccessfulRunHandoffRequired } from "../../lib/successful-run-handoff";
import { statusBadge } from "../../lib/status-colors";
import { cn } from "../../lib/utils";
import {
  InboxIssueMetaLeading,
  InboxIssueTrailingColumns,
  issueActivityText,
} from "../IssueColumns";
import { IssueRow } from "../IssueRow";
import { StatusIcon } from "../StatusIcon";
import { ChecklistDependencyChip } from "./ChecklistDependencyChip";
import { issueDepthClass } from "./constants";
import { IssueAssigneePicker } from "./IssueAssigneePicker";
import type { IssuesListRowsProps } from "./IssuesListRows.types";

type IssueGroupRowsProps = Omit<IssuesListRowsProps, "groups" | "rowLimit" | "openCreateIssueDialog"> & {
  issues: Issue[];
  getRemainingRowsToRender: () => number;
  decrementRemainingRowsToRender: () => void;
};

export function IssueGroupRows({
  issues,
  getRemainingRowsToRender,
  decrementRemainingRowsToRender,
  viewState,
  updateView,
  issueLinkState,
  agents,
  liveIssueIds,
  mutedIssueIds,
  issueBadgeById,
  issueById,
  projectById,
  projectWorkspaceById,
  executionWorkspaceById,
  defaultProjectWorkspaceIdByProjectId,
  issueFilterWorkspaceContext,
  companyUserProfileMap,
  companyUserLabelMap,
  currentUserId,
  visibleIssueColumnSet,
  availableIssueColumnSet,
  visibleTrailingIssueColumns,
  workflowChecklistMeta,
  assigneePickerIssueId,
  setAssigneePickerIssueId,
  assigneeSearch,
  setAssigneeSearch,
  assignIssue,
  agentName,
  filterToWorkspace,
  onUpdateIssue,
}: IssueGroupRowsProps) {
  const { roots, childMap } = viewState.nestingEnabled
    ? buildIssueTree(issues)
    : { roots: issues, childMap: new Map<string, Issue[]>() };

  const renderIssueRow = (issue: Issue, depth: number) => {
    if (getRemainingRowsToRender() <= 0) return null;
    decrementRemainingRowsToRender();

    const children = childMap.get(issue.id) ?? [];
    const hasChildren = children.length > 0;
    const totalDescendants = hasChildren ? countDescendants(issue.id, childMap) : 0;
    const isExpanded = !viewState.collapsedParents.includes(issue.id);
    const useDeferredRowRendering = !(hasChildren && isExpanded);
    const issueProject = issue.projectId ? projectById.get(issue.projectId) ?? null : null;
    const parentIssue = issue.parentId ? issueById.get(issue.parentId) ?? null : null;
    const issueBadge = issueBadgeById?.get(issue.id);
    const isMutedIssue = mutedIssueIds?.has(issue.id) === true;
    const assigneeUserProfile = issue.assigneeUserId
      ? companyUserProfileMap.get(issue.assigneeUserId) ?? null
      : null;
    const assigneeUserLabel = formatAssigneeUserLabel(
      issue.assigneeUserId,
      currentUserId,
      companyUserLabelMap,
    ) ?? assigneeUserProfile?.label ?? null;
    const toggleCollapse = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      updateView({
        collapsedParents: isExpanded
          ? [...viewState.collapsedParents, issue.id]
          : viewState.collapsedParents.filter((id) => id !== issue.id),
      });
    };
    const checklistMeta = workflowChecklistMeta;
    const checklistStepNumber = checklistMeta?.stepNumberByIssueId.get(issue.id) ?? null;
    const unresolvedVisibleBlockers = checklistMeta?.unresolvedVisibleBlockersByIssueId.get(issue.id) ?? [];
    const checklistRowId = checklistMeta ? `issue-workflow-row-${issue.id}` : undefined;
    const doneRowTitleClass = checklistMeta && issue.status === "done"
      ? "text-muted-foreground"
      : undefined;

    return (
      <div
        key={issue.id}
        className={cn(issueDepthClass(depth), useDeferredRowRendering && "content-auto contain-intrinsic-size-11")}
      >
        <IssueRow
          issue={issue}
          issueLinkState={issueLinkState}
          checklistStepNumber={checklistStepNumber}
          checklistCurrentStep={checklistMeta?.currentStepIssueId === issue.id}
          checklistDependencyChips={(
            <ChecklistDependencyChip
              issueById={issueById}
              checklistMeta={checklistMeta}
              unresolvedVisibleBlockers={unresolvedVisibleBlockers}
            />
          )}
          checklistRowId={checklistRowId}
          titleClassName={doneRowTitleClass}
          titleSuffix={(
            <>
              {hasChildren && !isExpanded ? (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({totalDescendants} sub-task{totalDescendants !== 1 ? "s" : ""})
                </span>
              ) : null}
              {issueBadge ? (
                issueBadge === "Paused" ? (
                  <span
                    className={cn("ml-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-nano font-medium", statusBadge.paused)}
                    aria-label="Paused"
                    title="Paused"
                  >
                    <CircleSlash2 className="h-3 w-3" />
                    Paused
                  </span>
                ) : (
                  <TheftChip tone="warning" density="compact" className="ml-1.5">
                    {issueBadge}
                  </TheftChip>
                )
              ) : null}
              {isSuccessfulRunHandoffRequired(issue) ? (
                <TheftChip
                  tone="warning"
                  density="compact"
                  className="ml-1.5 inline-flex items-center gap-1"
                  aria-label="Needs next step"
                  title="This issue needs a next step"
                >
                  <CircleDot className="h-3 w-3" />
                  Needs next step
                </TheftChip>
              ) : null}
            </>
          )}
          className={isMutedIssue ? "opacity-70" : undefined}
          mobileLeading={
            hasChildren ? (
              <Button type="button" variant="ghost" size="icon-xs" className="h-5 w-5 p-0" onClick={toggleCollapse}>
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")} />
              </Button>
            ) : (
              <span onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}>
                <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} onChange={(status) => onUpdateIssue(issue.id, { status })} />
              </span>
            )
          }
          desktopMetaLeading={(
            <>
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="hidden h-5 w-5 shrink-0 p-0 sm:inline-flex"
                  onClick={toggleCollapse}
                >
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")} />
                </Button>
              ) : (
                <span className="hidden w-3.5 shrink-0 sm:block" />
              )}
              <InboxIssueMetaLeading
                issue={issue}
                isLive={liveIssueIds?.has(issue.id) === true}
                showStatus={visibleIssueColumnSet.has("status") && availableIssueColumnSet.has("status")}
                showIdentifier={visibleIssueColumnSet.has("id") && availableIssueColumnSet.has("id")}
                checklistStepNumber={checklistStepNumber}
                statusSlot={(
                  <span onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}>
                    <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} onChange={(status) => onUpdateIssue(issue.id, { status })} />
                  </span>
                )}
              />
            </>
          )}
          mobileMeta={issueActivityText(issue).toLowerCase()}
          desktopTrailing={(
            visibleTrailingIssueColumns.length > 0 ? (
              <InboxIssueTrailingColumns
                issue={issue}
                columns={visibleTrailingIssueColumns}
                projectName={issueProject?.name ?? null}
                projectColor={issueProject?.color ?? null}
                workspaceId={resolveIssueFilterWorkspaceId(issue, issueFilterWorkspaceContext)}
                workspaceName={resolveIssueWorkspaceName(issue, {
                  executionWorkspaceById,
                  projectWorkspaceById,
                  defaultProjectWorkspaceIdByProjectId,
                })}
                onFilterWorkspace={filterToWorkspace}
                assigneeName={agentName(issue.assigneeAgentId)}
                assigneeUserName={assigneeUserLabel}
                assigneeUserAvatarUrl={assigneeUserProfile?.image ?? null}
                currentUserId={currentUserId}
                parentIdentifier={parentIssue?.identifier ?? null}
                parentTitle={parentIssue?.title ?? null}
                assigneeContent={(
                  <IssueAssigneePicker
                    issue={issue}
                    agents={agents}
                    currentUserId={currentUserId}
                    assigneeUserLabel={assigneeUserLabel}
                    assigneeUserAvatarUrl={assigneeUserProfile?.image ?? null}
                    assigneePickerIssueId={assigneePickerIssueId}
                    setAssigneePickerIssueId={setAssigneePickerIssueId}
                    assigneeSearch={assigneeSearch}
                    setAssigneeSearch={setAssigneeSearch}
                    assignIssue={assignIssue}
                    agentName={agentName}
                  />
                )}
              />
            ) : undefined
          )}
        />
        {hasChildren && isExpanded && children.map((child) => renderIssueRow(child, depth + 1))}
      </div>
    );
  };

  return roots.map((issue) => renderIssueRow(issue, 0)).filter((node) => node !== null);
}
