import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueDocument } from "@paperclipai/shared";
import {
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  Folder,
  Library as LibraryIcon,
  Pin,
  PinOff,
  RefreshCw,
  Save,
  Search,
  Star,
} from "lucide-react";
import { agentsApi } from "../api/agents";
import { issuesApi } from "../api/issues";
import { EmptyState } from "../components/EmptyState";
import { MarkdownBody } from "../components/MarkdownBody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import {
  buildLibraryItems,
  groupLibraryItemsByDepartment,
  THEFT_DEPARTMENTS,
  type LibraryItem,
  type LibraryIssueBundle,
} from "../lib/library-items";
import { queryKeys } from "../lib/queryKeys";
import { cn, formatDateTime, relativeTime } from "../lib/utils";

const LIBRARY_ISSUE_LIMIT = 500;

function pinnedStorageKey(companyId: string) {
  return `theft:library:pinned:${companyId}`;
}

function loadPinnedIds(companyId: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(pinnedStorageKey(companyId)) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function savePinnedIds(companyId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(pinnedStorageKey(companyId), JSON.stringify(Array.from(ids)));
}

function itemKindLabel(item: LibraryItem) {
  if (item.kind === "document") return "Document";
  if (item.kind === "attachment") return "Attachment";
  return "Work product";
}

function itemIcon(item: LibraryItem) {
  if (item.kind === "attachment") return FileArchive;
  if (item.kind === "work_product") return Star;
  return FileText;
}

function formatBytes(bytes: number | undefined) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadLibraryBundles(companyId: string): Promise<LibraryIssueBundle[]> {
  const issues = await issuesApi.list(companyId, {
    includeRoutineExecutions: true,
    limit: LIBRARY_ISSUE_LIMIT,
  });

  return Promise.all(
    issues.map(async (issue) => {
      const [documents, attachments, workProducts] = await Promise.all([
        issuesApi.listDocuments(issue.id),
        issuesApi.listAttachments(issue.id),
        issuesApi.listWorkProducts(issue.id),
      ]);
      return { issue, documents, attachments, workProducts };
    }),
  );
}

export function Library() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => new Set());
  const [documentDraft, setDocumentDraft] = useState("");
  const [editingDocument, setEditingDocument] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Library" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setPinnedIds(new Set());
      return;
    }
    setPinnedIds(loadPinnedIds(selectedCompanyId));
  }, [selectedCompanyId]);

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const {
    data: bundles,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: queryKeys.library.items(selectedCompanyId!),
    queryFn: () => loadLibraryBundles(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const allItems = useMemo(
    () => buildLibraryItems(bundles ?? [], agents ?? []),
    [agents, bundles],
  );
  const selectedItem = allItems.find((item) => item.id === selectedItemId) ?? allItems[0] ?? null;

  useEffect(() => {
    if (selectedItemId && allItems.some((item) => item.id === selectedItemId)) return;
    setSelectedItemId(allItems[0]?.id ?? null);
  }, [allItems, selectedItemId]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allItems.filter((item) => {
      if (departmentFilter !== "all" && item.departmentKey !== departmentFilter) return false;
      if (!normalizedSearch) return true;
      return [
        item.title,
        item.subtitle,
        item.issueTitle,
        item.issueIdentifier ?? "",
        item.department,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [allItems, departmentFilter, search]);

  const pinnedItems = filteredItems.filter((item) => pinnedIds.has(item.id) || item.isImportant);
  const groups = groupLibraryItemsByDepartment(filteredItems);
  const departmentOptions = useMemo(() => {
    const present = new Set(allItems.map((item) => item.department));
    return THEFT_DEPARTMENTS.filter((department) => present.has(department));
  }, [allItems]);

  const selectedDocumentQuery = useQuery({
    queryKey: selectedItem?.kind === "document" && selectedItem.key
      ? queryKeys.issues.document(selectedItem.issueId, selectedItem.key)
      : ["library", "document", "__idle__"],
    queryFn: async () => {
      if (!selectedItem || selectedItem.kind !== "document" || !selectedItem.key) return null;
      return issuesApi.getDocument(selectedItem.issueId, selectedItem.key);
    },
    enabled: Boolean(selectedItem?.kind === "document" && selectedItem.key),
  });

  useEffect(() => {
    if (selectedDocumentQuery.data) {
      setDocumentDraft(selectedDocumentQuery.data.body);
      setEditingDocument(false);
    } else if (selectedItem?.kind !== "document") {
      setDocumentDraft("");
      setEditingDocument(false);
    }
  }, [selectedDocumentQuery.data, selectedItem?.id, selectedItem?.kind]);

  const saveDocument = useMutation({
    mutationFn: async (document: IssueDocument) =>
      issuesApi.upsertDocument(document.issueId, document.key, {
        title: document.title,
        format: "markdown",
        body: documentDraft,
        baseRevisionId: document.latestRevisionId,
      }),
    onSuccess: (document) => {
      setEditingDocument(false);
      queryClient.setQueryData(queryKeys.issues.document(document.issueId, document.key), document);
      queryClient.invalidateQueries({ queryKey: queryKeys.library.items(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.documents(document.issueId) });
    },
  });

  function togglePin(item: LibraryItem) {
    if (!selectedCompanyId) return;
    const next = new Set(pinnedIds);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    setPinnedIds(next);
    savePinnedIds(selectedCompanyId, next);
  }

  if (!selectedCompanyId) {
    return <EmptyState icon={LibraryIcon} message="Select a company to view the Library." />;
  }

  return (
    <div className="h-full min-h-0 bg-background">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paperclip documents, attachments, and work products grouped by THEFT department.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.library.items(selectedCompanyId) })}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Library"
              className="pl-9"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department.toLowerCase()}>
                {department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <EmptyState icon={LibraryIcon} message={(error as Error).message || "Could not load Library items."} />
      ) : isLoading ? (
        <div className="p-5 text-sm text-muted-foreground">Loading Library...</div>
      ) : allItems.length === 0 ? (
        <EmptyState icon={LibraryIcon} message="No Library items yet. Run a task or add an issue document to create one." />
      ) : (
        <div className="grid h-[calc(100vh-11rem)] min-h-[640px] grid-cols-1 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-h-0 overflow-y-auto border-r border-border p-4">
            {pinnedItems.length > 0 ? (
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Pin className="h-3.5 w-3.5" />
                  Pinned and important
                </div>
                <div className="space-y-2">
                  {pinnedItems.slice(0, 6).map((item) => (
                    <LibraryRow
                      key={item.id}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      pinned={pinnedIds.has(item.id)}
                      onSelect={() => setSelectedItemId(item.id)}
                      onTogglePin={() => togglePin(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {groups.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No Library items match this filter.</div>
            ) : (
              <div className="space-y-5">
                {groups.map((group) => (
                  <div key={group.departmentKey}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                      <Folder className="h-3.5 w-3.5" />
                      {group.department}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{group.items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <LibraryRow
                          key={item.id}
                          item={item}
                          selected={selectedItem?.id === item.id}
                          pinned={pinnedIds.has(item.id)}
                          onSelect={() => setSelectedItemId(item.id)}
                          onTogglePin={() => togglePin(item)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="min-h-0 overflow-y-auto p-5">
            {selectedItem ? (
              <LibraryDetail
                item={selectedItem}
                pinned={pinnedIds.has(selectedItem.id)}
                onTogglePin={() => togglePin(selectedItem)}
                document={selectedDocumentQuery.data ?? null}
                documentLoading={selectedDocumentQuery.isLoading}
                documentDraft={documentDraft}
                onDocumentDraftChange={setDocumentDraft}
                editingDocument={editingDocument}
                onEditDocument={() => setEditingDocument(true)}
                onCancelDocumentEdit={() => {
                  setEditingDocument(false);
                  setDocumentDraft(selectedDocumentQuery.data?.body ?? "");
                }}
                onSaveDocument={() => {
                  if (selectedDocumentQuery.data) saveDocument.mutate(selectedDocumentQuery.data);
                }}
                saveError={saveDocument.error as Error | null}
                saving={saveDocument.isPending}
              />
            ) : (
              <EmptyState icon={LibraryIcon} message="Select a Library item." />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function LibraryRow({
  item,
  selected,
  pinned,
  onSelect,
  onTogglePin,
}: {
  item: LibraryItem;
  selected: boolean;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const Icon = itemIcon(item);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition-colors",
        selected ? "border-primary/50 bg-accent" : "border-border bg-card hover:bg-accent/50",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {itemKindLabel(item)} · {item.issueIdentifier ?? item.issueTitle}
        </span>
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label={pinned ? "Unpin item" : "Pin item"}
        onClick={(event) => {
          event.stopPropagation();
          onTogglePin();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          onTogglePin();
        }}
        className="rounded-sm p-1 text-muted-foreground opacity-70 hover:bg-background hover:text-foreground group-hover:opacity-100"
      >
        {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function LibraryDetail({
  item,
  pinned,
  onTogglePin,
  document,
  documentLoading,
  documentDraft,
  onDocumentDraftChange,
  editingDocument,
  onEditDocument,
  onCancelDocumentEdit,
  onSaveDocument,
  saveError,
  saving,
}: {
  item: LibraryItem;
  pinned: boolean;
  onTogglePin: () => void;
  document: IssueDocument | null;
  documentLoading: boolean;
  documentDraft: string;
  onDocumentDraftChange: (value: string) => void;
  editingDocument: boolean;
  onEditDocument: () => void;
  onCancelDocumentEdit: () => void;
  onSaveDocument: () => void;
  saveError: Error | null;
  saving: boolean;
}) {
  const Icon = itemIcon(item);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-md border border-border bg-card p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-normal">{item.title}</h2>
              {item.isImportant ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  Important
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemKindLabel(item)} · {item.department} · Updated {relativeTime(item.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onTogglePin}>
            {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {pinned ? "Unpin" : "Pin"}
          </Button>
          {item.href ? (
            <Button variant="outline" size="sm" asChild>
              <a href={item.href} target={item.href.startsWith("/api/") ? undefined : "_blank"} rel="noreferrer">
                {item.kind === "attachment" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                Open
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Issue</dt>
          <dd className="mt-1 font-medium">
            <Link className="hover:underline" to={`/issues/${item.issueId}`}>
              {item.issueIdentifier ?? item.issueTitle}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Department</dt>
          <dd className="mt-1 font-medium">{item.department}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">State</dt>
          <dd className="mt-1 font-medium">{item.reviewState ?? item.status ?? itemKindLabel(item)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Updated</dt>
          <dd className="mt-1 font-medium">{formatDateTime(item.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5">
        {item.kind === "document" ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Document body</h3>
              {document && !editingDocument ? (
                <Button variant="outline" size="sm" onClick={onEditDocument}>
                  <FileText className="h-4 w-4" />
                  Edit markdown
                </Button>
              ) : null}
            </div>
            {documentLoading ? (
              <div className="text-sm text-muted-foreground">Loading document...</div>
            ) : !document ? (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                This document could not be loaded from the issue API.
              </div>
            ) : editingDocument ? (
              <div className="space-y-3">
                <Textarea
                  value={documentDraft}
                  onChange={(event) => onDocumentDraftChange(event.target.value)}
                  className="min-h-[420px] font-mono text-sm"
                  aria-label="Markdown document body"
                />
                {saveError ? (
                  <p className="text-sm text-destructive">{saveError.message}</p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={onCancelDocumentEdit} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onSaveDocument} disabled={saving || documentDraft === document.body}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-card p-4">
                <MarkdownBody>{document.body || "_Empty document_"}</MarkdownBody>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Details</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
            {item.contentType || item.byteSize ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {[item.contentType, formatBytes(item.byteSize)].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {item.kind === "work_product" && !item.href ? (
              <p className="mt-3 text-sm text-muted-foreground">
                This work product has no external URL yet. It is still tracked as Paperclip runtime output.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

