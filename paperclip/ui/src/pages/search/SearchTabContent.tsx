import type { Agent, CompanySearchScope } from "@paperclipai/shared";
import { SearchLoadingState } from "./SearchLoadingState";
import { InitialSearchState, SearchEmptyState, SearchErrorState } from "./SearchStateViews";
import { SearchResults } from "./SearchResults";
import type { SearchSubGroup } from "./searchModel";

interface SearchTabContentProps {
  showInitialState: boolean;
  isLoading: boolean;
  hasResults: boolean;
  hasError: boolean;
  apiError: { message: string; status?: number } | null;
  isEmpty: boolean;
  trimmedQuery: string;
  scope: CompanySearchScope;
  showAllScope: () => void;
  navigateIssuesFallback: () => void;
  openNewIssue: () => void;
  refetch: () => void;
  recentSearches: string[];
  onRecentClick: (query: string) => void;
  subgroups: SearchSubGroup[];
  totalResults: number;
  isFetching: boolean;
  agentsById: ReadonlyMap<string, Pick<Agent, "id" | "name">>;
}

export function SearchTabContent({
  showInitialState,
  isLoading,
  hasResults,
  hasError,
  apiError,
  isEmpty,
  trimmedQuery,
  scope,
  showAllScope,
  navigateIssuesFallback,
  openNewIssue,
  refetch,
  recentSearches,
  onRecentClick,
  subgroups,
  totalResults,
  isFetching,
  agentsById,
}: SearchTabContentProps) {
  if (showInitialState) {
    return <InitialSearchState recentSearches={recentSearches} onRecentClick={onRecentClick} />;
  }

  if (hasError) {
    return <SearchErrorState apiError={apiError} onRetry={refetch} onNavigateIssuesFallback={navigateIssuesFallback} />;
  }

  if (isLoading) {
    return <SearchLoadingState trimmedQuery={trimmedQuery} />;
  }

  if (isEmpty) {
    return (
      <SearchEmptyState
        trimmedQuery={trimmedQuery}
        scope={scope}
        onShowAllScope={showAllScope}
        onOpenNewIssue={openNewIssue}
        onNavigateIssuesFallback={navigateIssuesFallback}
      />
    );
  }

  if (!hasResults) return null;

  return (
    <SearchResults
      scope={scope}
      subgroups={subgroups}
      totalResults={totalResults}
      isFetching={isFetching}
      agentsById={agentsById}
    />
  );
}
