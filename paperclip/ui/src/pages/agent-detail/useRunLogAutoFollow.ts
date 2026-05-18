import { useCallback, useEffect, useRef, useState } from "react";
import {
  findScrollContainer,
  isWindowContainer,
  LIVE_SCROLL_BOTTOM_TOLERANCE_PX,
  readScrollMetrics,
  scrollToContainerBottom,
  type ScrollContainer,
} from "./runLogScroll";

export function useRunLogAutoFollow({
  eventCount,
  isLive,
  logLineCount,
  runId,
}: {
  eventCount: number;
  isLive: boolean;
  logLineCount: number;
  runId: number | string;
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<ScrollContainer | null>(null);
  const isFollowingRef = useRef(false);
  const lastMetricsRef = useRef({
    scrollHeight: 0,
    distanceFromBottom: Number.POSITIVE_INFINITY,
  });

  const getScrollContainer = useCallback((): ScrollContainer => {
    if (scrollContainerRef.current) return scrollContainerRef.current;
    const container = findScrollContainer(logEndRef.current);
    scrollContainerRef.current = container;
    return container;
  }, []);

  const updateFollowingState = useCallback(() => {
    const container = getScrollContainer();
    const metrics = readScrollMetrics(container);
    lastMetricsRef.current = metrics;
    const nearBottom = metrics.distanceFromBottom <= LIVE_SCROLL_BOTTOM_TOLERANCE_PX;
    isFollowingRef.current = nearBottom;
    setIsFollowing((prev) => (prev === nearBottom ? prev : nearBottom));
  }, [getScrollContainer]);

  const jumpToLive = useCallback(() => {
    const container = getScrollContainer();
    isFollowingRef.current = true;
    setIsFollowing(true);
    scrollToContainerBottom(container, "auto");
    lastMetricsRef.current = readScrollMetrics(container);
  }, [getScrollContainer]);

  useEffect(() => {
    scrollContainerRef.current = null;
    lastMetricsRef.current = {
      scrollHeight: 0,
      distanceFromBottom: Number.POSITIVE_INFINITY,
    };
    if (!isLive) {
      isFollowingRef.current = false;
      setIsFollowing(false);
      return;
    }
    updateFollowingState();
  }, [isLive, runId, updateFollowingState]);

  useEffect(() => {
    if (!isLive) return;
    const container = getScrollContainer();
    updateFollowingState();

    const target = isWindowContainer(container) ? window : container;
    target.addEventListener("scroll", updateFollowingState, { passive: true });
    window.addEventListener("resize", updateFollowingState);
    return () => {
      target.removeEventListener("scroll", updateFollowingState);
      window.removeEventListener("resize", updateFollowingState);
    };
  }, [isLive, runId, getScrollContainer, updateFollowingState]);

  useEffect(() => {
    if (!isLive || !isFollowingRef.current) return;

    const container = getScrollContainer();
    const previous = lastMetricsRef.current;
    const current = readScrollMetrics(container);
    const growth = Math.max(0, current.scrollHeight - previous.scrollHeight);
    const movedAwayBy = current.distanceFromBottom - (previous.distanceFromBottom + growth);

    if (movedAwayBy > LIVE_SCROLL_BOTTOM_TOLERANCE_PX) {
      isFollowingRef.current = false;
      setIsFollowing(false);
      lastMetricsRef.current = current;
      return;
    }

    scrollToContainerBottom(container, "auto");
    lastMetricsRef.current = readScrollMetrics(container);
    isFollowingRef.current = true;
    setIsFollowing((prev) => (prev ? prev : true));
  }, [eventCount, logLineCount, isLive, getScrollContainer]);

  return { isFollowing, jumpToLive, logEndRef };
}
