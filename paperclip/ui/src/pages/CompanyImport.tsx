import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompanyPortabilityCollisionStrategy,
  CompanyPortabilityPreviewResult,
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
import { applyImportedSidebarOrder } from "./company-import/importPreviewModel";
import { useImportAdapterOverrides } from "./company-import/useImportAdapterOverrides";
import { useImportConflictState } from "./company-import/useImportConflictState";
import { useImportPreviewState } from "./company-import/useImportPreviewState";
import { useImportSourceState } from "./company-import/useImportSourceState";

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

  // Target state
  const [targetMode, setTargetMode] = useState<"existing" | "new">("new");
  const [newCompanyName, setNewCompanyName] = useState("");

  // Preview state
  const [importPreview, setImportPreview] =
    useState<CompanyPortabilityPreviewResult | null>(null);

  const [collisionStrategy, setCollisionStrategy] = useState<CompanyPortabilityCollisionStrategy>("rename");
  const sourceState = useImportSourceState({
    onResetPreview: () => setImportPreview(null),
    onReadError: (err) => {
      pushToast({
        tone: "error",
        title: "Package read failed",
        body: err instanceof Error ? err.message : "Failed to read folder.",
      });
    },
  });
  const conflictState = useImportConflictState({
    importUrl: sourceState.importUrl,
    localPackageName: sourceState.localPackage?.name ?? null,
    localPackageRootPath: sourceState.localPackage?.rootPath ?? null,
    sourceMode: sourceState.sourceMode,
  });

  const previewState = useImportPreviewState({
    importPreview,
    targetMode,
    nameOverrides: conflictState.nameOverrides,
    skippedSlugs: conflictState.skippedSlugs,
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

  useEffect(() => {
    setBreadcrumbs([
      { label: "Org Chart", href: "/org" },
      { label: "Import" },
    ]);
  }, [setBreadcrumbs]);

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: () => {
      const source = sourceState.buildSource();
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
      conflictState.initializeForPreview(result);
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

  function buildSelectedFiles(): string[] | undefined {
    const selected = Array.from(previewState.checkedFiles).sort();
    return selected.length > 0 ? selected : undefined;
  }

  // Apply mutation
  const importMutation = useMutation({
    mutationFn: () => {
      const source = sourceState.buildSource();
      if (!source) throw new Error("No source configured.");
      return companiesApi.importBundle({
        source,
        include: { company: true, agents: true, projects: true, issues: true },
        target:
          targetMode === "new"
            ? { mode: "new_company", newCompanyName: newCompanyName || null }
            : { mode: "existing_company", companyId: selectedCompanyId! },
        collisionStrategy,
        nameOverrides: conflictState.buildFinalNameOverrides(),
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

  function handleConflictToggleSkip(slug: string, filePath: string | null) {
    conflictState.handleConflictToggleSkip(slug, filePath, (path, skipped) => {
      previewState.setCheckedFiles((prevChecked) => {
        const nextChecked = new Set(prevChecked);
        if (skipped) {
          nextChecked.delete(path);
        } else {
          nextChecked.add(path);
        }
        return nextChecked;
      });
    });
  }

  const hasErrors = importPreview ? importPreview.errors.length > 0 : false;

  if (!selectedCompanyId) {
    return <EmptyState icon={Download} message="Select a company to import into." />;
  }

  return (
    <div>
      <ImportSourceSection
        sourceMode={sourceState.sourceMode}
        importUrl={sourceState.importUrl}
        localPackage={sourceState.localPackage}
        localZipHelpText={sourceState.localZipHelpText}
        targetMode={targetMode}
        selectedCompanyName={selectedCompany?.name}
        newCompanyName={newCompanyName}
        collisionStrategy={collisionStrategy}
        hasSource={sourceState.hasSource}
        isPreviewing={previewMutation.isPending}
        onSourceModeChange={sourceState.setSourceMode}
        onImportUrlChange={sourceState.setImportUrl}
        onChooseLocalPackage={sourceState.handleChooseLocalPackage}
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
          nameOverrides={conflictState.nameOverrides}
          skippedSlugs={conflictState.skippedSlugs}
          confirmedSlugs={conflictState.confirmedSlugs}
          adapterAgents={adapterState.adapterAgents}
          adapterOverrides={adapterState.adapterOverrides}
          adapterExpandedSlugs={adapterState.adapterExpandedSlugs}
          adapterConfigValues={adapterState.adapterConfigValues}
          onConflictRename={conflictState.handleConflictRename}
          onConflictToggleSkip={handleConflictToggleSkip}
          onConflictToggleConfirm={conflictState.handleConflictToggleConfirm}
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
