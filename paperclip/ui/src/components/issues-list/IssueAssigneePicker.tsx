import type { Issue } from "@paperclipai/shared";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "../../lib/utils";
import { Identity } from "../Identity";
import type { Agent } from "./types";

export function IssueAssigneePicker({
  issue,
  agents,
  currentUserId,
  assigneeUserLabel,
  assigneeUserAvatarUrl,
  assigneePickerIssueId,
  setAssigneePickerIssueId,
  assigneeSearch,
  setAssigneeSearch,
  assignIssue,
  agentName,
}: {
  issue: Issue;
  agents?: Agent[];
  currentUserId: string | null;
  assigneeUserLabel: string | null;
  assigneeUserAvatarUrl: string | null;
  assigneePickerIssueId: string | null;
  setAssigneePickerIssueId: (issueId: string | null) => void;
  assigneeSearch: string;
  setAssigneeSearch: (search: string) => void;
  assignIssue: (issueId: string, assigneeAgentId: string | null, assigneeUserId?: string | null) => void;
  agentName: (id: string | null) => string | null;
}) {
  return (
    <Popover
      open={assigneePickerIssueId === issue.id}
      onOpenChange={(open) => {
        setAssigneePickerIssueId(open ? issue.id : null);
        if (!open) setAssigneeSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto w-full shrink-0 justify-start overflow-hidden rounded-md px-2 py-1"
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
        >
          {issue.assigneeAgentId && agentName(issue.assigneeAgentId) ? (
            <Identity name={agentName(issue.assigneeAgentId)!} size="sm" className="min-w-0" />
          ) : issue.assigneeUserId ? (
            <Identity
              name={assigneeUserLabel ?? "User"}
              avatarUrl={assigneeUserAvatarUrl}
              size="sm"
              className="min-w-0"
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/35 bg-muted/30">
                <User className="h-3.5 w-3.5" />
              </span>
              Assignee
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1"
        align="end"
        onClick={(event) => event.stopPropagation()}
        onPointerDownOutside={() => setAssigneeSearch("")}
      >
        <Input
          className="mb-1 h-auto rounded-sm border-0 border-b border-border bg-transparent px-2 py-1.5 text-xs shadow-none focus-visible:ring-0"
          placeholder="Search assignees..."
          value={assigneeSearch}
          onChange={(event) => setAssigneeSearch(event.target.value)}
          autoFocus
        />
        <div className="max-h-48 overflow-y-auto overscroll-contain">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto w-full justify-start gap-2 rounded px-2 py-1.5 text-xs",
              !issue.assigneeAgentId && !issue.assigneeUserId && "bg-accent",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              assignIssue(issue.id, null, null);
            }}
          >
            No assignee
          </Button>
          {currentUserId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto w-full justify-start gap-2 rounded px-2 py-1.5 text-left text-xs",
                issue.assigneeUserId === currentUserId && "bg-accent",
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                assignIssue(issue.id, null, currentUserId);
              }}
            >
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Me</span>
            </Button>
          )}
          {(agents ?? [])
            .filter((agent) => {
              if (!assigneeSearch.trim()) return true;
              return agent.name.toLowerCase().includes(assigneeSearch.toLowerCase());
            })
            .map((agent) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                key={agent.id}
                className={cn(
                  "h-auto w-full justify-start gap-2 rounded px-2 py-1.5 text-left text-xs",
                  issue.assigneeAgentId === agent.id && "bg-accent",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  assignIssue(issue.id, agent.id, null);
                }}
              >
                <Identity name={agent.name} size="sm" className="min-w-0" />
              </Button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
