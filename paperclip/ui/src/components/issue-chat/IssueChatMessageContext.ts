import { createContext } from "react";
import type {
  Agent,
  FeedbackDataSharingPreference,
  FeedbackVoteValue,
  SuccessfulRunHandoffState,
} from "@paperclipai/shared";

import type { CompanyUserProfile } from "../../lib/company-members";
import type {
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  RequestConfirmationInteraction,
  SuggestTasksInteraction,
} from "../../lib/issue-thread-interactions";

export interface IssueChatMessageContext {
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  feedbackTermsUrl: string | null;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
  userProfileMap?: ReadonlyMap<string, CompanyUserProfile> | null;
  onVote?: (
    commentId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  onStopRun?: (runId: string) => Promise<void>;
  stopRunLabel?: string;
  stoppingRunLabel?: string;
  stopRunVariant?: "stop" | "pause";
  onInterruptQueued?: (runId: string) => Promise<void>;
  onCancelQueued?: (commentId: string) => void;
  onImageClick?: (src: string) => void;
  onAcceptInteraction?: (
    interaction: SuggestTasksInteraction | RequestConfirmationInteraction,
    selectedClientKeys?: string[],
  ) => Promise<void> | void;
  onRejectInteraction?: (
    interaction: SuggestTasksInteraction | RequestConfirmationInteraction,
    reason?: string,
  ) => Promise<void> | void;
  onSubmitInteractionAnswers?: (
    interaction: AskUserQuestionsInteraction,
    answers: AskUserQuestionsAnswer[],
  ) => Promise<void> | void;
  onCancelInteraction?: (
    interaction: AskUserQuestionsInteraction,
  ) => Promise<void> | void;
  issueStatus?: string;
  successfulRunHandoff?: SuccessfulRunHandoffState | null;
}

export const IssueChatCtx = createContext<IssueChatMessageContext>({
  feedbackDataSharingPreference: "prompt",
  feedbackTermsUrl: null,
  issueStatus: undefined,
  successfulRunHandoff: null,
});
