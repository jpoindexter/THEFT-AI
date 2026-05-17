import type { IssueWorkMode } from "@paperclipai/shared";
import { useState, type Dispatch, type SetStateAction } from "react";
import { ClipboardList, Hammer, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function IssueChatComposerWorkModeControls({
  pendingWorkMode,
  setPendingWorkMode,
}: {
  pendingWorkMode: IssueWorkMode;
  setPendingWorkMode: Dispatch<SetStateAction<IssueWorkMode>>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPlanning = pendingWorkMode === "planning";

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            data-testid="issue-chat-composer-work-mode-menu"
            title="More composer options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          <Button
            type="button"
            data-testid="issue-chat-composer-work-mode-menu-toggle"
            data-pending-work-mode={pendingWorkMode}
            variant="ghost"
            size="xs"
            className={cn(
              "h-auto w-full justify-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent/50",
              isPlanning ? "text-amber-700 dark:text-amber-300" : "text-foreground",
            )}
            onClick={() => {
              setPendingWorkMode((prev) => (prev === "planning" ? "standard" : "planning"));
              setMenuOpen(false);
            }}
          >
            {isPlanning ? (
              <Hammer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
            )}
            <span>{isPlanning ? "Switch to standard" : "Switch to planning"}</span>
          </Button>
        </PopoverContent>
      </Popover>

      {isPlanning ? (
        <Button
          type="button"
          data-testid="issue-chat-composer-work-mode-toggle"
          data-pending-work-mode={pendingWorkMode}
          aria-pressed
          title="Planning mode is on for this submission. Click to switch to Standard."
          onClick={() => setPendingWorkMode("standard")}
          variant="outline"
          size="xs"
          className="border-amber-500/60 bg-amber-500/15 text-xs text-amber-800 hover:bg-amber-500/25 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          <span>Planning</span>
        </Button>
      ) : null}
    </>
  );
}
