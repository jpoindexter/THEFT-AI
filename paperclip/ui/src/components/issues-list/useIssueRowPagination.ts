import { startTransition, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Issue } from "@paperclipai/shared";
import {
  INITIAL_ISSUE_ROW_RENDER_LIMIT,
  ISSUE_ROW_RENDER_BATCH_SIZE,
  ISSUE_SCROLL_LOAD_THRESHOLD_PX,
} from "./constants";
import { findIssuesScrollContainer } from "./scroll";

export function useIssueRowPagination({
  rootRef,
  issues,
  viewMode,
  isLoading,
  hasMoreIssues,
  isLoadingMoreIssues,
  onLoadMoreIssues,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  issues: Issue[];
  viewMode: "list" | "board";
  isLoading?: boolean;
  hasMoreIssues: boolean;
  isLoadingMoreIssues: boolean;
  onLoadMoreIssues?: () => void;
}) {
  const [renderedIssueRowLimit, setRenderedIssueRowLimit] = useState(INITIAL_ISSUE_ROW_RENDER_LIMIT);
  const renderedIssueIdsRef = useRef("");
  const initialServerFillRequestedRef = useRef(false);

  useEffect(() => {
    if (viewMode !== "list") return;
    const nextIssueIds = issues.map((issue) => issue.id).join("|");
    const previousIssueIds = renderedIssueIdsRef.current;
    renderedIssueIdsRef.current = nextIssueIds;

    setRenderedIssueRowLimit((current) => {
      const nextInitialLimit = Math.min(issues.length, INITIAL_ISSUE_ROW_RENDER_LIMIT);
      const listAppended = previousIssueIds.length > 0
        && nextIssueIds.startsWith(previousIssueIds)
        && issues.length >= current;
      if (listAppended) return Math.min(issues.length, Math.max(current, nextInitialLimit));
      return nextInitialLimit;
    });
  }, [issues, viewMode]);

  const hasMoreRenderedRows = viewMode === "list" && renderedIssueRowLimit < issues.length;
  const remainingIssueRowCount = Math.max(issues.length - renderedIssueRowLimit, 0);
  const loadMoreIssueRows = useCallback(() => {
    if (viewMode !== "list") return;
    if (hasMoreRenderedRows) {
      startTransition(() => {
        setRenderedIssueRowLimit((current) => Math.min(issues.length, current + ISSUE_ROW_RENDER_BATCH_SIZE));
      });
      return;
    }
    if (hasMoreIssues && !isLoadingMoreIssues) {
      onLoadMoreIssues?.();
    }
  }, [
    issues.length,
    hasMoreIssues,
    hasMoreRenderedRows,
    isLoadingMoreIssues,
    onLoadMoreIssues,
    viewMode,
  ]);

  const canLoadMoreIssues = viewMode === "list"
    && !isLoading
    && (hasMoreRenderedRows || (hasMoreIssues && !isLoadingMoreIssues));

  useEffect(() => {
    if (!canLoadMoreIssues) return;
    let animationFrameId: number | null = null;
    const scrollContainer = findIssuesScrollContainer(rootRef.current);
    const scrollTarget: Window | HTMLElement = scrollContainer ?? window;

    const checkScrollPosition = (trigger: "initial" | "scroll" | "resize" = "scroll") => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        const scrollHeight = scrollContainer?.scrollHeight ?? document.documentElement.scrollHeight;
        if (scrollHeight === 0) return;
        const viewportHeight = scrollContainer?.clientHeight ?? window.innerHeight;
        const scrollBottom = scrollContainer
          ? scrollContainer.scrollTop + scrollContainer.clientHeight
          : window.scrollY + window.innerHeight;
        const hasScrollableOverflow = scrollHeight > viewportHeight + 1;
        const threshold = scrollHeight - ISSUE_SCROLL_LOAD_THRESHOLD_PX;
        if (scrollBottom >= threshold) {
          if (trigger === "initial" && !hasMoreRenderedRows && hasMoreIssues && !hasScrollableOverflow) {
            if (initialServerFillRequestedRef.current) return;
            initialServerFillRequestedRef.current = true;
          }
          loadMoreIssueRows();
        }
      });
    };

    const handleScroll = () => checkScrollPosition("scroll");
    const handleResize = () => checkScrollPosition("resize");
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    checkScrollPosition("initial");

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, [canLoadMoreIssues, hasMoreIssues, hasMoreRenderedRows, loadMoreIssueRows, rootRef]);

  return {
    renderedIssueRowLimit,
    remainingIssueRowCount,
  };
}
