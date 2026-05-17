import { useMemo, useState } from "react";
import type { Agent, Issue } from "@paperclipai/shared";
import type { CompanyUserDirectoryResponse } from "../../api/access";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, User } from "lucide-react";
import { Identity } from "../Identity";
import { AgentIcon } from "../AgentIconPicker";
import { buildCompanyUserInlineOptions, buildCompanyUserLabelMap } from "../../lib/company-members";
import { orderItemsBySelectedAndRecent } from "../../lib/recent-selections";
import {
  getRecentAssigneeIds,
  getRecentAssigneeSelectionIds,
  sortAgentsByRecency,
  trackRecentAssignee,
  trackRecentAssigneeUser,
} from "../../lib/recent-assignees";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import { cn } from "../../lib/utils";
import { PropertyPicker } from "./PropertyLayout";

interface AssigneePropertyProps {
  issue: Issue;
  agents: Agent[] | undefined;
  companyMembers: CompanyUserDirectoryResponse | undefined;
  currentUserId: string | null | undefined;
  inline?: boolean;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function AssigneeProperty({
  issue,
  agents,
  companyMembers,
  currentUserId,
  inline,
  onUpdate,
}: AssigneePropertyProps) {
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const recentAssigneeIds = useMemo(() => getRecentAssigneeIds(), [assigneeOpen]);
  const recentAssigneeSelectionIds = useMemo(() => getRecentAssigneeSelectionIds(), [assigneeOpen]);
  const sortedAgents = useMemo(
    () => sortAgentsByRecency((agents ?? []).filter((a) => a.status !== "terminated"), recentAssigneeIds),
    [agents, recentAssigneeIds],
  );
  const userLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const otherUserOptions = useMemo(
    () => buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId, issue.createdByUserId] }),
    [companyMembers?.users, currentUserId, issue.createdByUserId],
  );

  const userLabel = (userId: string | null | undefined) => formatAssigneeUserLabel(userId, currentUserId, userLabelMap);
  const assigneeUserLabel = userLabel(issue.assigneeUserId);
  const creatorUserLabel = userLabel(issue.createdByUserId);
  const assignee = issue.assigneeAgentId
    ? agents?.find((a) => a.id === issue.assigneeAgentId)
    : null;
  const selectedAssigneeValue = issue.assigneeAgentId
    ? `agent:${issue.assigneeAgentId}`
    : issue.assigneeUserId
      ? `user:${issue.assigneeUserId}`
      : "";

  const assigneeTrigger = assignee ? (
    <Identity name={assignee.name} size="sm" />
  ) : assigneeUserLabel ? (
    <>
      <User className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm">{assigneeUserLabel}</span>
    </>
  ) : (
    <>
      <User className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Unassigned</span>
    </>
  );

  const assigneePickerOptions = orderItemsBySelectedAndRecent(
    [
      { id: "", kind: "none" as const, label: "No assignee", searchText: "" },
      ...(currentUserId
        ? [{
            id: `user:${currentUserId}`,
            kind: "user" as const,
            userId: currentUserId,
            label: "Assign to me",
            searchText: userLabel(currentUserId) ?? "",
          }]
        : []),
      ...(issue.createdByUserId && issue.createdByUserId !== currentUserId
        ? [{
            id: `user:${issue.createdByUserId}`,
            kind: "user" as const,
            userId: issue.createdByUserId,
            label: creatorUserLabel ? `Assign to ${creatorUserLabel}` : "Assign to requester",
            searchText: creatorUserLabel ?? "requester",
          }]
        : []),
      ...otherUserOptions.map((option) => ({
        id: option.id,
        kind: "user" as const,
        userId: option.id.slice("user:".length),
        label: option.label,
        searchText: option.searchText ?? "",
      })),
      ...sortedAgents.map((agent) => ({
        id: `agent:${agent.id}`,
        kind: "agent" as const,
        agent,
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    ],
    selectedAssigneeValue,
    recentAssigneeSelectionIds,
  );

  return (
    <PropertyPicker
      inline={inline}
      label="Assignee"
      open={assigneeOpen}
      onOpenChange={(open) => { setAssigneeOpen(open); if (!open) setAssigneeSearch(""); }}
      triggerContent={assigneeTrigger}
      popoverClassName="w-52"
      extra={issue.assigneeAgentId ? (
        <Link
          to={`/agents/${issue.assigneeAgentId}`}
          className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      ) : undefined}
    >
      <Input
        className="mb-1 h-8 px-2 py-1.5 text-xs shadow-none md:text-xs"
        placeholder="Search assignees..."
        value={assigneeSearch}
        onChange={(e) => setAssigneeSearch(e.target.value)}
        autoFocus={!inline}
      />
      <div className="max-h-48 overflow-y-auto overscroll-contain">
        {assigneePickerOptions
          .filter((option) => {
            if (!assigneeSearch.trim()) return true;
            const q = assigneeSearch.toLowerCase();
            return `${option.label} ${option.searchText}`.toLowerCase().includes(q);
          })
          .map((option) => (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              key={option.id || "__none__"}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
                option.id === selectedAssigneeValue && "bg-accent",
              )}
              onClick={() => {
                if (option.kind === "agent") {
                  trackRecentAssignee(option.agent.id);
                  onUpdate({ assigneeAgentId: option.agent.id, assigneeUserId: null });
                } else if (option.kind === "user") {
                  trackRecentAssigneeUser(option.userId);
                  onUpdate({ assigneeAgentId: null, assigneeUserId: option.userId });
                } else {
                  onUpdate({ assigneeAgentId: null, assigneeUserId: null });
                }
                setAssigneeOpen(false);
              }}
            >
              {option.kind === "agent" ? (
                <AgentIcon icon={option.agent.icon} className="shrink-0 h-3 w-3 text-muted-foreground" />
              ) : option.kind === "user" ? (
                <User className="h-3 w-3 shrink-0 text-muted-foreground" />
              ) : null}
              {option.label}
            </Button>
          ))}
      </div>
    </PropertyPicker>
  );
}
