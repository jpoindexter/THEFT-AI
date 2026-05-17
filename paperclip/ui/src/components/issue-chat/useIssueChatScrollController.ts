import type { ThreadMessage } from "@assistant-ui/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useLocation } from "@/lib/router";
import {
  captureComposerViewportSnapshot,
  restoreComposerViewportSnapshot,
  shouldPreserveComposerViewport,
} from "../../lib/issue-chat-scroll";
import { SUBMIT_SCROLL_RESERVE_VH } from "./ComposerHelpers";
import {
  findMessageAnchorIndex,
  issueChatMessageAnchorId,
} from "./MessageState";
import {
  VIRTUALIZED_THREAD_ROW_THRESHOLD,
  type VirtualizedIssueChatThreadListHandle,
} from "./VirtualizedThreadList";
import { useIssueChatLatestScroll } from "./useIssueChatLatestScroll";

interface UseIssueChatScrollControllerArgs {
  messages: readonly ThreadMessage[];
  onRefreshLatestComments?: () => Promise<unknown> | void;
}

export function useIssueChatScrollController({
  messages,
  onRefreshLatestComments,
}: UseIssueChatScrollControllerArgs) {
  const location = useLocation();
  const lastScrolledHashRef = useRef<string | null>(null);
  const virtualizedThreadRef = useRef<VirtualizedIssueChatThreadListHandle | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const composerViewportAnchorRef = useRef<HTMLDivElement | null>(null);
  const composerViewportSnapshotRef = useRef<ReturnType<typeof captureComposerViewportSnapshot>>(null);
  const preserveComposerViewportRef = useRef(false);
  const pendingSubmitScrollRef = useRef(false);
  const lastUserMessageIdRef = useRef<string | null>(null);
  const spacerBaselineAnchorRef = useRef<string | null>(null);
  const spacerInitialReserveRef = useRef(0);
  const [bottomSpacerHeight, setBottomSpacerHeight] = useState(0);

  const useVirtualizedThread = messages.length >= VIRTUALIZED_THREAD_ROW_THRESHOLD;
  const messageAnchorIndex = useMemo(() => {
    const map = new Map<string, number>();
    messages.forEach((message, index) => {
      const anchorId = issueChatMessageAnchorId(message);
      if (anchorId) map.set(anchorId, index);
    });
    return map;
  }, [messages]);

  const scrollToThreadAnchor = useCallback((
    anchorId: string,
    options?: { align?: "start" | "center" | "end" | "auto"; behavior?: ScrollBehavior },
    messageSnapshot: readonly ThreadMessage[] = messages,
  ) => {
    if (typeof document === "undefined") return false;

    const snapshotUsesVirtualizer = messageSnapshot.length >= VIRTUALIZED_THREAD_ROW_THRESHOLD;
    const virtualIndex =
      messageSnapshot === messages
        ? messageAnchorIndex.get(anchorId)
        : findMessageAnchorIndex(messageSnapshot, anchorId);
    if (snapshotUsesVirtualizer && virtualIndex !== undefined && virtualIndex >= 0) {
      if (!virtualizedThreadRef.current) return false;
      virtualizedThreadRef.current.scrollToIndex(virtualIndex, {
        align: options?.align ?? "center",
        behavior: options?.behavior ?? "smooth",
      });
      return true;
    }

    const element = document.getElementById(anchorId);
    if (!element) return false;
    element.scrollIntoView({
      behavior: options?.behavior ?? "smooth",
      block: options?.align === "start"
        ? "start"
        : options?.align === "end"
          ? "end"
          : "center",
    });
    return true;
  }, [messageAnchorIndex, messages]);

  const prepareSubmitScroll = useCallback(() => {
    pendingSubmitScrollRef.current = true;
  }, []);

  useEffect(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const lastUserId = lastUserMessage?.id ?? null;

    if (
      pendingSubmitScrollRef.current
      && lastUserId
      && lastUserId !== lastUserMessageIdRef.current
      && typeof window !== "undefined"
    ) {
      pendingSubmitScrollRef.current = false;
      const custom = lastUserMessage?.metadata.custom as { anchorId?: unknown } | undefined;
      const anchorId = typeof custom?.anchorId === "string" ? custom.anchorId : null;
      if (anchorId) {
        const reserve = Math.round(window.innerHeight * SUBMIT_SCROLL_RESERVE_VH);
        spacerBaselineAnchorRef.current = anchorId;
        spacerInitialReserveRef.current = reserve;
        setBottomSpacerHeight(reserve);
        requestAnimationFrame(() => {
          scrollToThreadAnchor(anchorId, { align: "start", behavior: "smooth" });
        });
      }
    }

    lastUserMessageIdRef.current = lastUserId;
  }, [messages, scrollToThreadAnchor]);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const anchorId = spacerBaselineAnchorRef.current;
    if (!anchorId || spacerInitialReserveRef.current <= 0) return;
    const userEl = document.getElementById(anchorId);
    const bottomEl = bottomAnchorRef.current;
    if (!userEl || !bottomEl) return;
    const contentBelow = Math.max(
      0,
      bottomEl.getBoundingClientRect().top - userEl.getBoundingClientRect().bottom,
    );
    const next = Math.max(0, spacerInitialReserveRef.current - contentBelow);
    setBottomSpacerHeight((prev) => (prev === next ? prev : next));
    if (next === 0) {
      spacerBaselineAnchorRef.current = null;
      spacerInitialReserveRef.current = 0;
    }
  }, [messages]);

  useLayoutEffect(() => {
    const composerElement = composerViewportAnchorRef.current;
    if (preserveComposerViewportRef.current) {
      restoreComposerViewportSnapshot(
        composerViewportSnapshotRef.current,
        composerElement,
      );
    }

    composerViewportSnapshotRef.current = captureComposerViewportSnapshot(composerElement);
    preserveComposerViewportRef.current = shouldPreserveComposerViewport(composerElement);
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = location.hash || window.location.hash || "";
    if (
      !(
        hash.startsWith("#comment-")
        || hash.startsWith("#activity-")
        || hash.startsWith("#run-")
        || hash.startsWith("#interaction-")
      )
    ) return;
    if (messages.length === 0 || lastScrolledHashRef.current === hash) return;
    const targetId = hash.slice(1);
    let cancelled = false;
    const attemptScroll = (finalAttempt = false) => {
      if (cancelled || lastScrolledHashRef.current === hash) return;
      const didScroll = scrollToThreadAnchor(targetId, { align: "center", behavior: "smooth" });
      if (!didScroll) return;
      if (finalAttempt || !useVirtualizedThread || document.getElementById(targetId)) {
        lastScrolledHashRef.current = hash;
      }
    };

    attemptScroll();
    const frame = requestAnimationFrame(() => attemptScroll());
    const timeout = window.setTimeout(() => attemptScroll(true), 250);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [location.hash, messages, scrollToThreadAnchor, useVirtualizedThread]);

  const handleJumpToLatest = useIssueChatLatestScroll({
    messages,
    useVirtualizedThread,
    virtualizedThreadRef,
    bottomAnchorRef,
    scrollToThreadAnchor,
    onRefreshLatestComments,
  });

  return {
    virtualizedThreadRef,
    bottomAnchorRef,
    composerViewportAnchorRef,
    bottomSpacerHeight,
    prepareSubmitScroll,
    handleJumpToLatest,
  };
}
