import { useMemo } from "react";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import type { IssueComment } from "@paperclipai/shared";

import { issuesApi } from "@/api/issues";
import { queryKeys } from "@/lib/queryKeys";
import { keepPreviousDataForSameQueryTail } from "@/lib/query-placeholder-data";
import {
  flattenIssueCommentPages,
  getNextIssueCommentPageParam,
  shouldAutoloadOlderIssueComments,
} from "@/lib/optimistic-issue-comments";

export const ISSUE_COMMENT_PAGE_SIZE = 50;
export const ISSUE_COMMENT_AUTOLOAD_LIMIT = ISSUE_COMMENT_PAGE_SIZE * 3;
export const JUMP_TO_LATEST_MAX_COMMENT_PAGES = 10;

type UseIssueDetailCommentsInput = {
  issueId?: string;
  activeDetailTab: string;
};

export function useIssueDetailComments({
  issueId,
  activeDetailTab,
}: UseIssueDetailCommentsInput) {
  const {
    data: commentPages,
    isLoading: commentsLoading,
    isFetchingNextPage: commentsLoadingOlder,
    hasNextPage: hasOlderComments,
    fetchNextPage: fetchOlderComments,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: queryKeys.issues.comments(issueId!),
    queryFn: ({ pageParam }) =>
      issuesApi.listComments(issueId!, {
        order: "desc",
        limit: ISSUE_COMMENT_PAGE_SIZE,
        ...(pageParam ? { after: pageParam } : {}),
      }),
    enabled: !!issueId,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      getNextIssueCommentPageParam(lastPage, ISSUE_COMMENT_PAGE_SIZE),
    placeholderData: keepPreviousDataForSameQueryTail<InfiniteData<IssueComment[], string | null>>(
      issueId ?? "pending",
    ),
  });
  const comments = useMemo(
    () => flattenIssueCommentPages(commentPages?.pages),
    [commentPages?.pages],
  );
  const shouldPrefetchOlderComments = useMemo(
    () =>
      shouldAutoloadOlderIssueComments({
        activeDetailTab,
        hasOlderComments: hasOlderComments ?? false,
        loadedCommentCount: comments.length,
        initialPageLoading: commentsLoading,
        olderPageLoading: commentsLoadingOlder,
        autoLoadLimit: ISSUE_COMMENT_AUTOLOAD_LIMIT,
      }),
    [activeDetailTab, comments.length, commentsLoading, commentsLoadingOlder, hasOlderComments],
  );

  return {
    comments,
    commentsLoading,
    commentsLoadingOlder,
    hasOlderComments,
    fetchOlderComments,
    refetchComments,
    shouldPrefetchOlderComments,
  };
}
