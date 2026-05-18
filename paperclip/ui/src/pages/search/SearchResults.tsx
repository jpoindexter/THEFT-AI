import type { Agent, CompanySearchResult, CompanySearchScope } from "@paperclipai/shared";
import { cn } from "@/lib/utils";
import { IssueGroupHeader } from "../../components/IssueGroupHeader";
import { SearchResultRow } from "../../components/search/SearchResultRow";
import { SUBGROUP_LABELS, type SearchSubGroup } from "./searchModel";

interface SearchResultsProps {
  scope: CompanySearchScope;
  subgroups: SearchSubGroup[];
  totalResults: number;
  isFetching: boolean;
  agentsById: ReadonlyMap<string, Pick<Agent, "id" | "name">>;
}

export function SearchResults({ scope, subgroups, totalResults, isFetching, agentsById }: SearchResultsProps) {
  const rows = subgroups.flatMap((group) => group.results);
  return (
    <div className="flex w-full max-w-5xl flex-col px-2 sm:px-4" data-testid="search-results">
      <div className="flex items-center justify-between py-2 text-xs uppercase tracking-wide text-muted-foreground">
        <span>
          {totalResults === 1 ? "1 result" : `${totalResults} results`} · sorted by relevance
        </span>
        {isFetching ? (
          <span aria-live="polite" className="normal-case tracking-normal">
            Updating…
          </span>
        ) : null}
      </div>
      <div className="flex flex-col pb-10">
        {scope === "all" ? (
          <GroupedSearchResults subgroups={subgroups} agentsById={agentsById} />
        ) : (
          <SearchResultRows results={rows} agentsById={agentsById} />
        )}
      </div>
    </div>
  );
}

function GroupedSearchResults({
  subgroups,
  agentsById,
}: {
  subgroups: SearchSubGroup[];
  agentsById: ReadonlyMap<string, Pick<Agent, "id" | "name">>;
}) {
  return (
    <>
      {subgroups.map((group, groupIndex) => (
        <section key={group.key} aria-label={SUBGROUP_LABELS[group.key]} className={cn("flex flex-col", groupIndex > 0 && "mt-6")}>
          <IssueGroupHeader
            label={SUBGROUP_LABELS[group.key]}
            trailing={<span className="text-xs font-normal tabular-nums text-muted-foreground">{group.results.length}</span>}
            className="pb-1 pt-2 text-xs tracking-wider text-muted-foreground"
          />
          <SearchResultRows results={group.results} agentsById={agentsById} />
        </section>
      ))}
    </>
  );
}

function SearchResultRows({
  results,
  agentsById,
}: {
  results: CompanySearchResult[];
  agentsById: ReadonlyMap<string, Pick<Agent, "id" | "name">>;
}) {
  return (
    <div className="flex flex-col gap-y-1">
      {results.map((result) => (
        <SearchResultRow key={`${result.type}:${result.id}:${result.href}`} result={result} agentsById={agentsById} />
      ))}
    </div>
  );
}
