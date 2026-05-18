import { AlertTriangle, FileQuestion, Plus, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeScope } from "./searchModel";
import type { CompanySearchScope } from "@paperclipai/shared";

interface InitialSearchStateProps {
  recentSearches: string[];
  onRecentClick: (query: string) => void;
}

export function InitialSearchState({ recentSearches, onRecentClick }: InitialSearchStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold">Type to search company memory.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Issues, comments, plan documents, agents, projects — same surface, ranked by relevance.
        </p>
      </div>
      {recentSearches.length > 0 ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</div>
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {recentSearches.map((entry) => (
              <li key={entry}>
                <Button
                  type="button"
                  onClick={() => onRecentClick(entry)}
                  variant="ghost"
                  className="flex h-auto w-full justify-start gap-2 px-3 py-2 text-left text-sm"
                >
                  <SearchIcon className="size-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{entry}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Identifier lookup:</span> type{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">PAP-123</code> to jump straight to an issue.
        </li>
        <li>
          <span className="font-medium text-foreground">Quoted phrases:</span> wrap a phrase in quotes to match the
          exact sequence.
        </li>
        <li>
          <span className="font-medium text-foreground">⌘K:</span> reopens the command palette pre-seeded with your
          current query.
        </li>
      </ul>
    </div>
  );
}

interface SearchErrorStateProps {
  apiError: { message: string; status?: number } | null;
  onRetry: () => void;
  onNavigateIssuesFallback: () => void;
}

export function SearchErrorState({ apiError, onRetry, onNavigateIssuesFallback }: SearchErrorStateProps) {
  const status = apiError?.status;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <div className="text-base font-semibold">Couldn’t run that search</div>
      <p className="text-sm text-muted-foreground">
        {status ? `The server returned ${status}.` : "The request failed."} Your input and filters are still here, so
        you can retry or fall back to the Issues filter.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onRetry} variant="default" size="sm">
          Retry
        </Button>
        <Button onClick={onNavigateIssuesFallback} variant="outline" size="sm">
          Open Issues filter view
        </Button>
      </div>
    </div>
  );
}

interface SearchEmptyStateProps {
  trimmedQuery: string;
  scope: CompanySearchScope;
  onShowAllScope: () => void;
  onOpenNewIssue: () => void;
  onNavigateIssuesFallback: () => void;
}

export function SearchEmptyState({
  trimmedQuery,
  scope,
  onShowAllScope,
  onOpenNewIssue,
  onNavigateIssuesFallback,
}: SearchEmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <FileQuestion className="size-10 text-muted-foreground" aria-hidden />
      <div className="text-base font-semibold">No results for &ldquo;{trimmedQuery}&rdquo;</div>
      <p className="text-sm text-muted-foreground">
        We couldn’t find a match in {describeScope(scope).toLowerCase()}. Try widening the scope or rephrasing your
        query.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {scope !== "all" ? (
          <Button onClick={onShowAllScope} size="sm" variant="outline">
            Search all scopes
          </Button>
        ) : null}
        <Button onClick={onOpenNewIssue} size="sm" variant="default">
          <Plus className="size-4" />
          Create issue from this query
        </Button>
        <Button onClick={onNavigateIssuesFallback} size="sm" variant="ghost">
          Open Issues filter view
        </Button>
      </div>
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <li>Try fewer tokens or a single distinctive term.</li>
        <li>Use an identifier shortcut like <code className="rounded bg-muted px-1 py-0.5">PAP-123</code>.</li>
        <li>Wrap multi-word phrases in quotes.</li>
      </ul>
    </div>
  );
}
