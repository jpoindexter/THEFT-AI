import type { ThreadMessage } from "@assistant-ui/react";
import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from "react";

import {
  findLatestCommentMessageIndex,
  issueChatMessageAnchorId,
} from "./MessageState";
import type { VirtualizedIssueChatThreadListHandle } from "./VirtualizedThreadList";

type ScrollToThreadAnchor = (
  anchorId: string,
  options?: { align?: "start" | "center" | "end" | "auto"; behavior?: ScrollBehavior },
  messageSnapshot?: readonly ThreadMessage[],
) => boolean;

interface UseIssueChatLatestScrollArgs {
  messages: readonly ThreadMessage[];
  useVirtualizedThread: boolean;
  virtualizedThreadRef: RefObject<VirtualizedIssueChatThreadListHandle | null>;
  bottomAnchorRef: RefObject<HTMLDivElement | null>;
  scrollToThreadAnchor: ScrollToThreadAnchor;
  onRefreshLatestComments?: () => Promise<unknown> | void;
}

interface LatestCommentTarget {
  anchorId: string;
  index: number;
}

interface LatestSettleState {
  cancelled: boolean;
  lastScrollTop: number;
  lastScrollHeight: number;
  stableTicks: number;
}

interface LatestSettleSession {
  target: LatestCommentTarget;
  virtualizedThreadRef: RefObject<VirtualizedIssueChatThreadListHandle | null>;
  timeoutsRef: MutableRefObject<number[]>;
  cleanupRef: MutableRefObject<(() => void) | null>;
  state: LatestSettleState;
  startedAt: number;
  maxDurationMs: number;
  tickMs: number;
  tolerancePx: number;
}

function resolveLatestCommentTarget(messageSnapshot: readonly ThreadMessage[]): LatestCommentTarget | null {
  const index = findLatestCommentMessageIndex(messageSnapshot);
  if (index < 0) return null;
  const anchorId = issueChatMessageAnchorId(messageSnapshot[index]);
  return anchorId ? { anchorId, index } : null;
}

function clearLatestSettleTimeouts(
  timeoutsRef: MutableRefObject<number[]>,
  cleanupRef: MutableRefObject<(() => void) | null>,
) {
  if (typeof window === "undefined") return;
  for (const timeout of timeoutsRef.current) {
    window.clearTimeout(timeout);
  }
  timeoutsRef.current = [];
  cleanupRef.current?.();
  cleanupRef.current = null;
}

function resolveMainScrollContainer(): HTMLElement | null {
  return (document.getElementById("main-content") as HTMLElement | null);
}

function finishLatestSettle(session: LatestSettleSession) {
  session.cleanupRef.current?.();
  session.cleanupRef.current = null;
  for (const timeout of session.timeoutsRef.current) {
    window.clearTimeout(timeout);
  }
  session.timeoutsRef.current = [];
}

function scheduleLatestSettleTick(
  session: LatestSettleSession,
  tick: () => void,
  delay: number,
) {
  const timeout = window.setTimeout(() => {
    session.timeoutsRef.current = session.timeoutsRef.current.filter((entry) => entry !== timeout);
    tick();
  }, delay);
  session.timeoutsRef.current.push(timeout);
}

function updateLatestSettleStability(
  state: LatestSettleState,
  scrollTop: number,
  scrollHeight: number,
  offBottom: number,
  tolerancePx: number,
) {
  const scrollStable = Math.abs(scrollTop - state.lastScrollTop) < 1;
  const heightStable = scrollHeight === state.lastScrollHeight;
  const atBottom = Math.abs(offBottom) <= tolerancePx;
  state.stableTicks = scrollStable && heightStable && atBottom ? state.stableTicks + 1 : 0;
  state.lastScrollTop = scrollTop;
  state.lastScrollHeight = scrollHeight;
  return state.stableTicks >= 3;
}

