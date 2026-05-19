import { useCallback, useEffect, useRef, useState } from "react";

import type { IssueChatComposerHandle } from "@/components/IssueChatThread";
import { ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY } from "@paperclipai/shared";

type UseIssueDetailTabStateInput = {
  locationHash: string;
};

export function useIssueDetailTabState({ locationHash }: UseIssueDetailTabStateInput) {
  const [detailTab, setDetailTab] = useState("related-work");
  const [handoffFocusSignal, setHandoffFocusSignal] = useState(0);
  const [pendingCommentComposerFocusKey, setPendingCommentComposerFocusKey] = useState(0);
  const pendingCommentDraftRef = useRef<string | null>(null);
  const commentComposerRef = useRef<IssueChatComposerHandle | null>(null);

  const restoreQueuedCommentDraft = useCallback((body: string) => {
    commentComposerRef.current?.restoreDraft(body);
  }, []);

  const focusCommentComposerFromShortcut = useCallback((draft?: string) => {
    pendingCommentDraftRef.current = draft?.trim() ? draft : null;
    setDetailTab("chat");
    setPendingCommentComposerFocusKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!locationHash.startsWith("#document-")) return;
    const documentKey = decodeURIComponent(locationHash.slice("#document-".length));
    if (documentKey !== ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY) return;
    setDetailTab("activity");
    setHandoffFocusSignal((current) => current + 1);
  }, [locationHash]);

  useEffect(() => {
    if (pendingCommentComposerFocusKey === 0) return;
    if (detailTab !== "chat") return;
    const focusOrRestore = () => {
      const pendingDraft = pendingCommentDraftRef.current;
      if (pendingDraft && commentComposerRef.current) {
        pendingCommentDraftRef.current = null;
        commentComposerRef.current.restoreDraft(pendingDraft);
        return;
      }
      if (!pendingDraft) {
        commentComposerRef.current?.focus();
      }
    };
    focusOrRestore();
    const frameId = requestAnimationFrame(focusOrRestore);
    return () => cancelAnimationFrame(frameId);
  }, [detailTab, pendingCommentComposerFocusKey]);

  return {
    commentComposerRef,
    detailTab,
    focusCommentComposerFromShortcut,
    handoffFocusSignal,
    restoreQueuedCommentDraft,
    setDetailTab,
  };
}
