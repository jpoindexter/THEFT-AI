import { Plus } from "lucide-react";
import type { Issue } from "@paperclipai/shared";

import { Button } from "@/components/ui/button";
import { IssuesList } from "@/components/IssuesList";
import type { IssuesListProps } from "@/components/issues-list/types";
import { buildSubIssueDefaultsForViewer } from "@/lib/subIssueDefaults";

type IssueDetailSubIssuesSectionProps = {
  issue: Issue;
  childIssues: Issue[];
  childIssuesLoading: boolean;
  agents: IssuesListProps["agents"];
  projects: IssuesListProps["projects"];
  liveIssueIds: Set<string>;
  mutedChildIssueIds: Set<string>;
  childPauseBadgeById: Map<string, string>;
  issueLinkState: unknown;
  currentUserId: string | null;
  showRichSubIssuesSection: boolean;
  onCreateSubIssue: () => void;
  onUpdateIssue: IssuesListProps["onUpdateIssue"];
};

export function IssueDetailSubIssuesSection({
  issue,
  childIssues,
  childIssuesLoading,
  agents,
  projects,
  liveIssueIds,
  mutedChildIssueIds,
  childPauseBadgeById,
  issueLinkState,
  currentUserId,
  showRichSubIssuesSection,
  onCreateSubIssue,
  onUpdateIssue,
}: IssueDetailSubIssuesSectionProps) {
  if (!showRichSubIssuesSection) {
    return (
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCreateSubIssue} className="shrink-0 shadow-none">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New subtask
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
      </div>
      <IssuesList
        issues={childIssues}
        isLoading={childIssuesLoading}
        agents={agents}
        projects={projects}
        liveIssueIds={liveIssueIds}
        mutedIssueIds={mutedChildIssueIds}
        issueBadgeById={childPauseBadgeById}
        projectId={issue.projectId ?? undefined}
        viewStateKey={`paperclip:issue-detail:${issue.id}:subissues-view`}
        issueLinkState={issueLinkState}
        searchFilters={{ descendantOf: issue.id, includeBlockedBy: true }}
        searchWithinLoadedIssues
        baseCreateIssueDefaults={buildSubIssueDefaultsForViewer(issue, currentUserId)}
        createIssueLabel="Subtask"
        defaultSortField="workflow"
        showProgressSummary
        parentIssueIdForCostSummary={issue.id}
        onUpdateIssue={onUpdateIssue}
      />
    </div>
  );
}
