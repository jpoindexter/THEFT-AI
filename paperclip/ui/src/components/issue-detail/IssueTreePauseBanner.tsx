import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { createIssueDetailPath } from "@/lib/issueDetailBreadcrumb";
import { relativeTime } from "@/lib/utils";

export type ActiveIssueTreePauseHold = {
  isRoot: boolean;
  rootIssueId: string;
};

type IssueTreePauseBannerProps = {
  activePauseHold: ActiveIssueTreePauseHold | null;
  childIssueCount: number;
  heldDescendantCount: number;
  activeRootPauseHoldCreatedAt?: Date | string | null;
  activePauseHoldRootIdentifier?: string | null;
  canShowSubtreeControls: boolean;
  canResumeLeafWork: boolean;
  onResume: () => void;
  onViewAffected: () => void;
  onCancelSubtree: () => void;
};

export function IssueTreePauseBanner({
  activePauseHold,
  childIssueCount,
  heldDescendantCount,
  activeRootPauseHoldCreatedAt,
  activePauseHoldRootIdentifier,
  canShowSubtreeControls,
  canResumeLeafWork,
  onResume,
  onViewAffected,
  onCancelSubtree,
}: IssueTreePauseBannerProps) {
  if (!activePauseHold) return null;

  if (!activePauseHold.isRoot) {
    return (
      <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
        <div className="text-xs">
          This issue is paused by ancestor{" "}
          {activePauseHoldRootIdentifier ? (
            <Link to={createIssueDetailPath(activePauseHoldRootIdentifier)} className="underline">
              {activePauseHoldRootIdentifier}
            </Link>
          ) : (
            activePauseHold.rootIssueId.slice(0, 8)
          )}
          . Resume from the root issue to deliver deferred work.
        </div>
      </div>
    );
  }

  const isLeaf = childIssueCount === 0;
  const affectedCount = isLeaf ? 1 : heldDescendantCount;
  const startedCopy = activeRootPauseHoldCreatedAt
    ? ` · started ${relativeTime(activeRootPauseHoldCreatedAt)}`
    : "";

  return (
    <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {isLeaf ? "Paused by board." : "Subtree pause is active."}
          </span>
          <span className="text-xs text-amber-900/80 dark:text-amber-100/80">
            {isLeaf
              ? "Issue execution is held until resume. Human comments can still wake the assignee for triage."
              : "Root and descendant execution is held until resume. Human comments can still wake assignees for triage."}
          </span>
        </div>
        <div className="text-xs text-amber-900/80 dark:text-amber-100/80">
          {isLeaf
            ? "1 issue held"
            : `${heldDescendantCount} descendant${heldDescendantCount === 1 ? "" : "s"} held`}
          {startedCopy}
        </div>
        {canShowSubtreeControls || canResumeLeafWork ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onResume}>
              {isLeaf ? "Resume work" : "Resume subtree"}
            </Button>
            <Button variant="outline" size="sm" onClick={onViewAffected}>
              View affected ({affectedCount})
            </Button>
            {canShowSubtreeControls ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onCancelSubtree}
              >
                Cancel subtree...
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
