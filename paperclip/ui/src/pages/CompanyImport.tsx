import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompanyPortabilityCollisionStrategy,
  CompanyPortabilityPreviewResult,
  CompanyPortabilitySource,
} from "@paperclipai/shared";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToastActions } from "../context/ToastContext";
import { authApi } from "../api/auth";
import { companiesApi } from "../api/companies";
import { agentsApi } from "../api/agents";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { Download } from "lucide-react";
import { ImportPreviewResults } from "./company-import/ImportPreviewResults";
import { ImportSourceSection } from "./company-import/ImportSourceSection";
import {
  applyImportedSidebarOrder,
  buildConflictList,
  deriveSourcePrefix,
  prefixedName,
  readLocalPackageZip,
  type LocalCompanyImportPackage,
} from "./company-import/importPreviewModel";
import { useImportAdapterOverrides } from "./company-import/useImportAdapterOverrides";
import { useImportPreviewState } from "./company-import/useImportPreviewState";

// ── Main page ─────────────────────────────────────────────────────────

export function CompanyImport() {
  const {
    selectedCompanyId,
    selectedCompany,
    setSelectedCompanyId,
  } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToastActions();
  const queryClient = useQueryClient();
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;

  // Source state
  const [sourceMode, setSourceMode] = useState<"github" | "local">("github");
  const [importUrl, setImportUrl] = useState("");
  const [localPackage, setLocalPackage] = useState<LocalCompanyImportPackage | null>(null);

  // Target state
  const [targetMode, setTargetMode] = useState<"existing" | "new">("new");
  const [newCompanyName, setNewCompanyName] = useState("");

  // Preview state
  const [importPreview, setImportPreview] =
    useState<CompanyPortabilityPreviewResult | null>(null);

  // Conflict resolution state
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [skippedSlugs, setSkippedSlugs] = useState<Set<string>>(new Set());
  const [confirmedSlugs, setConfirmedSlugs] = useState<Set<string>>(new Set());
  const [collisionStrategy, setCollisionStrategy] = useState<CompanyPortabilityCollisionStrategy>("rename");

  const previewState = useImportPreviewState({
    importPreview,
    targetMode,
    nameOverrides,
    skippedSlugs,
  });
  const adapterState = useImportAdapterOverrides({ importPreview });

  // Fetch current company agents to find CEO adapter type
  const { data: companyAgents } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.agents.list(selectedCompanyId) : ["agents", "none"],
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const ceoAdapterType = useMemo(() => {
    if (!companyAgents) return "claude_local";
    const ceo = companyAgents.find((a) => a.role === "ceo");
    return ceo?.adapterType ?? "claude_local";
  }, [companyAgents]);

  const localZipHelpText =
    "Upload a .zip exported directly from Paperclip. Re-zipped archives created by Finder, Explorer, or other zip tools may not import correctly.";

  useEffect(() => {
    setBreadcrumbs([
      { label: "Org Chart", href: "/org" },
      { label: "Import" },
    ]);
  }, [setBreadcrumbs]);

  function buildSource(): CompanyPortabilitySource | null {
    if (sourceMode === "local") {
      if (!localPackage) return null;
      return { type: "inline", rootPath: localPackage.rootPath, files: localPackage.files };
    }
    const url = importUrl.trim();
    if (!url) return null;
    return { type: "github", url };
  }

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: () => {
      const source = buildSource();
      if (!source) throw new Error("No source configured.");
      return companiesApi.importPreview({
        source,
        include: { company: true, agents: true, projects: true, issues: true },
        target:
          targetMode === "new"
            ? { mode: "new_company", newCompanyName: newCompanyName || null }
            : { mode: "existing_company", companyId: selectedCompanyId! },
        collisionStrategy,
      });
    },
    onSuccess: (result) => {
      setImportPreview(result);

      // Build conflicts and set default name overrides with prefix
      const conflicts = buildConflictList(result);
      const prefix = deriveSourcePrefix(
        sourceMode,
        importUrl,
        localPackage?.name ?? null,
        localPackage?.rootPath ?? null,
      );
      const defaultOverrides: Record<string, string> = {};

      for (const c of conflicts) {
        if (c.action === "rename" && prefix) {
          // Use prefix-based default rename
          defaultOverrides[c.slug] = prefixedName(prefix, c.originalName);
        }
      }
      setNameOverrides(defaultOverrides);
      setSkippedSlugs(new Set());
      setConfirmedSlugs(new Set());

      adapterState.initializeAdapterOverrides(result, ceoAdapterType);
      previewState.initializeForPreview(result);
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Preview failed",
        body: err instanceof Error ? err.message : "Failed to preview import.",
      });
    },
  });

  // Build the final nameOverrides to send (only overrides that differ from plannedName)
  function buildFinalNameOverrides(): Record<string, string> | undefined {
    if (!importPreview) return undefined;
    const overrides: Record<string, string> = {};
    for (const [slug, name] of Object.entries(nameOverrides)) {
      if (name.trim()) {
        overrides[slug] = name.trim();
      }
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  function buildSelectedFiles(): string[] | undefined {
    const selected = Array.from(previewState.checkedFiles).sort();
    return selected.length > 0 ? selected : undefined;
  }

  // Apply mutation
  const importMutation = useMutation({
    mutationFn: () => {
      const source = buildSource();
      if (!source) throw new Error("No source configured.");
      return companiesApi.importBundle({
        source,
        include: { company: true, agents: true, projects: true, issues: true },
        target:
          targetMode === "new"
            ? { mode: "new_company", newCompanyName: newCompanyName || null }
            : { mode: "existing_company", companyId: selectedCompanyId! },
        collisionStrategy,
        nameOverrides: buildFinalNameOverrides(),
        selectedFiles: buildSelectedFiles(),
        adapterOverrides: adapterState.buildFinalAdapterOverrides(),
      });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      const importedCompany = await companiesApi.get(result.company.id);
      const refreshedSession = currentUserId
        ? null
        : await queryClient.fetchQuery({
          queryKey: queryKeys.auth.session,
          queryFn: () => authApi.getSession(),
        });
      const sidebarOrderUserId =
        currentUserId
        ?? refreshedSession?.user?.id
        ?? refreshedSession?.session?.userId
        ?? null;
      await applyImportedSidebarOrder(importPreview, result, sidebarOrderUserId);
      setSelectedCompanyId(importedCompany.id);
      pushToast({
        tone: "success",
        title: "Import complete",
        body: `${result.company.name}: ${result.agents.length} agent${result.agents.length === 1 ? "" : "s"} processed.`,
      });
      // Force a fresh dashboard load so newly imported agents are immediately visible.
      window.location.assign(`/${importedCompany.issuePrefix}/dashboard`);
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Import failed",
        body: err instanceof Error ? err.message : "Failed to apply import.",
      });
    },
  });

  async function handleChooseLocalPackage(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      const pkg = await readLocalPackageZip(fileList[0]!);
      setLocalPackage(pkg);
      setImportPreview(null);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Package read failed",
        body: err instanceof Error ? err.message : "Failed to read folder.",
      });
    }
  }

  function handleConflictRename(slug: string, newName: string) {
    setNameOverrides((prev) => ({ ...prev, [slug]: newName }));
    // Editing the name un-confirms
    setConfirmedSlugs((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  }

  function handleConflictToggleConfirm(slug: string) {
    setConfirmedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleConflictToggleSkip(slug: string, filePath: string | null) {
    setSkippedSlugs((prev) => {
      const next = new Set(prev);
      const wasSkipped = next.has(slug);
      if (wasSkipped) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      // Sync with file tree checkboxes
      if (filePath) {
        previewState.setCheckedFiles((prevChecked) => {
          const nextChecked = new Set(prevChecked);
          if (wasSkipped) {
            nextChecked.add(filePath);
          } else {
            nextChecked.delete(filePath);
          }
          return nextChecked;
        });
      }

      return next;
    });
  }

  const hasSource =
    sourceMode === "local" ? !!localPackage : importUrl.trim().length > 0;
  const hasErrors = importPreview ? importPreview.errors.length > 0 : false;

  if (!selectedCompanyId) {
    return <EmptyState icon={Download} message="Select a company to import into." />;
  }

  return (
    <div>
      <ImportSourceSection
        sourceMode={sourceMode}
        importUrl={importUrl}
        localPackage={localPackage}
        localZipHelpText={localZipHelpText}
        targetMode={targetMode}
        selectedCompanyName={selectedCompany?.name}
        newCompanyName={newCompanyName}
        collisionStrategy={collisionStrategy}
        hasSource={hasSource}
        isPreviewing={previewMutation.isPending}
        onSourceModeChange={(mode) => {
          setSourceMode(mode);
          setImportPreview(null);
        }}
        onImportUrlChange={(value) => {
          setImportUrl(value);
          setImportPreview(null);
        }}
        onChooseLocalPackage={handleChooseLocalPackage}
        onTargetModeChange={(mode) => {
          setTargetMode(mode);
          setImportPreview(null);
        }}
        onNewCompanyNameChange={setNewCompanyName}
        onCollisionStrategyChange={(strategy) => {
          setCollisionStrategy(strategy);
          setImportPreview(null);
        }}
        onPreview={() => previewMutation.mutate()}
      />

      {/* Preview results */}
      {importPreview && (
        <ImportPreviewResults
          importPreview={importPreview}
          tree={previewState.tree}
          selectedFile={previewState.selectedFile}
          expandedDirs={previewState.expandedDirs}
          checkedFiles={previewState.checkedFiles}
          selectedCount={previewState.selectedCount}
          totalFiles={previewState.totalFiles}
          conflicts={previewState.conflicts}
          hasErrors={hasErrors}
          isImporting={importMutation.isPending}
          selectedAction={previewState.selectedAction}
          renamedTo={previewState.renamedTo}
          previewContent={previewState.previewContent}
          renameMap={previewState.renameMap}
          nameOverrides={nameOverrides}
          skippedSlugs={skippedSlugs}
          confirmedSlugs={confirmedSlugs}
          adapterAgents={adapterState.adapterAgents}
          adapterOverrides={adapterState.adapterOverrides}
          adapterExpandedSlugs={adapterState.adapterExpandedSlugs}
          adapterConfigValues={adapterState.adapterConfigValues}
          onConflictRename={handleConflictRename}
          onConflictToggleSkip={handleConflictToggleSkip}
          onConflictToggleConfirm={handleConflictToggleConfirm}
          onAdapterChange={adapterState.handleAdapterChange}
          onAdapterToggleExpand={adapterState.handleAdapterToggleExpand}
          onAdapterConfigChange={adapterState.handleAdapterConfigChange}
          onToggleDir={previewState.handleToggleDir}
          onSelectFile={previewState.setSelectedFile}
          onToggleCheck={previewState.handleToggleCheck}
          onImport={() => importMutation.mutate()}
        />
      )}
    </div>
  );
}
