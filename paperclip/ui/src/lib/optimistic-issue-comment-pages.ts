import type { IssueComment } from "@paperclipai/shared";

function toTimestamp(value: Date | string) {
  return new Date(value).getTime();
}

function sortIssueComments<T extends { createdAt: Date | string; id: string }>(comments: T[]) {
  return [...comments].sort((a, b) => {
    const createdAtDiff = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
    if (createdAtDiff !== 0) return createdAtDiff;
    return a.id.localeCompare(b.id);
  });
}

function sortIssueCommentsDesc<T extends { createdAt: Date | string; id: string }>(comments: T[]) {
  return sortIssueComments(comments).reverse();
}

export function flattenIssueCommentPages(
  pages: ReadonlyArray<ReadonlyArray<IssueComment>> | undefined,
): IssueComment[] {
  return sortIssueComments((pages ?? []).flatMap((page) => page));
}

export function getNextIssueCommentPageParam(
  lastPage: ReadonlyArray<IssueComment> | undefined,
  pageSize: number,
): string | undefined {
  if (!lastPage || lastPage.length < pageSize) return undefined;
  return lastPage[lastPage.length - 1]?.id;
}

function getNextPageCursor<T extends { id: string }>(
  lastPage: ReadonlyArray<T> | undefined,
  pageSize: number,
): string | undefined {
  if (!lastPage || lastPage.length < pageSize) return undefined;
  return lastPage[lastPage.length - 1]?.id;
}

export async function loadRemainingIssueCommentPages<T extends { id: string }>(params: {
  pages: ReadonlyArray<ReadonlyArray<T>> | undefined;
  pageParams: ReadonlyArray<string | null> | undefined;
  pageSize: number;
  maxPages?: number;
  fetchPage: (afterCommentId: string) => Promise<ReadonlyArray<T>>;
}): Promise<{ pages: T[][]; pageParams: Array<string | null> }> {
  const pages = (params.pages ?? []).map((page) => [...page]);
  const pageParams = params.pageParams
    ? [...params.pageParams].slice(0, pages.length)
    : pages.map(() => null);

  while (pageParams.length < pages.length) {
    pageParams.push(null);
  }

  if (params.pageSize <= 0) return { pages, pageParams };

  let cursor = getNextPageCursor(pages[pages.length - 1], params.pageSize);
  const maxPages = Math.max(0, params.maxPages ?? Number.POSITIVE_INFINITY);
  const seenCursors = new Set<string>();
  while (cursor && !seenCursors.has(cursor) && seenCursors.size < maxPages) {
    seenCursors.add(cursor);
    const nextPage = [...await params.fetchPage(cursor)];
    pages.push(nextPage);
    pageParams.push(cursor);

    cursor = getNextPageCursor(nextPage, params.pageSize);
  }

  return { pages, pageParams };
}

export function shouldAutoloadOlderIssueComments(params: {
  activeDetailTab: string;
  hasOlderComments: boolean;
  loadedCommentCount: number;
  initialPageLoading: boolean;
  olderPageLoading: boolean;
  autoLoadLimit: number;
}) {
  if (params.activeDetailTab !== "chat") return false;
  if (!params.hasOlderComments) return false;
  if (params.initialPageLoading || params.olderPageLoading) return false;
  if (params.loadedCommentCount === 0) return false;
  return params.loadedCommentCount < params.autoLoadLimit;
}

export function upsertIssueCommentInPages(
  pages: ReadonlyArray<ReadonlyArray<IssueComment>> | undefined,
  nextComment: IssueComment,
): IssueComment[][] {
  if (!pages || pages.length === 0) {
    return [[nextComment]];
  }

  const nextPages = pages.map((page) => [...page]);
  for (let pageIndex = 0; pageIndex < nextPages.length; pageIndex += 1) {
    const existingIndex = nextPages[pageIndex]!.findIndex((comment) => comment.id === nextComment.id);
    if (existingIndex === -1) continue;
    nextPages[pageIndex]![existingIndex] = nextComment;
    nextPages[pageIndex] = sortIssueCommentsDesc(nextPages[pageIndex]!);
    return nextPages;
  }

  nextPages[0] = sortIssueCommentsDesc([...nextPages[0]!, nextComment]);
  return nextPages;
}

export function removeIssueCommentFromPages(
  pages: ReadonlyArray<ReadonlyArray<IssueComment>> | undefined,
  commentId: string,
): IssueComment[][] {
  if (!pages || pages.length === 0) {
    return [];
  }

  return pages
    .map((page) => page.filter((comment) => comment.id !== commentId))
    .filter((page) => page.length > 0);
}
