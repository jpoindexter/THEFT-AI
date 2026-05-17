import { cn } from "../lib/utils";
import {
  AskUserQuestionsInteractionCard,
  InteractionCardHeader,
  InteractionResolvedBy,
  RequestConfirmationInteractionCard,
  statusClasses,
  SuggestedTasksInteractionCard,
  type IssueThreadInteractionCardProps,
} from "./issue-thread-interactions";

export function IssueThreadInteractionCard({
  interaction,
  agentMap,
  currentUserId,
  userLabelMap,
  onAcceptInteraction,
  onRejectInteraction,
  onSubmitInteractionAnswers,
  onCancelInteraction,
}: IssueThreadInteractionCardProps) {
  const styles = statusClasses(interaction.status);

  return (
    <div className={cn("rounded-sm border p-5 shadow-none", styles.shell)}>
      <InteractionCardHeader
        interaction={interaction}
        agentMap={agentMap}
        currentUserId={currentUserId}
        userLabelMap={userLabelMap}
      />

      <div className="mt-5">
        {interaction.kind === "suggest_tasks" ? (
          <SuggestedTasksInteractionCard
            interaction={interaction}
            agentMap={agentMap}
            currentUserId={currentUserId}
            userLabelMap={userLabelMap}
            onAcceptInteraction={onAcceptInteraction}
            onRejectInteraction={onRejectInteraction}
          />
        ) : interaction.kind === "ask_user_questions" ? (
          <AskUserQuestionsInteractionCard
            interaction={interaction}
            onSubmitInteractionAnswers={onSubmitInteractionAnswers}
            onCancelInteraction={onCancelInteraction}
          />
        ) : (
          <RequestConfirmationInteractionCard
            interaction={interaction}
            onAcceptInteraction={onAcceptInteraction}
            onRejectInteraction={onRejectInteraction}
          />
        )}
      </div>

      <InteractionResolvedBy
        interaction={interaction}
        agentMap={agentMap}
        currentUserId={currentUserId}
        userLabelMap={userLabelMap}
      />
    </div>
  );
}
