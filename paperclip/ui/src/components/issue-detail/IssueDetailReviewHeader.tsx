import { Link } from "@/lib/router";
import { ChevronRight, EyeOff } from "lucide-react";
import type { Agent, Issue } from "@paperclipai/shared";

import {
  createIssueDetailPath,
  rememberIssueDetailLocationState,
} from "@/lib/issueDetailBreadcrumb";
import {
  IssueTreePauseBanner,
  type ActiveIssueTreePauseHold,
} from "./IssueTreePauseBanner";
import { TaskReviewSummary } from "./TaskReviewSummary";

type IssueDetailReviewHeaderProps = {
  issue: Issue;
  ancestors: NonNullable<Issue["ancestors"]>;
  issueLinkState: unknown;
  locationSearch: string;
  activePauseHold: ActiveIssueTreePauseHold | null;
  childIssueCount: number;
  heldDescendantCount: number;
  activeRootPauseHoldCreatedAt?: Date | string | null;
  activePauseHoldRootIdentifier?: string | null;
  canShowSubtreeControls: boolean;
  canResumeLeafWork: boolean;
  owner: Agent | null;
  outputCount: number;
  outputTitles: string[];
  decisionCount: number;
  commentCount: number;
  hasLiveRuns: boolean;
  hasBlocker: boolean;
  approving: boolean;
  onStartExecution: () => void;
  onApprove: () => void;
  onAskRevision: () => void;
  onAskOperator: () => void;
  onOpenLibrary: () => void;
  onResume: () => void;
  onViewAffected: () => void;
  onCancelSubtree: () => void;
};

export function IssueDetailReviewHeader({
  issue,
  ancestors,
  issueLinkState,
  locationSearch,
  activePauseHold,
  childIssueCount,
  heldDescendantCount,
  activeRootPauseHoldCreatedAt,
  activePauseHoldRootIdentifier,
  canShowSubtreeControls,
  canResumeLeafWork,
  owner,
  outputCount,
  outputTitles,
  decisionCount,
  commentCount,
  hasLiveRuns,
  hasBlocker,
  approving,
  onStartExecution,
  onApprove,
  onAskRevision,
  onAskOperator,
  onOpenLibrary,
  onResume,
  onViewAffected,
  onCancelSubtree,
}: IssueDetailReviewHeaderProps) {
  return (
    <>
      {ancestors.length > 0 ? (
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {[...ancestors].reverse().map((ancestor, i) => {
            const issuePathId = ancestor.identifier ?? ancestor.id;
            return (
              <span key={ancestor.id} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="h-3 w-3 shrink-0" /> : null}
                <Link
                  to={createIssueDetailPath(issuePathId)}
                  state={issueLinkState}
                  onClickCapture={() => {
                    rememberIssueDetailLocationState(issuePathId, issueLinkState, locationSearch);
                  }}
                  className="max-w-48 truncate transition-colors hover:text-foreground"
                  title={ancestor.title}
                >
                  {ancestor.title}
                </Link>
              </span>
            );
          })}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="max-w-48 truncate text-foreground/60">{issue.title}</span>
        </nav>
      ) : null}

      {issue.hiddenAt ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <EyeOff className="h-4 w-4 shrink-0" />
          This issue is hidden
        </div>
      ) : null}

      <IssueTreePauseBanner
        activePauseHold={activePauseHold}
        childIssueCount={childIssueCount}
        heldDescendantCount={heldDescendantCount}
        activeRootPauseHoldCreatedAt={activeRootPauseHoldCreatedAt}
        activePauseHoldRootIdentifier={activePauseHoldRootIdentifier}
        canShowSubtreeControls={canShowSubtreeControls}
        canResumeLeafWork={canResumeLeafWork}
        onResume={onResume}
        onViewAffected={onViewAffected}
        onCancelSubtree={onCancelSubtree}
      />

      <TaskReviewSummary
        issue={issue}
        owner={owner}
        outputCount={outputCount}
        outputTitles={outputTitles}
        decisionCount={decisionCount}
        commentCount={commentCount}
        childTaskCount={childIssueCount}
        hasLiveRuns={hasLiveRuns}
        hasBlocker={hasBlocker}
        approving={approving}
        onStartExecution={onStartExecution}
        onApprove={onApprove}
        onAskRevision={onAskRevision}
        onAskOperator={onAskOperator}
        onOpenLibrary={onOpenLibrary}
      />
    </>
  );
}
