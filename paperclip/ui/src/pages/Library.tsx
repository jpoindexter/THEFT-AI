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
import { TheftChip, TheftPageShell, TheftSectionHeader, TheftStat, TheftSurface } from "@/components/theft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import {
  buildLibraryItems,
  groupLibraryItemsByDepartment,
  summarizeLibraryItems,
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
  const librarySummary = useMemo(() => summarizeLibraryItems(allItems), [allItems]);
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
    <TheftPageShell
      eyebrow="Company memory"
      title="Outcomes Library"
      description="Durable company output, provenance, and source tasks grouped by department."
      actions={(
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.library.items(selectedCompanyId) })}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      )}
    >
      <div className="space-y-4">
        <TheftSurface tone="plain" padding="md" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Library"
                className="pl-9"
              />
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-full md:w-56" aria-label="Filter by department">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departmentOptions.map((department) => (
                  <SelectItem key={department} value={department.toLowerCase()}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <TheftStat label="Outputs" value={librarySummary.totalItems} />
            <TheftStat label="Pinned / important" value={librarySummary.importantItems} />
            <TheftStat label="Department shelves" value={librarySummary.departmentCount} />
            <TheftStat
              label="Latest"
              value={librarySummary.latestUpdatedAt ? relativeTime(librarySummary.latestUpdatedAt) : "None"}
            />
          </div>
        </TheftSurface>

        {error ? (
          <EmptyState icon={LibraryIcon} message={(error as Error).message || "Could not load Library items."} />
        ) : isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Loading Library...</div>
        ) : allItems.length === 0 ? (
          <EmptyState icon={LibraryIcon} message="No Library items yet. Route a task or save a department document to create company memory." />
        ) : (
          <TheftSurface
            tone="plain"
            padding="none"
            className="theft-library-workspace grid overflow-hidden"
          >
            <section className="min-h-0 overflow-y-auto border-r border-border bg-card/50 p-4">
              {pinnedItems.length > 0 ? (
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <Pin className="h-3.5 w-3.5" />
                    Pinned company memory
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
                        <TheftChip tone="muted" density="compact">{group.items.length}</TheftChip>
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

            <section className="min-h-0 overflow-y-auto bg-card p-5">
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
          </TheftSurface>
        )}
      </div>
    </TheftPageShell>
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
    <div
      className={cn(
        "theft-surface-plain group flex w-full items-start gap-3 px-3 py-2 text-left transition-colors",
        selected ? "theft-selected-surface" : "hover:bg-accent/40",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        className="h-auto min-w-0 flex-1 justify-start gap-3 p-0 text-left font-normal hover:bg-transparent"
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{item.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {itemKindLabel(item)} · {item.sourceTaskLabel}
          </span>
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={pinned ? "Unpin item" : "Pin item"}
        onClick={onTogglePin}
        className="text-muted-foreground opacity-70 hover:bg-background hover:text-foreground group-hover:opacity-100"
      >
        {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </Button>
    </div>
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
  return (
    <div className="mx-auto max-w-5xl">
      <TheftSectionHeader
        eyebrow="Artifact inspector"
        title={(
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate">{item.title}</span>
            {item.isImportant ? <TheftChip tone="important">Important</TheftChip> : null}
          </span>
        )}
        description={`${itemKindLabel(item)} · ${item.department} · ${item.provenance}`}
        actions={(
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
        )}
      />

      <dl className="mt-5 grid min-w-0 gap-3 border-y border-border py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-xs uppercase text-muted-foreground">Source task</dt>
          <dd className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
            <Link className="hover:underline" to={`/issues/${item.issueId}`}>
              {item.sourceTaskLabel}
            </Link>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs uppercase text-muted-foreground">Owner department</dt>
          <dd className="mt-1 break-words font-medium">{item.department}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs uppercase text-muted-foreground">Provenance</dt>
          <dd className="mt-1 break-words font-medium [overflow-wrap:anywhere]">{item.provenance}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs uppercase text-muted-foreground">Updated</dt>
          <dd className="mt-1 break-words font-medium">{formatDateTime(item.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5">
        {item.kind === "document" ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Artifact body</h3>
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
              <TheftSurface tone="plain" padding="md" className="text-sm text-muted-foreground">
                This document could not be loaded from the task record.
              </TheftSurface>
            ) : editingDocument ? (
              <div className="space-y-3">
                <Textarea
                  value={documentDraft}
                  onChange={(event) => onDocumentDraftChange(event.target.value)}
                  className="theft-library-editor font-mono text-sm"
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
              <TheftSurface tone="plain" padding="md" className="text-foreground">
                <MarkdownBody>{document.body || "_Empty document_"}</MarkdownBody>
              </TheftSurface>
            )}
          </div>
        ) : (
          <TheftSurface tone="plain" padding="md" className="text-foreground">
            <h3 className="text-sm font-semibold">Artifact body</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.reviewState ?? item.status ?? itemKindLabel(item)}</p>
            {item.contentType || item.byteSize ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {[item.contentType, formatBytes(item.byteSize)].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {item.kind === "work_product" && !item.href ? (
              <p className="mt-3 text-sm text-muted-foreground">
                This work product has no external URL yet. It is still tracked as company runtime output.
              </p>
            ) : null}
          </TheftSurface>
        )}
      </div>
    </div>
  );
}
