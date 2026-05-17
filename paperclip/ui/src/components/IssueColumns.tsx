import type { ReactNode } from "react";
import type { Issue } from "@paperclipai/shared";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InboxIssueColumn } from "../lib/inbox";
import { cn } from "../lib/utils";
import { timeAgo } from "../lib/timeAgo";
import { StatusIcon } from "./StatusIcon";
export { InboxIssueTrailingColumns } from "./issue-columns/InboxIssueTrailingColumns";

export const issueTrailingColumns: InboxIssueColumn[] = ["assignee", "project", "workspace", "parent", "labels", "updated"];

const issueColumnLabels: Record<InboxIssueColumn, string> = {
  status: "Status",
  id: "ID",
  assignee: "Assignee",
  project: "Project",
  workspace: "Workspace",
  parent: "Parent issue",
  labels: "Tags",
  updated: "Last updated",
};

const issueColumnDescriptions: Record<InboxIssueColumn, string> = {
  status: "Issue state chip on the left edge.",
  id: "Ticket identifier like PAP-1009.",
  assignee: "Assigned agent or board user.",
  project: "Linked project pill with its color.",
  workspace: "Execution or project workspace used for the issue.",
  parent: "Parent issue identifier and title.",
  labels: "Issue labels and tags.",
  updated: "Latest visible activity time.",
};

export function issueActivityText(issue: Issue): string {
  return `Updated ${timeAgo(issue.lastActivityAt ?? issue.lastExternalCommentAt ?? issue.updatedAt)}`;
}

export function IssueColumnPicker({
  availableColumns,
  visibleColumnSet,
  onToggleColumn,
  onResetColumns,
  title,
  iconOnly = false,
}: {
  availableColumns: InboxIssueColumn[];
  visibleColumnSet: ReadonlySet<InboxIssueColumn>;
  onToggleColumn: (column: InboxIssueColumn, enabled: boolean) => void;
  onResetColumns: () => void;
  title: string;
  iconOnly?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={iconOnly ? "outline" : "ghost"}
          size={iconOnly ? "icon" : "sm"}
          className={iconOnly ? "h-8 w-8 shrink-0" : "hidden h-8 shrink-0 px-2 text-xs sm:inline-flex"}
          title="Columns"
        >
          <Columns3 className={iconOnly ? "h-3.5 w-3.5" : "mr-1 h-3.5 w-3.5"} />
          {!iconOnly && "Columns"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 border-border/70 p-1.5">
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5">
          <div className="space-y-1">
            <div className="theft-label-compact">
              Desktop issue rows
            </div>
            <div className="text-sm font-medium text-foreground">
              {title}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column}
            checked={visibleColumnSet.has(column)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onToggleColumn(column, checked === true)}
            className="items-start rounded-lg px-3 py-2.5 pl-8"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {issueColumnLabels[column]}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {issueColumnDescriptions[column]}
              </span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onResetColumns}
          className="rounded-lg px-3 py-2 text-sm"
        >
          Reset defaults
          <span className="ml-auto text-xs text-muted-foreground">status, id, updated</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InboxIssueMetaLeading({
  issue,
  isLive,
  showStatus = true,
  showIdentifier = true,
  statusSlot,
  checklistStepNumber = null,
}: {
  issue: Issue;
  isLive: boolean;
  showStatus?: boolean;
  showIdentifier?: boolean;
  statusSlot?: ReactNode;
  checklistStepNumber?: number | string | null;
}) {
  return (
    <>
      {showStatus ? (
        <span className="hidden shrink-0 sm:inline-flex">
          {statusSlot ?? <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} />}
        </span>
      ) : null}
      {checklistStepNumber !== null ? (
        <span className="shrink-0 font-mono text-xs text-muted-foreground" aria-hidden="true">
          {checklistStepNumber}.
        </span>
      ) : null}
      {showIdentifier ? (
        <span className="min-w-0 max-w-40 truncate font-mono text-xs text-muted-foreground sm:max-w-none sm:shrink-0">
          {issue.identifier ?? issue.id.slice(0, 8)}
        </span>
      ) : null}
      {isLive && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 sm:gap-1.5 sm:px-2",
            "bg-muted",
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-foreground opacity-30" />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                "bg-foreground",
              )}
            />
          </span>
          <span
            className={cn(
              "hidden text-micro font-medium sm:inline",
              "text-foreground",
            )}
          >
            Live
          </span>
        </span>
      )}
    </>
  );
}
