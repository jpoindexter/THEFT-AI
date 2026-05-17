import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { IssueGroupHeader } from "../IssueGroupHeader";
import { IssueGroupRows } from "./IssueGroupRows";
import type { IssuesListRowsProps } from "./IssuesListRows.types";

export function IssuesListRows({
  groups,
  rowLimit,
  viewState,
  updateView,
  openCreateIssueDialog,
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
}: IssuesListRowsProps) {
  let remainingRowsToRender = rowLimit;

  return (
    <>
      {groups.map((group) => {
        if (remainingRowsToRender <= 0) return null;
        return (
          <Collapsible
            key={group.key}
            open={!viewState.collapsedGroups.includes(group.key)}
            onOpenChange={(open) => {
              updateView({
                collapsedGroups: open
                  ? viewState.collapsedGroups.filter((key) => key !== group.key)
                  : [...viewState.collapsedGroups, group.key],
              });
            }}
          >
            {group.label && (
              <IssueGroupHeader
                label={group.label}
                collapsible
                collapsed={viewState.collapsedGroups.includes(group.key)}
                onToggle={() => {
                  updateView({
                    collapsedGroups: viewState.collapsedGroups.includes(group.key)
                      ? viewState.collapsedGroups.filter((key) => key !== group.key)
                      : [...viewState.collapsedGroups, group.key],
                  });
                }}
                trailing={(
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    onClick={() => openCreateIssueDialog(group.key)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              />
            )}
            <CollapsibleContent>
              <IssueGroupRows
                issues={group.items}
                getRemainingRowsToRender={() => remainingRowsToRender}
                decrementRemainingRowsToRender={() => {
                  remainingRowsToRender -= 1;
                }}
                viewState={viewState}
                updateView={updateView}
                issueLinkState={issueLinkState}
                agents={agents}
                liveIssueIds={liveIssueIds}
                mutedIssueIds={mutedIssueIds}
                issueBadgeById={issueBadgeById}
                issueById={issueById}
                projectById={projectById}
                projectWorkspaceById={projectWorkspaceById}
                executionWorkspaceById={executionWorkspaceById}
                defaultProjectWorkspaceIdByProjectId={defaultProjectWorkspaceIdByProjectId}
                issueFilterWorkspaceContext={issueFilterWorkspaceContext}
                companyUserProfileMap={companyUserProfileMap}
                companyUserLabelMap={companyUserLabelMap}
                currentUserId={currentUserId}
                visibleIssueColumnSet={visibleIssueColumnSet}
                availableIssueColumnSet={availableIssueColumnSet}
                visibleTrailingIssueColumns={visibleTrailingIssueColumns}
                workflowChecklistMeta={workflowChecklistMeta}
                assigneePickerIssueId={assigneePickerIssueId}
                setAssigneePickerIssueId={setAssigneePickerIssueId}
                assigneeSearch={assigneeSearch}
                setAssigneeSearch={setAssigneeSearch}
                assignIssue={assignIssue}
                agentName={agentName}
                filterToWorkspace={filterToWorkspace}
                onUpdateIssue={onUpdateIssue}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </>
  );
}
