import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueDocument } from "@paperclipai/shared";
import {
  Library as LibraryIcon,
  RefreshCw,
} from "lucide-react";
import { agentsApi } from "../api/agents";
import { issuesApi } from "../api/issues";
import { EmptyState } from "../components/EmptyState";
import { LibraryControls, LibraryWorkspace, TheftWorkbenchTemplate } from "@/components/theft";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import {
  buildLibraryItems,
  groupLibraryItemsByDepartment,
  summarizeLibraryItems,
  THEFT_DEPARTMENTS,
  type LibraryItem,
} from "../lib/library-items";
import { loadLibraryBundles, loadPinnedIds, savePinnedIds } from "../lib/libraryPage";
import { queryKeys } from "../lib/queryKeys";
import { cn } from "../lib/utils";

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
    <TheftWorkbenchTemplate
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
      contentClassName="block space-y-4"
    >
      <LibraryControls
        search={search}
        onSearchChange={setSearch}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        departmentOptions={departmentOptions}
        summary={librarySummary}
      />

      {error ? (
        <EmptyState icon={LibraryIcon} message={(error as Error).message || "Could not load Library items."} />
      ) : isLoading ? (
        <div className="p-5 text-sm text-muted-foreground">Loading Library...</div>
      ) : allItems.length === 0 ? (
        <EmptyState icon={LibraryIcon} message="No Library items yet. Route a task or save a department document to create company memory." />
      ) : (
        <LibraryWorkspace
          groups={groups}
          pinnedItems={pinnedItems}
          selectedItem={selectedItem}
          selectedItemId={selectedItemId}
          pinnedIds={pinnedIds}
          onSelect={(item) => setSelectedItemId(item.id)}
          onTogglePin={togglePin}
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
      )}
    </TheftWorkbenchTemplate>
  );
}
