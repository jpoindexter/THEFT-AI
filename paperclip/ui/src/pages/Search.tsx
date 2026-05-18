import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  COMPANY_SEARCH_DEFAULT_LIMIT,
  COMPANY_SEARCH_SCOPES,
  type CompanySearchResponse,
  type CompanySearchScope,
} from "@paperclipai/shared";
import type { Agent } from "@paperclipai/shared";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "@/lib/router";
import { agentsApi } from "../api/agents";
import { searchApi } from "../api/search";
import { PageTabBar, type PageTabItem } from "../components/PageTabBar";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { queryKeys } from "../lib/queryKeys";
import { loadRecentSearches, pushRecentSearch } from "../lib/recent-searches";
import { SearchHeader } from "./search/SearchHeader";
import { SearchTabContent } from "./search/SearchTabContent";
import {
  IDENTIFIER_PATTERN,
  SEARCH_DEBOUNCE_MS,
  SCOPE_LABELS,
  buildSearchUrl,
  buildSubgroups,
  isCompanySearchScope,
  shapeError,
} from "./search/searchModel";

export { buildSearchUrl } from "./search/searchModel";

export function Search() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openNewIssue } = useDialogActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const urlScopeRaw = searchParams.get("scope");
  const urlScope: CompanySearchScope = isCompanySearchScope(urlScopeRaw) ? urlScopeRaw : "all";

  const [draftQuery, setDraftQuery] = useState(urlQuery);
  const [committedQuery, setCommittedQuery] = useState(urlQuery);
  const [scope, setScope] = useState<CompanySearchScope>(urlScope);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastUrlSyncRef = useRef<string>("");
  const lastIdentifierRedirectRef = useRef<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Search" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    setRecentSearches(loadRecentSearches(selectedCompanyId));
  }, [selectedCompanyId]);

  useEffect(() => {
    setDraftQuery(urlQuery);
    setCommittedQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setScope(urlScope);
  }, [urlScope]);

  useEffect(() => {
    if (draftQuery === committedQuery) return;
    const handle = window.setTimeout(() => {
      setCommittedQuery(draftQuery);
      if (typeof window !== "undefined") {
        const next = buildSearchUrl(window.location.href, draftQuery, scope);
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== current && next !== lastUrlSyncRef.current) {
          lastUrlSyncRef.current = next;
          window.history.replaceState(window.history.state, "", next);
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draftQuery, committedQuery, scope]);

  const handleScopeChange = useCallback(
    (next: string) => {
      if (!isCompanySearchScope(next) || next === scope) return;
      setScope(next);
      if (typeof window !== "undefined") {
        const url = buildSearchUrl(window.location.href, committedQuery, next);
        window.history.pushState(window.history.state, "", url);
      }
    },
    [committedQuery, scope],
  );

  const trimmedQuery = committedQuery.trim();
  const queryEnabled = !!selectedCompanyId && trimmedQuery.length > 0;

  const { data, isFetching, error, refetch } = useQuery<CompanySearchResponse>({
    queryKey: queryKeys.companySearch.search(
      selectedCompanyId ?? "__no-company__",
      trimmedQuery,
      scope,
      COMPANY_SEARCH_DEFAULT_LIMIT,
      0,
    ),
    queryFn: () =>
      searchApi.search(selectedCompanyId!, {
        q: trimmedQuery,
        scope,
        limit: COMPANY_SEARCH_DEFAULT_LIMIT,
      }),
    enabled: queryEnabled,
    placeholderData: (previousData) => previousData,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const agentsById = useMemo<ReadonlyMap<string, Pick<Agent, "id" | "name">>>(() => {
    const map = new Map<string, Pick<Agent, "id" | "name">>();
    for (const agent of agents ?? []) map.set(agent.id, agent);
    return map;
  }, [agents]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    if (!data || !trimmedQuery) return;
    setRecentSearches(pushRecentSearch(selectedCompanyId, trimmedQuery));
  }, [data, trimmedQuery, selectedCompanyId]);

  useEffect(() => {
    if (!data) return;
    const upper = trimmedQuery.toUpperCase();
    if (!IDENTIFIER_PATTERN.test(upper) || lastIdentifierRedirectRef.current === upper) return;
    const exact = data.results.find(
      (result) => result.type === "issue" && result.issue?.identifier?.toUpperCase() === upper,
    );
    if (!exact?.issue) return;
    lastIdentifierRedirectRef.current = upper;
    const baseHref = exact.href.split("#")[0] ?? exact.href;
    navigate(baseHref.startsWith("/") ? baseHref : `/${baseHref}`, { replace: true });
  }, [data, navigate, trimmedQuery]);

  const handleClear = useCallback(() => {
    setDraftQuery("");
    setCommittedQuery("");
    inputRef.current?.focus();
    if (typeof window !== "undefined") {
      const next = buildSearchUrl(window.location.href, "", scope);
      window.history.replaceState(window.history.state, "", next);
    }
  }, [scope]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (target?.isContentEditable || tag === "input" || tag === "textarea") return;
      event.preventDefault();
      focusInput();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusInput]);

  const counts = data?.countsByType ?? { issue: 0, agent: 0, project: 0 };
  const totalResults = data?.results.length ?? 0;
  const tabItems = useSearchTabItems(counts, !!data);
  const subgroups = useMemo(() => buildSubgroups(data?.results ?? []), [data?.results]);

  function navigateIssuesFallback() {
    navigate(`/issues?q=${encodeURIComponent(trimmedQuery)}`);
  }

  function handleRecentClick(value: string) {
    setDraftQuery(value);
    setCommittedQuery(value);
    if (typeof window !== "undefined") {
      const next = buildSearchUrl(window.location.href, value, scope);
      window.history.replaceState(window.history.state, "", next);
    }
  }

  function showAllScope() {
    if (scope !== "all") handleScopeChange("all");
  }

  const isLoading = queryEnabled && isFetching && !data;
  const hasResults = !!data && totalResults > 0;
  const isEmpty = !!data && !isFetching && totalResults === 0;
  const hasError = !!error && !isLoading;

  return (
    <div className="flex h-full min-h-0 flex-col" data-page="search">
      <SearchHeader
        inputRef={inputRef}
        draftQuery={draftQuery}
        onDraftQueryChange={setDraftQuery}
        onClear={handleClear}
      />
      <Tabs value={scope} onValueChange={handleScopeChange} className="flex h-full min-h-0 flex-col">
        <div className="border-b border-border px-2 sm:px-4">
          <PageTabBar items={tabItems} value={scope} onValueChange={handleScopeChange} align="start" />
        </div>
        {COMPANY_SEARCH_SCOPES.map((scopeValue) => (
          <TabsContent key={scopeValue} value={scopeValue} className="flex h-full min-h-0 flex-col overflow-y-auto">
            {scopeValue === scope ? (
              <SearchTabContent
                showInitialState={!trimmedQuery}
                isLoading={isLoading}
                hasResults={hasResults}
                hasError={hasError}
                apiError={hasError ? shapeError(error) : null}
                isEmpty={isEmpty}
                trimmedQuery={trimmedQuery}
                scope={scope}
                showAllScope={showAllScope}
                navigateIssuesFallback={navigateIssuesFallback}
                openNewIssue={() => openNewIssue({ title: trimmedQuery })}
                refetch={() => void refetch()}
                recentSearches={recentSearches}
                onRecentClick={handleRecentClick}
                subgroups={subgroups}
                totalResults={totalResults}
                isFetching={isFetching && !!data}
                agentsById={agentsById}
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function useSearchTabItems(counts: { issue?: number; agent?: number; project?: number }, hasData: boolean) {
  return useMemo<PageTabItem[]>(() => {
    function pill(value: number) {
      if (!hasData) return null;
      return (
        <Badge variant="outline" className="ml-1.5 px-1.5 py-0 text-xs tabular-nums font-normal">
          {value}
        </Badge>
      );
    }

    const issuesTotal = counts.issue ?? 0;
    return COMPANY_SEARCH_SCOPES.map((value) => {
      let count: number | null = null;
      if (value === "all") count = (counts.issue ?? 0) + (counts.agent ?? 0) + (counts.project ?? 0);
      else if (value === "issues") count = issuesTotal;
      else if (value === "agents") count = counts.agent ?? 0;
      else if (value === "projects") count = counts.project ?? 0;
      return {
        value,
        label: (
          <span className="flex items-center">
            {SCOPE_LABELS[value as CompanySearchScope]}
            {count !== null ? pill(count) : null}
          </span>
        ),
      } satisfies PageTabItem;
    });
  }, [counts, hasData]);
}
