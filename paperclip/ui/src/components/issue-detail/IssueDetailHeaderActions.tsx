import { Archive, Check, Copy, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IssueDetailMoreActionsMenu } from "./IssueDetailMoreActionsMenu";

export type IssueDetailHeaderActionsProps = {
  isMobileInbox: boolean;
  copied: boolean;
  panelVisible: boolean;
  canArchiveFromInbox: boolean;
  archivePending: boolean;
  moreOpen: boolean;
  canPauseLeafWork: boolean;
  canResumeLeafWork: boolean;
  canShowSubtreeControls: boolean;
  canResumeSubtree: boolean;
  canRestoreSubtree: boolean;
  onMoreOpenChange: (open: boolean) => void;
  onCopy: () => void;
  onOpenMobileProps: () => void;
  onShowPanel: () => void;
  onArchiveFromInbox: () => void;
  onPauseLeafWork: () => void;
  onResumeLeafWork: () => void;
  onPauseSubtree: () => void;
  onResumeSubtree: () => void;
  onCancelSubtree: () => void;
  onRestoreSubtree: () => void;
  onHideIssue: () => void;
};

export function IssueDetailHeaderActions({
  isMobileInbox,
  copied,
  panelVisible,
  canArchiveFromInbox,
  archivePending,
  moreOpen,
  canPauseLeafWork,
  canResumeLeafWork,
  canShowSubtreeControls,
  canResumeSubtree,
  canRestoreSubtree,
  onMoreOpenChange,
  onCopy,
  onOpenMobileProps,
  onShowPanel,
  onArchiveFromInbox,
  onPauseLeafWork,
  onResumeLeafWork,
  onPauseSubtree,
  onResumeSubtree,
  onCancelSubtree,
  onRestoreSubtree,
  onHideIssue,
}: IssueDetailHeaderActionsProps) {
  return (
    <>
      {!isMobileInbox ? (
        <div className="ml-auto flex shrink-0 items-center gap-0.5 md:hidden">
          <Button variant="ghost" size="icon-xs" onClick={onCopy} title="Copy issue as markdown">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onOpenMobileProps} title="Properties">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="hidden shrink-0 items-center md:ml-auto md:flex">
        {canArchiveFromInbox ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onArchiveFromInbox}
            disabled={archivePending}
            title="Archive from inbox"
            aria-label="Archive from inbox"
          >
            <Archive className="h-4 w-4" />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon-xs" onClick={onCopy} title="Copy issue as markdown">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "shrink-0 transition-opacity duration-200",
            panelVisible ? "w-0 overflow-hidden opacity-0 pointer-events-none" : "opacity-100",
          )}
          onClick={onShowPanel}
          title="Show properties"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        <IssueDetailMoreActionsMenu
          open={moreOpen}
          onOpenChange={onMoreOpenChange}
          canPauseLeafWork={canPauseLeafWork}
          canResumeLeafWork={canResumeLeafWork}
          canShowSubtreeControls={canShowSubtreeControls}
          canResumeSubtree={canResumeSubtree}
          canRestoreSubtree={canRestoreSubtree}
          onPauseLeafWork={onPauseLeafWork}
          onResumeLeafWork={onResumeLeafWork}
          onPauseSubtree={onPauseSubtree}
          onResumeSubtree={onResumeSubtree}
          onCancelSubtree={onCancelSubtree}
          onRestoreSubtree={onRestoreSubtree}
          onHideIssue={onHideIssue}
        />
      </div>
    </>
  );
}
