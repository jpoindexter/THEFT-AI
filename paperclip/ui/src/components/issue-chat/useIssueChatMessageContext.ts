import { useLayoutEffect, useMemo, useRef } from "react";

import type { IssueChatMessageContext } from "./IssueChatMessageContext";
import type { IssueChatThreadProps } from "./IssueChatThreadTypes";

type UseIssueChatMessageContextArgs = Pick<
  IssueChatThreadProps,
  | "agentMap"
  | "currentUserId"
  | "feedbackDataSharingPreference"
  | "feedbackTermsUrl"
  | "issueStatus"
  | "onAcceptInteraction"
  | "onCancelInteraction"
  | "onCancelQueued"
  | "onImageClick"
  | "onInterruptQueued"
  | "onRejectInteraction"
  | "onStopRun"
  | "onSubmitInteractionAnswers"
  | "onVote"
  | "stopRunLabel"
  | "stoppingRunLabel"
  | "stopRunVariant"
  | "successfulRunHandoff"
  | "userLabelMap"
  | "userProfileMap"
>;

export function useIssueChatMessageContext({
  feedbackDataSharingPreference,
  feedbackTermsUrl,
  agentMap,
  currentUserId,
  userLabelMap,
  userProfileMap,
  onVote,
  onStopRun,
  stopRunLabel,
  stoppingRunLabel,
  stopRunVariant,
  onInterruptQueued,
  onCancelQueued,
  onImageClick,
  onAcceptInteraction,
  onRejectInteraction,
  onSubmitInteractionAnswers,
  onCancelInteraction,
  issueStatus,
  successfulRunHandoff,
}: UseIssueChatMessageContextArgs): IssueChatMessageContext {
  const stableOnVote = useStableEvent(onVote);
  const stableOnStopRun = useStableEvent(onStopRun);
  const stableOnInterruptQueued = useStableEvent(onInterruptQueued);
  const stableOnCancelQueued = useStableEvent(onCancelQueued);
  const stableOnImageClick = useStableEvent(onImageClick);
  const stableOnAcceptInteraction = useStableEvent(onAcceptInteraction);
  const stableOnRejectInteraction = useStableEvent(onRejectInteraction);
  const stableOnSubmitInteractionAnswers = useStableEvent(onSubmitInteractionAnswers);
  const stableOnCancelInteraction = useStableEvent(onCancelInteraction);

  return useMemo<IssueChatMessageContext>(
    () => ({
      feedbackDataSharingPreference: feedbackDataSharingPreference ?? "prompt",
      feedbackTermsUrl: feedbackTermsUrl ?? null,
      agentMap,
      currentUserId,
      userLabelMap,
      userProfileMap,
      onVote: stableOnVote,
      onStopRun: stableOnStopRun,
      stopRunLabel,
      stoppingRunLabel,
      stopRunVariant,
      onInterruptQueued: stableOnInterruptQueued,
      onCancelQueued: stableOnCancelQueued,
      onImageClick: stableOnImageClick,
      onAcceptInteraction: stableOnAcceptInteraction,
      onRejectInteraction: stableOnRejectInteraction,
      onSubmitInteractionAnswers: stableOnSubmitInteractionAnswers,
      onCancelInteraction: stableOnCancelInteraction,
      issueStatus,
      successfulRunHandoff,
    }),
    [
      feedbackDataSharingPreference,
      feedbackTermsUrl,
      agentMap,
      currentUserId,
      userLabelMap,
      userProfileMap,
      stableOnVote,
      stableOnStopRun,
      stopRunLabel,
      stoppingRunLabel,
      stopRunVariant,
      stableOnInterruptQueued,
      stableOnCancelQueued,
      stableOnImageClick,
      stableOnAcceptInteraction,
      stableOnRejectInteraction,
      stableOnSubmitInteractionAnswers,
      stableOnCancelInteraction,
      issueStatus,
      successfulRunHandoff,
    ],
  );
}

function useStableEvent<T extends (...args: never[]) => unknown>(callback: T | undefined): T | undefined {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => {
    if (!callback) return undefined;
    return ((...args: Parameters<T>) => callbackRef.current?.(...args)) as T;
    // Keep the wrapper stable while the callback identity changes; the ref above
    // carries the current callback implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(callback)]);
}
