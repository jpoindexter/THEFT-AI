import { memo } from "react";
import { Link } from "react-router-dom";
import type {
  Agent,
  Approval,
  FeedbackDataSharingPreference,
  FeedbackVoteValue,
} from "@paperclipai/shared";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ApprovalCard } from "../ApprovalCard";
import type { IssueTimelineEvent } from "../../lib/issue-timeline-events";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/timeAgo";
import {
  formatRunStatusLabel,
  formatTimelineActorName,
  formatTimelineAssigneeLabel,
  formatTimelineWorkspaceLabel,
  humanizeValue,
  initialsForName,
  runStatusClass,
  runTimestamp,
  workspaceLabel,
} from "./commentThreadHelpers";
import { CommentCard } from "./CommentCard";
import type { LinkedRunItem, TimelineItem } from "./CommentThreadTypes";

function TimelineEventCard({
  event,
  agentMap,
  currentUserId,
}: {
  event: IssueTimelineEvent;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
}) {
  const actorName = formatTimelineActorName(event.actorType, event.actorId, agentMap, currentUserId);
  const actionLabel = event.followUpRequested ? "requested follow-up" : "updated this task";

  return (
    <div id={`activity-${event.id}`} className="flex items-start gap-2.5 py-1.5">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{initialsForName(actorName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm">
          <span className="font-medium text-foreground">{actorName}</span>
          <span className="text-muted-foreground">{actionLabel}</span>
          <a
            href={`#activity-${event.id}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {timeAgo(event.createdAt)}
          </a>
        </div>

        {event.statusChange ? (
          <TimelineChangeRow label="Status" from={humanizeValue(event.statusChange.from)} to={humanizeValue(event.statusChange.to)} />
        ) : null}

        {event.assigneeChange ? (
          <TimelineChangeRow
            label="Assignee"
            from={formatTimelineAssigneeLabel(event.assigneeChange.from, agentMap, currentUserId)}
            to={formatTimelineAssigneeLabel(event.assigneeChange.to, agentMap, currentUserId)}
          />
        ) : null}

        {event.workspaceChange ? (
          <TimelineChangeRow
            label="Workspace"
            from={formatTimelineWorkspaceLabel(event.workspaceChange.from)}
            to={formatTimelineWorkspaceLabel(event.workspaceChange.to)}
          />
        ) : null}
      </div>
    </div>
  );
}

function TimelineChangeRow({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="theft-label-nano w-14">{label}</span>
      <span className="text-muted-foreground">{from}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium text-foreground">{to}</span>
    </div>
  );
}

function RunTimelineItem({ run, agentMap }: { run: LinkedRunItem; agentMap?: Map<string, Agent> }) {
  const actorName = agentMap?.get(run.agentId)?.name ?? run.agentId.slice(0, 8);

  return (
    <div id={`run-${run.runId}`} className="flex items-center gap-2.5 py-1.5">
      <Avatar size="sm">
        <AvatarFallback>{initialsForName(actorName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          <Link to={`/agents/${run.agentId}`} className="font-medium text-foreground transition-colors hover:underline">
            {actorName}
          </Link>
          <span className="text-muted-foreground">run</span>
          <Link
            to={`/agents/${run.agentId}/runs/${run.runId}`}
            className="inline-flex items-center rounded-md border border-border bg-accent/40 px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            {run.runId.slice(0, 8)}
          </Link>
          <span className={cn("font-medium", runStatusClass(run.status))}>
            {formatRunStatusLabel(run.status)}
          </span>
          <a
            href={`#run-${run.runId}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {timeAgo(runTimestamp(run))}
          </a>
        </div>
      </div>
      {run.environment || run.environmentLease ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-micro text-muted-foreground">
          {run.environment ? (
            <span>
              Environment <span className="text-foreground">{run.environment.name}</span>
              <span> · {run.environment.driver}</span>
            </span>
          ) : null}
          {run.environmentLease?.provider ? (
            <span>
              Provider <span className="text-foreground">{run.environmentLease.provider}</span>
            </span>
          ) : null}
          {run.environmentLease ? (
            <span>
              Lease{" "}
              <span className="font-mono text-foreground">
                {run.environmentLease.id.slice(0, 8)}
              </span>
              <span> · {run.environmentLease.status}</span>
            </span>
          ) : null}
          {run.environmentLease?.workspacePath ? (
            <span className="min-w-0 break-words font-mono">
              {workspaceLabel(run.environmentLease.workspacePath)}
            </span>
          ) : null}
          {run.environmentLease?.failureReason ? (
            <span className="text-destructive">
              Failure: {run.environmentLease.failureReason}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const TimelineList = memo(function TimelineList({
  timeline,
  agentMap,
  currentUserId,
  companyId,
  projectId,
  onApproveApproval,
  onRejectApproval,
  pendingApprovalAction,
  feedbackVoteByTargetId,
  feedbackDataSharingPreference = "prompt",
  feedbackTermsUrl = null,
  onVote,
  votingTargetId,
  highlightCommentId,
}: {
  timeline: TimelineItem[];
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  companyId?: string | null;
  projectId?: string | null;
  onApproveApproval?: (approvalId: string) => Promise<void>;
  onRejectApproval?: (approvalId: string) => Promise<void>;
  pendingApprovalAction?: {
    approvalId: string;
    action: "approve" | "reject";
  } | null;
  feedbackVoteByTargetId?: Map<string, FeedbackVoteValue>;
  feedbackDataSharingPreference?: FeedbackDataSharingPreference;
  feedbackTermsUrl?: string | null;
  onVote?: (
    commentId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  votingTargetId?: string | null;
  highlightCommentId?: string | null;
}) {
  if (timeline.length === 0) {
    return <p className="text-sm text-muted-foreground">No timeline entries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {timeline.map((item) => {
        if (item.kind === "event") {
          return (
            <TimelineEventCard
              key={`event:${item.event.id}`}
              event={item.event}
              agentMap={agentMap}
              currentUserId={currentUserId}
            />
          );
        }

        if (item.kind === "approval") {
          return (
            <ApprovalTimelineItem
              key={`approval:${item.approval.id}`}
              approval={item.approval}
              agentMap={agentMap}
              pendingApprovalAction={pendingApprovalAction}
              onApproveApproval={onApproveApproval}
              onRejectApproval={onRejectApproval}
            />
          );
        }

        if (item.kind === "run") {
          return <RunTimelineItem key={`run:${item.run.runId}`} run={item.run} agentMap={agentMap} />;
        }

        const comment = item.comment;
        return (
          <CommentCard
            key={comment.id}
            comment={comment}
            agentMap={agentMap}
            companyId={companyId}
            projectId={projectId}
            feedbackVote={feedbackVoteByTargetId?.get(comment.id) ?? null}
            feedbackDataSharingPreference={feedbackDataSharingPreference}
            feedbackTermsUrl={feedbackTermsUrl}
            onVote={onVote ? (vote, options) => onVote(comment.id, vote, options) : undefined}
            voting={votingTargetId === comment.id}
            highlightCommentId={highlightCommentId}
          />
        );
      })}
    </div>
  );
});

function ApprovalTimelineItem({
  approval,
  agentMap,
  pendingApprovalAction,
  onApproveApproval,
  onRejectApproval,
}: {
  approval: Approval;
  agentMap?: Map<string, Agent>;
  pendingApprovalAction?: {
    approvalId: string;
    action: "approve" | "reject";
  } | null;
  onApproveApproval?: (approvalId: string) => Promise<void>;
  onRejectApproval?: (approvalId: string) => Promise<void>;
}) {
  const isPending = pendingApprovalAction?.approvalId === approval.id;
  return (
    <div id={`approval-${approval.id}`} className="py-1.5">
      <ApprovalCard
        approval={approval}
        requesterAgent={approval.requestedByAgentId ? agentMap?.get(approval.requestedByAgentId) ?? null : null}
        onApprove={onApproveApproval ? () => void onApproveApproval(approval.id) : undefined}
        onReject={onRejectApproval ? () => void onRejectApproval(approval.id) : undefined}
        detailLink={`/approvals/${approval.id}`}
        isPending={isPending}
        pendingAction={isPending ? pendingApprovalAction?.action ?? null : null}
      />
    </div>
  );
}
