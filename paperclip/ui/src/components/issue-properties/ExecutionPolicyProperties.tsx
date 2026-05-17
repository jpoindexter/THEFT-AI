import { useMemo, useState } from "react";
import type { Agent, Issue } from "@paperclipai/shared";
import type { CompanyUserDirectoryResponse } from "../../api/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import { AgentIcon } from "../AgentIconPicker";
import { buildCompanyUserInlineOptions } from "../../lib/company-members";
import {
  buildExecutionPolicy,
  stageParticipantValues,
} from "../../lib/issue-execution-policy";
import { sortAgentsByRecency, getRecentAssigneeIds } from "../../lib/recent-assignees";
import { cn } from "../../lib/utils";
import type { ExecutionStageType } from "./types";
import { PropertyPicker, PropertyRow } from "./PropertyLayout";

interface ExecutionPolicyPropertiesProps {
  issue: Issue;
  agents: Agent[] | undefined;
  companyMembers: CompanyUserDirectoryResponse | undefined;
  currentUserId: string | null | undefined;
  creatorUserLabel: string | null | undefined;
  inline?: boolean;
  agentName: (id: string | null) => string | null;
  userLabel: (userId: string | null | undefined) => string | null;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function ExecutionPolicyProperties({
  issue,
  agents,
  companyMembers,
  currentUserId,
  creatorUserLabel,
  inline,
  agentName,
  userLabel,
  onUpdate,
}: ExecutionPolicyPropertiesProps) {
  const [reviewersOpen, setReviewersOpen] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [approversOpen, setApproversOpen] = useState(false);
  const [approverSearch, setApproverSearch] = useState("");
  const reviewerValues = stageParticipantValues(issue.executionPolicy, "review");
  const approverValues = stageParticipantValues(issue.executionPolicy, "approval");
  const sortedAgents = useMemo(
    () => sortAgentsByRecency((agents ?? []).filter((a) => a.status !== "terminated"), getRecentAssigneeIds()),
    [agents],
  );
  const otherUserOptions = useMemo(
    () => buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId, issue.createdByUserId] }),
    [companyMembers?.users, currentUserId, issue.createdByUserId],
  );

  const updateExecutionPolicy = (nextReviewers: string[], nextApprovers: string[]) => {
    onUpdate({
      executionPolicy: buildExecutionPolicy({
        existingPolicy: issue.executionPolicy ?? null,
        reviewerValues: nextReviewers,
        approverValues: nextApprovers,
      }),
    });
  };
  const toggleExecutionParticipant = (stageType: ExecutionStageType, value: string) => {
    const currentValues = stageType === "review" ? reviewerValues : approverValues;
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((candidate) => candidate !== value)
      : [...currentValues, value];
    updateExecutionPolicy(
      stageType === "review" ? nextValues : reviewerValues,
      stageType === "approval" ? nextValues : approverValues,
    );
  };
  const executionParticipantLabel = (value: string) => {
    if (value.startsWith("agent:")) {
      return agentName(value.slice("agent:".length)) ?? value.slice("agent:".length, "agent:".length + 8);
    }
    if (value.startsWith("user:")) {
      return userLabel(value.slice("user:".length)) ?? "User";
    }
    return value;
  };
  const reviewerTrigger = reviewerValues.length > 0
    ? <span className="text-sm break-words min-w-0">{reviewerValues.map((value) => executionParticipantLabel(value)).join(", ")}</span>
    : <span className="text-sm text-muted-foreground">None</span>;
  const approverTrigger = approverValues.length > 0
    ? <span className="text-sm break-words min-w-0">{approverValues.map((value) => executionParticipantLabel(value)).join(", ")}</span>
    : <span className="text-sm text-muted-foreground">None</span>;
  const nextRunnableExecutionStage = (() => {
    if (issue.executionState?.status === "changes_requested" && issue.executionState.currentStageType) {
      return issue.executionState.currentStageType;
    }
    if (issue.executionState) return null;
    if (reviewerValues.length > 0) return "review";
    if (approverValues.length > 0) return "approval";
    return null;
  })();
  const currentExecutionLabel = (() => {
    if (!issue.executionState?.currentStageType) return null;
    const stageLabel = issue.executionState.currentStageType === "review" ? "Review" : "Approval";
    const participant = issue.executionState.currentParticipant;
    const participantLabel = participant
      ? (participant.type === "agent"
        ? agentName(participant.agentId ?? null)
        : userLabel(participant.userId ?? null))
      : null;
    if (issue.executionState.status === "changes_requested") {
      return `${stageLabel} requested changes${participantLabel ? ` by ${participantLabel}` : ""}`;
    }
    return `${stageLabel} pending${participantLabel ? ` with ${participantLabel}` : ""}`;
  })();
  const executionParticipantsContent = (
    stageType: ExecutionStageType,
    values: string[],
    search: string,
    setSearch: (value: string) => void,
    onClear: () => void,
  ) => (
    <>
      <Input
        className="mb-1 h-8 px-2 py-1.5 text-xs shadow-none md:text-xs"
        placeholder={`Search ${stageType === "review" ? "reviewers" : "approvers"}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus={!inline}
      />
      <div className="max-h-48 overflow-y-auto overscroll-contain">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
            values.length === 0 && "bg-accent",
          )}
          onClick={onClear}
        >
          No {stageType === "review" ? "reviewers" : "approvers"}
        </Button>
        {currentUserId && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className={cn(
              "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
              values.includes(`user:${currentUserId}`) && "bg-accent",
            )}
            onClick={() => toggleExecutionParticipant(stageType, `user:${currentUserId}`)}
          >
            <User className="h-3 w-3 shrink-0 text-muted-foreground" />
            Assign to me
          </Button>
        )}
        {issue.createdByUserId && issue.createdByUserId !== currentUserId && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className={cn(
              "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
              values.includes(`user:${issue.createdByUserId}`) && "bg-accent",
            )}
            onClick={() => toggleExecutionParticipant(stageType, `user:${issue.createdByUserId}`)}
          >
            <User className="h-3 w-3 shrink-0 text-muted-foreground" />
            {creatorUserLabel ? creatorUserLabel : "Requester"}
          </Button>
        )}
        {otherUserOptions
          .filter((option) => {
            if (!search.trim()) return true;
            return `${option.label} ${option.searchText ?? ""}`.toLowerCase().includes(search.toLowerCase());
          })
          .map((option) => (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              key={`${stageType}:${option.id}`}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
                values.includes(option.id) && "bg-accent",
              )}
              onClick={() => toggleExecutionParticipant(stageType, option.id)}
            >
              <User className="h-3 w-3 shrink-0 text-muted-foreground" />
              {option.label}
            </Button>
          ))}
        {sortedAgents
          .filter((agent) => {
            if (!search.trim()) return true;
            return agent.name.toLowerCase().includes(search.toLowerCase());
          })
          .map((agent) => {
            const encoded = `agent:${agent.id}`;
            return (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                key={`${stageType}:${agent.id}`}
                className={cn(
                  "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
                  values.includes(encoded) && "bg-accent",
                )}
                onClick={() => toggleExecutionParticipant(stageType, encoded)}
              >
                <AgentIcon icon={agent.icon} className="shrink-0 h-3 w-3 text-muted-foreground" />
                {agent.name}
              </Button>
            );
          })}
      </div>
    </>
  );
  const runExecutionButton = (stageType: ExecutionStageType) => (
    <PropertyRow label="">
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        onClick={() => onUpdate({ status: "in_review" })}
      >
        {stageType === "review" ? "Run review now" : "Run approval now"}
      </Button>
    </PropertyRow>
  );

  return (
    <>
      <PropertyPicker
        inline={inline}
        label="Reviewers"
        open={reviewersOpen}
        onOpenChange={(open) => { setReviewersOpen(open); if (!open) setReviewerSearch(""); }}
        triggerContent={reviewerTrigger}
        triggerClassName="min-w-0 max-w-full"
        popoverClassName="w-56"
      >
        {executionParticipantsContent(
          "review",
          reviewerValues,
          reviewerSearch,
          setReviewerSearch,
          () => updateExecutionPolicy([], approverValues),
        )}
      </PropertyPicker>
      {nextRunnableExecutionStage === "review" && reviewerValues.length > 0 ? runExecutionButton("review") : null}

      <PropertyPicker
        inline={inline}
        label="Approvers"
        open={approversOpen}
        onOpenChange={(open) => { setApproversOpen(open); if (!open) setApproverSearch(""); }}
        triggerContent={approverTrigger}
        triggerClassName="min-w-0 max-w-full"
        popoverClassName="w-56"
      >
        {executionParticipantsContent(
          "approval",
          approverValues,
          approverSearch,
          setApproverSearch,
          () => updateExecutionPolicy(reviewerValues, []),
        )}
      </PropertyPicker>
      {nextRunnableExecutionStage === "approval" && approverValues.length > 0 ? runExecutionButton("approval") : null}

      {currentExecutionLabel && (
        <PropertyRow label="Execution">
          <span className="text-sm">{currentExecutionLabel}</span>
        </PropertyRow>
      )}
    </>
  );
}
