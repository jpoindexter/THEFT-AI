import { ListChecks } from "lucide-react";
import type { IssueThreadInteraction } from "../../lib/issue-thread-interactions";
import { cn, formatDateTime, formatShortDate } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  interactionKindLabel,
  resolveActorLabel,
  statusClasses,
  statusIcon,
  statusLabel,
} from "./actor-labels";
import type { InteractionActorContext } from "./types";

export function InteractionCardHeader({
  interaction,
  agentMap,
  currentUserId,
  userLabelMap,
}: {
  interaction: IssueThreadInteraction;
} & InteractionActorContext) {
  const StatusIcon = statusIcon(interaction.status);
  const styles = statusClasses(interaction.status);
  const createdByLabel = resolveActorLabel({
    agentId: interaction.createdByAgentId,
    userId: interaction.createdByUserId,
    agentMap,
    currentUserId,
    userLabelMap,
  });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-micro font-semibold uppercase tracking-widest",
              styles.badge,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {interactionKindLabel(interaction.kind)}
            <span className="text-current/60">/</span>
            {statusLabel(interaction.status)}
          </span>
          {interaction.continuationPolicy === "wake_assignee"
            || interaction.continuationPolicy === "wake_assignee_on_accept" ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-border/70 bg-transparent px-2.5 py-1 text-micro font-medium uppercase tracking-widest text-foreground/70">
                <ListChecks className="h-3.5 w-3.5" />
                {interaction.continuationPolicy === "wake_assignee_on_accept"
                  ? "Wakes on confirm"
                  : "Wakes assignee"}
              </span>
            ) : null}
        </div>

        <div className="mt-3 text-lg font-bold text-foreground">
          {interaction.title
            ?? (interaction.kind === "suggest_tasks"
              ? "Suggested task tree"
              : interaction.kind === "ask_user_questions"
                ? interaction.payload.title ?? "Questions for the operator"
                : "Confirmation requested")}
        </div>
        {interaction.summary ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {interaction.summary}
          </p>
        ) : null}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="rounded-sm border border-border/70 bg-transparent px-3 py-2 text-right text-xs text-muted-foreground">
            <div className="font-medium text-foreground">
              {formatShortDate(interaction.createdAt)}
            </div>
            <div>proposed by {createdByLabel}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Created {formatDateTime(interaction.createdAt)}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function InteractionResolvedBy({
  interaction,
  agentMap,
  currentUserId,
  userLabelMap,
}: {
  interaction: IssueThreadInteraction;
} & InteractionActorContext) {
  const resolvedByLabel =
    interaction.resolvedByAgentId || interaction.resolvedByUserId
      ? resolveActorLabel({
          agentId: interaction.resolvedByAgentId,
          userId: interaction.resolvedByUserId,
          agentMap,
          currentUserId,
          userLabelMap,
        })
      : null;

  if (!resolvedByLabel) return null;

  return (
    <div className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
      Resolved by <span className="font-medium text-foreground">{resolvedByLabel}</span>
      {interaction.resolvedAt ? ` on ${formatShortDate(interaction.resolvedAt)}` : ""}
    </div>
  );
}