function tickLatestSettle(session: LatestSettleSession, tick: () => void) {
  const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
  if (session.state.cancelled || now - session.startedAt > session.maxDurationMs) {
    finishLatestSettle(session);
    return;
  }

  const element = document.getElementById(session.target.anchorId);
  if (!element) {
    session.virtualizedThreadRef.current?.scrollToIndex(session.target.index, {
      align: "end",
      behavior: "auto",
    });
    scheduleLatestSettleTick(session, tick, session.tickMs);
    return;
  }

  const container = resolveMainScrollContainer();
  const containerBottom = container?.getBoundingClientRect().bottom ?? window.innerHeight;
  const offBottom = element.getBoundingClientRect().bottom - containerBottom;
  if (Math.abs(offBottom) > session.tolerancePx) {
    element.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  const scrollTop = container?.scrollTop ?? window.scrollY;
  const scrollHeight = container?.scrollHeight ?? document.documentElement.scrollHeight;
  if (updateLatestSettleStability(session.state, scrollTop, scrollHeight, offBottom, session.tolerancePx)) {
    finishLatestSettle(session);
    return;
  }
  scheduleLatestSettleTick(session, tick, session.tickMs);
}

function startLatestCommentSettling(args: {
  target: LatestCommentTarget;
  virtualizedThreadRef: RefObject<VirtualizedIssueChatThreadListHandle | null>;
  timeoutsRef: MutableRefObject<number[]>;
  cleanupRef: MutableRefObject<(() => void) | null>;
}) {
  const cancelTarget = resolveMainScrollContainer() ?? window;
  const session: LatestSettleSession = {
    ...args,
    state: { cancelled: false, lastScrollTop: -1, lastScrollHeight: -1, stableTicks: 0 },
    startedAt: (typeof performance !== "undefined" ? performance.now() : Date.now()),
    maxDurationMs: 4000,
    tickMs: 80,
    tolerancePx: 4,
  };
  const cancel = () => {
    session.state.cancelled = true;
  };
  const cleanup = () => {
    cancelTarget.removeEventListener("wheel", cancel);
    cancelTarget.removeEventListener("touchstart", cancel);
  };

  cancelTarget.addEventListener("wheel", cancel, { once: true, passive: true });
  cancelTarget.addEventListener("touchstart", cancel, { once: true, passive: true });
  session.cleanupRef.current = cleanup;

  const tick = () => tickLatestSettle(session, tick);
  scheduleLatestSettleTick(session, tick, 120);
}

export function useIssueChatLatestScroll({
  messages,
  useVirtualizedThread,
  virtualizedThreadRef,
  bottomAnchorRef,
  scrollToThreadAnchor,
  onRefreshLatestComments,
}: UseIssueChatLatestScrollArgs) {
  const latestMessagesRef = useRef<readonly ThreadMessage[]>(messages);
  const latestSettleTimeoutsRef = useRef<number[]>([]);
  const latestSettleCleanupRef = useRef<(() => void) | null>(null);

  latestMessagesRef.current = messages;

  const clearLatestSettle = useCallback(() => {
    clearLatestSettleTimeouts(latestSettleTimeoutsRef, latestSettleCleanupRef);
  }, []);

  useEffect(() => clearLatestSettle, [clearLatestSettle]);

  const jumpToLatestFallback = useCallback(() => {
    if (useVirtualizedThread) {
      virtualizedThreadRef.current?.scrollToLatest({ behavior: "smooth" });
      return;
    }
    bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bottomAnchorRef, useVirtualizedThread, virtualizedThreadRef]);

  const scrollToLatestCommentWithSettle = useCallback((
    messageSnapshot: readonly ThreadMessage[] = latestMessagesRef.current,
  ) => {
    const target = resolveLatestCommentTarget(messageSnapshot);
    if (!target) {
      jumpToLatestFallback();
      return;
    }

    const initial = scrollToThreadAnchor(
      target.anchorId,
      { align: "end", behavior: "smooth" },
      messageSnapshot,
    );
    if (!initial) {
      jumpToLatestFallback();
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") return;

    clearLatestSettle();
    startLatestCommentSettling({
      target,
      virtualizedThreadRef,
      timeoutsRef: latestSettleTimeoutsRef,
      cleanupRef: latestSettleCleanupRef,
    });
  }, [clearLatestSettle, jumpToLatestFallback, scrollToThreadAnchor, virtualizedThreadRef]);

  return useCallback(() => {
    if (onRefreshLatestComments) {
      const refreshed = onRefreshLatestComments();
      if (refreshed && typeof (refreshed as Promise<unknown>).then === "function") {
        (refreshed as Promise<unknown>).then(
          () => scrollToLatestCommentWithSettle(latestMessagesRef.current),
          () => scrollToLatestCommentWithSettle(latestMessagesRef.current),
        );
        return;
      }
    }
    scrollToLatestCommentWithSettle(latestMessagesRef.current);
  }, [onRefreshLatestComments, scrollToLatestCommentWithSettle]);
}
