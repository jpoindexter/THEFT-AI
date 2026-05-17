import type { ThreadMessage } from "@assistant-ui/react";
import type { RequestConfirmationInteraction } from "../../lib/issue-thread-interactions";
import { useContext, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buildIssueThreadInteractionSummary } from "../../lib/issue-thread-interactions";
import { timeAgo } from "../../lib/timeAgo";
import { cn } from "../../lib/utils";
import { IssueThreadInteractionCard } from "../IssueThreadInteractionCard";
import { AgentIcon } from "../AgentIconPicker";
import { IssueChatCtx } from "./IssueChatMessageContext";
import {
  formatInteractionActorLabel,
  initialsForName,
} from "./SystemMessageHelpers";

export function ExpiredRequestConfirmationActivity({
  message,
  anchorId,
  interaction,
}: {
  message: ThreadMessage;
  anchorId?: string;
  interaction: RequestConfirmationInteraction;
}) {
  const {
    agentMap,
    currentUserId,
    userLabelMap,
    onAcceptInteraction,
    onRejectInteraction,
    onCancelInteraction,
  } = useContext(IssueChatCtx);
  const [expanded, setExpanded] = useState(false);
  const hasResolvedActor = Boolean(interaction.resolvedByAgentId || interaction.resolvedByUserId);
  const actorAgentId = hasResolvedActor
    ? interaction.resolvedByAgentId ?? null
    : interaction.createdByAgentId ?? null;
  const actorUserId = hasResolvedActor
    ? interaction.resolvedByUserId ?? null
    : interaction.createdByUserId ?? null;
  const actorName = formatInteractionActorLabel({
    agentId: actorAgentId,
    userId: actorUserId,
    agentMap,
    currentUserId,
    userLabelMap,
  });
  const actorIcon = actorAgentId ? agentMap?.get(actorAgentId)?.icon : undefined;
  const isCurrentUser = Boolean(actorUserId && currentUserId && actorUserId === currentUserId);
  const detailsId = anchorId ? `${anchorId}-details` : `${interaction.id}-details`;
  const summary = buildIssueThreadInteractionSummary(interaction);

  const rowContent = (
    <div className="min-w-0 flex-1">
      <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs", isCurrentUser && "justify-end")}>
        <span className="font-medium text-foreground">{actorName}</span>
        <span className="text-muted-foreground">updated this task</span>
        <a
          href={anchorId ? `#${anchorId}` : undefined}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          {timeAgo(message.createdAt)}
        </a>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="h-auto border-border/70 bg-background/70 px-1.5 py-0.5 text-micro text-muted-foreground hover:border-border hover:text-foreground"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          {expanded ? "Hide confirmation" : "Expired confirmation"}
        </Button>
      </div>
      {expanded ? (
        <p className={cn("mt-1 text-xs text-muted-foreground", isCurrentUser && "text-right")}>
          {summary}
        </p>
      ) : null}
    </div>
  );

  return (
    <div id={anchorId}>
      {isCurrentUser ? (
        <div className="flex items-start justify-end gap-2 py-1">
          {rowContent}
        </div>
      ) : (
        <div className="flex items-start gap-2.5 py-1">
          <Avatar size="sm" className="mt-0.5">
            {actorIcon ? (
              <AvatarFallback><AgentIcon icon={actorIcon} className="h-3.5 w-3.5" /></AvatarFallback>
            ) : (
              <AvatarFallback>{initialsForName(actorName)}</AvatarFallback>
            )}
          </Avatar>
          {rowContent}
        </div>
      )}
      {expanded ? (
        <div id={detailsId} className="mt-2">
          <IssueThreadInteractionCard
            interaction={interaction}
            agentMap={agentMap}
            currentUserId={currentUserId}
            userLabelMap={userLabelMap}
            onAcceptInteraction={onAcceptInteraction}
            onRejectInteraction={onRejectInteraction}
            onCancelInteraction={onCancelInteraction}
          />
        </div>
      ) : null}
    </div>
  );
}
