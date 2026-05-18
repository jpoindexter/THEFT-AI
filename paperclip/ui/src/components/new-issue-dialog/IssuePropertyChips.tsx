import type { ChangeEvent, RefObject } from "react";
import type { IssueWorkMode } from "@paperclipai/shared";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CircleDot,
  ClipboardList,
  Hammer,
  Minus,
  MoreHorizontal,
  Paperclip,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "../../lib/utils";
import { issueStatusText, issueStatusTextDefault, priorityColor, priorityColorDefault } from "../../lib/status-colors";

const STAGED_FILE_ACCEPT = "image/*,application/pdf,text/plain,text/markdown,application/json,text/csv,text/html,.md,.markdown";

const ISSUE_WORK_MODE_OPTIONS: ReadonlyArray<{
  value: IssueWorkMode;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "standard", label: "Standard", icon: Hammer },
  { value: "planning", label: "Planning", icon: ClipboardList },
];

const statuses = [
  { value: "backlog", label: "Backlog", color: issueStatusText.backlog ?? issueStatusTextDefault },
  { value: "todo", label: "Todo", color: issueStatusText.todo ?? issueStatusTextDefault },
  { value: "in_progress", label: "In Progress", color: issueStatusText.in_progress ?? issueStatusTextDefault },
  { value: "in_review", label: "In Review", color: issueStatusText.in_review ?? issueStatusTextDefault },
  { value: "done", label: "Done", color: issueStatusText.done ?? issueStatusTextDefault },
];

const priorities = [
  { value: "critical", label: "Critical", icon: AlertTriangle, color: priorityColor.critical ?? priorityColorDefault },
  { value: "high", label: "High", icon: ArrowUp, color: priorityColor.high ?? priorityColorDefault },
  { value: "medium", label: "Medium", icon: Minus, color: priorityColor.medium ?? priorityColorDefault },
  { value: "low", label: "Low", icon: ArrowDown, color: priorityColor.low ?? priorityColorDefault },
];

type IssuePropertyChipsProps = {
  status: string;
  statusOpen: boolean;
  priority: string;
  priorityOpen: boolean;
  stageFileInputRef: RefObject<HTMLInputElement | null>;
  uploadDisabled: boolean;
  workMode: IssueWorkMode;
  workModeOpen: boolean;
  moreOpen: boolean;
  onStatusChange: (status: string) => void;
  onStatusOpenChange: (open: boolean) => void;
  onPriorityChange: (priority: string) => void;
  onPriorityOpenChange: (open: boolean) => void;
  onStageFilesPicked: (event: ChangeEvent<HTMLInputElement>) => void;
  onWorkModeChange: (workMode: IssueWorkMode) => void;
  onWorkModeOpenChange: (open: boolean) => void;
  onMoreOpenChange: (open: boolean) => void;
};

export function IssuePropertyChips({
  status,
  statusOpen,
  priority,
  priorityOpen,
  stageFileInputRef,
  uploadDisabled,
  workMode,
  workModeOpen,
  moreOpen,
  onStatusChange,
  onStatusOpenChange,
  onPriorityChange,
  onPriorityOpenChange,
  onStageFilesPicked,
  onWorkModeChange,
  onWorkModeOpenChange,
  onMoreOpenChange,
}: IssuePropertyChipsProps) {
  const currentStatus = statuses.find((s) => s.value === status) ?? statuses[1]!;
  const currentPriority = priorities.find((p) => p.value === priority);
  const currentWorkMode = ISSUE_WORK_MODE_OPTIONS[workMode === "planning" ? 1 : 0]!;
  const CurrentWorkModeIcon = currentWorkMode.icon;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border flex-wrap shrink-0">
      <Popover open={statusOpen} onOpenChange={onStatusOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="xs" className="font-normal hover:bg-accent/50">
            <CircleDot className={cn("h-3 w-3", currentStatus.color)} />
            {currentStatus.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {statuses.map((s) => (
            <Button
              key={s.value}
              variant="ghost"
              size="xs"
              className={cn(
                "w-full justify-start font-normal hover:bg-accent/50",
                s.value === status && "bg-accent"
              )}
              onClick={() => { onStatusChange(s.value); onStatusOpenChange(false); }}
            >
              <CircleDot className={cn("h-3 w-3", s.color)} />
              {s.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      <Popover open={priorityOpen} onOpenChange={onPriorityOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="xs" className="font-normal hover:bg-accent/50">
            {currentPriority ? (
              <>
                <currentPriority.icon className={cn("h-3 w-3", currentPriority.color)} />
                {currentPriority.label}
              </>
            ) : (
              <>
                <Minus className="h-3 w-3 text-muted-foreground" />
                Priority
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {priorities.map((p) => (
            <Button
              key={p.value}
              variant="ghost"
              size="xs"
              className={cn(
                "w-full justify-start font-normal hover:bg-accent/50",
                p.value === priority && "bg-accent"
              )}
              onClick={() => { onPriorityChange(p.value); onPriorityOpenChange(false); }}
            >
              <p.icon className={cn("h-3 w-3", p.color)} />
              {p.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      <Input
        ref={stageFileInputRef}
        type="file"
        accept={STAGED_FILE_ACCEPT}
        className="hidden"
        onChange={onStageFilesPicked}
        multiple
      />
      <Button
        variant="outline"
        size="xs"
        className="font-normal text-muted-foreground hover:bg-accent/50"
        onClick={() => stageFileInputRef.current?.click()}
        disabled={uploadDisabled}
      >
        <Paperclip className="h-3 w-3" />
        Upload
      </Button>

      <Popover open={workModeOpen} onOpenChange={onWorkModeOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="xs"
            data-issue-work-mode-chip={workMode}
            className={cn(
              "font-normal",
              workMode === "planning"
                ? "border-amber-500/60 bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
                : "border-border text-muted-foreground hover:bg-accent/50",
            )}
          >
            <CurrentWorkModeIcon className="h-3 w-3" />
            {currentWorkMode.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {ISSUE_WORK_MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                data-issue-work-mode={option.value}
                variant="ghost"
                size="xs"
                className={cn(
                  "w-full justify-start font-normal hover:bg-accent/50",
                  option.value === workMode && "bg-accent",
                  option.value === "planning" && "text-amber-700 dark:text-amber-300",
                )}
                onClick={() => {
                  onWorkModeChange(option.value);
                  onWorkModeOpenChange(false);
                }}
              >
                <Icon className="h-3 w-3" />
                {option.label}
              </Button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Popover open={moreOpen} onOpenChange={onMoreOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon-xs" className="text-muted-foreground hover:bg-accent/50">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          <Button variant="ghost" size="xs" className="w-full justify-start font-normal text-muted-foreground hover:bg-accent/50">
            <Calendar className="h-3 w-3" />
            Start date
          </Button>
          <Button variant="ghost" size="xs" className="w-full justify-start font-normal text-muted-foreground hover:bg-accent/50">
            <Calendar className="h-3 w-3" />
            Due date
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
