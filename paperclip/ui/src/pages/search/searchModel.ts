import {
  COMPANY_SEARCH_SCOPES,
  type CompanySearchResult,
  type CompanySearchScope,
} from "@paperclipai/shared";

export const SEARCH_DEBOUNCE_MS = 250;
export const IDENTIFIER_PATTERN = /^[A-Z]+-\d+$/;

export const SCOPE_LABELS: Record<CompanySearchScope, string> = {
  all: "All",
  issues: "Issues",
  comments: "Comments",
  documents: "Documents",
  agents: "Agents",
  projects: "Projects",
};

export type SearchSubGroupKey = "issues" | "comments" | "documents" | "agents" | "projects";

export interface SearchSubGroup {
  key: SearchSubGroupKey;
  results: CompanySearchResult[];
}

export const SUBGROUP_LABELS: Record<SearchSubGroupKey, string> = {
  issues: "Issues",
  comments: "Comments",
  documents: "Documents",
  agents: "Agents",
  projects: "Projects",
};

const SUBGROUP_ORDER: SearchSubGroupKey[] = ["issues", "comments", "documents", "agents", "projects"];

function classifyResult(result: CompanySearchResult): SearchSubGroupKey {
  if (result.type === "agent") return "agents";
  if (result.type === "project") return "projects";
  const matched = new Set(result.matchedFields);
  if (matched.has("title") || matched.has("identifier") || matched.has("description")) return "issues";
  if (matched.has("comment")) return "comments";
  if (matched.has("document")) return "documents";
  return "issues";
}

export function buildSubgroups(results: CompanySearchResult[]): SearchSubGroup[] {
  const buckets = new Map<SearchSubGroupKey, CompanySearchResult[]>();
  for (const result of results) {
    const key = classifyResult(result);
    const list = buckets.get(key) ?? [];
    list.push(result);
    buckets.set(key, list);
  }
  return SUBGROUP_ORDER.filter((key) => (buckets.get(key)?.length ?? 0) > 0).map((key) => ({
    key,
    results: buckets.get(key) ?? [],
  }));
}

export function isCompanySearchScope(value: string | null): value is CompanySearchScope {
  return Boolean(value) && (COMPANY_SEARCH_SCOPES as readonly string[]).includes(value as string);
}

export function describeScope(scope: CompanySearchScope) {
  if (scope === "all") return "All scopes";
  return SCOPE_LABELS[scope];
}

export function buildSearchUrl(href: string, query: string, scope: CompanySearchScope): string {
  const url = new URL(href);
  if (query.length === 0) {
    url.searchParams.delete("q");
  } else {
    url.searchParams.set("q", query);
  }
  if (scope === "all") {
    url.searchParams.delete("scope");
  } else {
    url.searchParams.set("scope", scope);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function shapeError(error: unknown): { message: string; status?: number } {
  if (!error) return { message: "Unknown error" };
  if (error instanceof Error) {
    const status = (error as Error & { status?: number }).status;
    return { message: error.message, status: typeof status === "number" ? status : undefined };
  }
  return { message: String(error) };
}
