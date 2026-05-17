import {
  EyeOff,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Repeat,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type IssueDetailMoreActionsMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canPauseLeafWork: boolean;
  canResumeLeafWork: boolean;
  canShowSubtreeControls: boolean;
  canResumeSubtree: boolean;
  canRestoreSubtree: boolean;
  onPauseLeafWork: () => void;
  onResumeLeafWork: () => void;
  onPauseSubtree: () => void;
  onResumeSubtree: () => void;
  onCancelSubtree: () => void;
  onRestoreSubtree: () => void;
  onHideIssue: () => void;
};

export function IssueDetailMoreActionsMenu({
  open,
  onOpenChange,
  canPauseLeafWork,
  canResumeLeafWork,
  canShowSubtreeControls,
  canResumeSubtree,
  canRestoreSubtree,
  onPauseLeafWork,
  onResumeLeafWork,
  onPauseSubtree,
  onResumeSubtree,
  onCancelSubtree,
  onRestoreSubtree,
  onHideIssue,
}: IssueDetailMoreActionsMenuProps) {
  const runAndClose = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          aria-label="More issue actions"
          title="More issue actions"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenChange(true);
            }
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="end">
        {canPauseLeafWork ? (
          <Button
            variant="ghost"
            size="xs"
            className="w-full justify-start"
            onClick={() => runAndClose(onPauseLeafWork)}
          >
            <PauseCircle className="h-3 w-3" />
            Pause work...
          </Button>
        ) : null}
        {canResumeLeafWork ? (
          <Button
            variant="ghost"
            size="xs"
            className="w-full justify-start"
            onClick={() => runAndClose(onResumeLeafWork)}
          >
            <PlayCircle className="h-3 w-3" />
            Resume work
          </Button>
        ) : null}
        {canShowSubtreeControls ? (
          <>
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-start"
              onClick={() => runAndClose(onPauseSubtree)}
            >
              <PauseCircle className="h-3 w-3" />
              Pause subtree...
            </Button>
            {canResumeSubtree ? (
              <Button
                variant="ghost"
                size="xs"
                className="w-full justify-start"
                onClick={() => runAndClose(onResumeSubtree)}
              >
                <PlayCircle className="h-3 w-3" />
                Resume subtree
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => runAndClose(onCancelSubtree)}
            >
              <XCircle className="h-3 w-3" />
              Cancel subtree...
            </Button>
            {canRestoreSubtree ? (
              <Button
                variant="ghost"
                size="xs"
                className="w-full justify-start"
                onClick={() => runAndClose(onRestoreSubtree)}
              >
                <Repeat className="h-3 w-3" />
                Restore subtree...
              </Button>
            ) : null}
          </>
        ) : null}
        <Button
          variant="ghost"
          size="xs"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => runAndClose(onHideIssue)}
        >
          <EyeOff className="h-3 w-3" />
          Hide this task
        </Button>
      </PopoverContent>
    </Popover>
  );
}
