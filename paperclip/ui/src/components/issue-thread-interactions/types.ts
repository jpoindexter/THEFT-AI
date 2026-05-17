import type { Agent } from "@paperclipai/shared";
import type {
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  IssueThreadInteraction,
  RequestConfirmationInteraction,
  SuggestTasksInteraction,
} from "../../lib/issue-thread-interactions";

export interface InteractionActorContext {
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
}

export type AcceptInteractionHandler = (
  interaction: SuggestTasksInteraction | RequestConfirmationInteraction,
  selectedClientKeys?: string[],
) => Promise<void> | void;

export type RejectInteractionHandler = (
  interaction: SuggestTasksInteraction | RequestConfirmationInteraction,
  reason?: string,
) => Promise<void> | void;

export type SubmitInteractionAnswersHandler = (
  interaction: AskUserQuestionsInteraction,
  answers: AskUserQuestionsAnswer[],
) => Promise<void> | void;

export type CancelInteractionHandler = (
  interaction: AskUserQuestionsInteraction,
) => Promise<void> | void;

export interface IssueThreadInteractionCardProps extends InteractionActorContext {
  interaction: IssueThreadInteraction;
  onAcceptInteraction?: AcceptInteractionHandler;
  onRejectInteraction?: RejectInteractionHandler;
  onSubmitInteractionAnswers?: SubmitInteractionAnswersHandler;
  onCancelInteraction?: CancelInteractionHandler;
}
