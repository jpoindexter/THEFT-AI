import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import { issuesApi } from "@/api/issues";
import { queryKeys } from "@/lib/queryKeys";

const LIBRARY_ISSUE_LIMIT = 8;

export function useDashboardLibraryDocuments({
  selectedCompanyId,
  issues,
}: {
  selectedCompanyId: string | null | undefined;
  issues: Issue[] | undefined;
}) {
  const libraryIssueCandidates = useMemo(
    () =>
      [...(issues ?? [])]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, LIBRARY_ISSUE_LIMIT),
    [issues],
  );

  const libraryDocumentQueries = useQueries({
    queries: libraryIssueCandidates.map((issue) => ({
      queryKey: queryKeys.issues.documents(issue.id),
      queryFn: () => issuesApi.listDocuments(issue.id),
      enabled: !!selectedCompanyId,
    })),
  });

  return useMemo(
    () =>
      libraryIssueCandidates
        .flatMap((issue, index) =>
          (libraryDocumentQueries[index]?.data ?? []).map((document) => ({ issue, document })),
        )
        .sort((a, b) => new Date(b.document.updatedAt).getTime() - new Date(a.document.updatedAt).getTime())
        .slice(0, 4),
    [libraryDocumentQueries, libraryIssueCandidates],
  );
}
