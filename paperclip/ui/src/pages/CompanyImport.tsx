import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompanyPortabilityCollisionStrategy,
  CompanyPortabilityPreviewResult,
  CompanyPortabilitySource,
  CompanyPortabilityAdapterOverride,
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
import { defaultCreateValues } from "../components/agent-config-defaults";
import { getUIAdapter } from "../adapters";
import { ImportPreviewResults } from "./company-import/ImportPreviewResults";
import { ImportSourceSection } from "./company-import/ImportSourceSection";
import {
  type AdapterPickerItem,
} from "./company-import/ImportReviewSetup";
import {
  applyImportedSidebarOrder,
  buildActionMap,
  buildConflictList,
  deriveSourcePrefix,
  ensureMarkdownPath,
  prefixedName,
  readLocalPackageZip,
  type LocalCompanyImportPackage,
} from "./company-import/importPreviewModel";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import {
  type FileTreeNode,
  buildFileTree,
  countFiles,
  collectAllPaths,
} from "../components/FileTree";

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
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());

  // Conflict resolution state
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [skippedSlugs, setSkippedSlugs] = useState<Set<string>>(new Set());
  const [confirmedSlugs, setConfirmedSlugs] = useState<Set<string>>(new Set());
  const [collisionStrategy, setCollisionStrategy] = useState<CompanyPortabilityCollisionStrategy>("rename");

  // Adapter override state
  const [adapterOverrides, setAdapterOverrides] = useState<Record<string, string>>({});
  const [adapterExpandedSlugs, setAdapterExpandedSlugs] = useState<Set<string>>(new Set());
  const [adapterConfigValues, setAdapterConfigValues] = useState<Record<string, CreateConfigValues>>({});

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

      // Initialize adapter overrides — default all agents to the CEO's adapter type
      const defaultAdapters: Record<string, string> = {};
      for (const agent of result.manifest.agents) {
        defaultAdapters[agent.slug] = ceoAdapterType;
      }
      setAdapterOverrides(defaultAdapters);
      setAdapterExpandedSlugs(new Set());
      setAdapterConfigValues({});

      // Check all files by default, then uncheck COMPANY.md for existing company
      const allFiles = new Set(Object.keys(result.files));
      if (targetMode === "existing" && result.manifest.company && result.plan.companyAction === "update") {
        const companyPath = ensureMarkdownPath(result.manifest.company.path);
        allFiles.delete(companyPath);
      }
      setCheckedFiles(allFiles);

      // Expand top-level dirs + all ancestor dirs of files with conflicts (update action)
      const am = buildActionMap(result);
      const tree = buildFileTree(result.files, am);
      const dirsToExpand = new Set<string>();
      for (const node of tree) {
        if (node.kind === "dir") dirsToExpand.add(node.path);
      }
      // Auto-expand directories containing conflicting files so they're visible
      for (const [filePath, action] of am) {
        if (action === "update") {
          const segments = filePath.split("/").filter(Boolean);
          let current = "";
          for (let i = 0; i < segments.length - 1; i++) {
            current = current ? `${current}/${segments[i]}` : segments[i];
            dirsToExpand.add(current);
          }
        }
      }
      setExpandedDirs(dirsToExpand);
      // Select first file
      const firstFile = Object.keys(result.files)[0];
      if (firstFile) setSelectedFile(firstFile);
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
    const selected = Array.from(checkedFiles).sort();
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
        adapterOverrides: buildFinalAdapterOverrides(),
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

  const actionMap = useMemo(
    () => (importPreview ? buildActionMap(importPreview) : new Map<string, string>()),
    [importPreview],
  );

  const tree = useMemo(
    () => (importPreview ? buildFileTree(importPreview.files, actionMap) : []),
    [importPreview, actionMap],
  );

  const conflicts = useMemo(
    () => (importPreview ? buildConflictList(importPreview) : []),
    [importPreview],
  );

  // Map directory paths → planned rename name for display in the file tree
  // Also maps file paths for use in the preview header
  const renameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!importPreview) return map;
    for (const c of conflicts) {
      if (!c.filePath) continue;
      const isSkipped = skippedSlugs.has(c.slug);
      if (isSkipped) continue;
      const renamedTo = nameOverrides[c.slug] ?? c.plannedName;
      if (renamedTo === c.originalName) continue;
      // Map the parent directory (e.g. agents/ceo → gstack-ceo) for the file tree
      const parentDir = c.filePath.split("/").slice(0, -1).join("/");
      if (parentDir) map.set(parentDir, renamedTo);
      // Map the file path too — used by the preview header, not shown in tree
      map.set(c.filePath, renamedTo);
    }
    return map;
  }, [importPreview, conflicts, nameOverrides, skippedSlugs]);

  const totalFiles = useMemo(() => countFiles(tree), [tree]);
  const selectedCount = checkedFiles.size;

  function handleToggleDir(path: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function handleToggleCheck(path: string, kind: "file" | "dir") {
    if (!importPreview) return;
    setCheckedFiles((prev) => {
      const next = new Set(prev);
      if (kind === "file") {
        if (next.has(path)) next.delete(path);
        else next.add(path);
      } else {
        const findNode = (nodes: FileTreeNode[], target: string): FileTreeNode | null => {
          for (const n of nodes) {
            if (n.path === target) return n;
            const found = findNode(n.children, target);
            if (found) return found;
          }
          return null;
        };
        const dirNode = findNode(tree, path);
        if (dirNode) {
          const childFiles = collectAllPaths(dirNode.children, "file");
          for (const child of dirNode.children) {
            if (child.kind === "file") childFiles.add(child.path);
          }
          const allChecked = [...childFiles].every((p) => next.has(p));
          for (const f of childFiles) {
            if (allChecked) next.delete(f);
            else next.add(f);
          }
        }
      }
      return next;
    });
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
        setCheckedFiles((prevChecked) => {
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

  function handleAdapterChange(slug: string, adapterType: string) {
    setAdapterOverrides((prev) => ({ ...prev, [slug]: adapterType }));
    // Reset config values when adapter type changes
    setAdapterConfigValues((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }

  function handleAdapterToggleExpand(slug: string) {
    setAdapterExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleAdapterConfigChange(slug: string, patch: Partial<CreateConfigValues>) {
    setAdapterConfigValues((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] ?? { ...defaultCreateValues, adapterType: adapterOverrides[slug] ?? "claude_local" }), ...patch },
    }));
  }

  // Build the list of agents for adapter picking
  const adapterAgents = useMemo<AdapterPickerItem[]>(() => {
    if (!importPreview) return [];
    return importPreview.manifest.agents.map((a) => ({
      slug: a.slug,
      name: a.name,
      adapterType: a.adapterType,
    }));
  }, [importPreview]);

  // Build final adapterOverrides for import request
  function buildFinalAdapterOverrides(): Record<string, CompanyPortabilityAdapterOverride> | undefined {
    if (adapterAgents.length === 0) return undefined;
    const overrides: Record<string, CompanyPortabilityAdapterOverride> = {};
    for (const agent of adapterAgents) {
      const selectedType = adapterOverrides[agent.slug] ?? agent.adapterType;
      const configVals = adapterConfigValues[agent.slug];
      const override: CompanyPortabilityAdapterOverride = { adapterType: selectedType };
      if (configVals) {
        const uiAdapter = getUIAdapter(selectedType);
        override.adapterConfig = uiAdapter.buildAdapterConfig(configVals);
      }
      overrides[agent.slug] = override;
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  const hasSource =
    sourceMode === "local" ? !!localPackage : importUrl.trim().length > 0;
  const hasErrors = importPreview ? importPreview.errors.length > 0 : false;

  const previewContent = selectedFile && importPreview
    ? (() => {
        return importPreview.files[selectedFile] ?? null;
      })()
    : null;
  const selectedAction = selectedFile ? (actionMap.get(selectedFile) ?? null) : null;

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
          tree={tree}
          selectedFile={selectedFile}
          expandedDirs={expandedDirs}
          checkedFiles={checkedFiles}
          selectedCount={selectedCount}
          totalFiles={totalFiles}
          conflicts={conflicts}
          hasErrors={hasErrors}
          isImporting={importMutation.isPending}
          selectedAction={selectedAction}
          renamedTo={selectedFile ? (renameMap.get(selectedFile) ?? null) : null}
          previewContent={previewContent}
          renameMap={renameMap}
          nameOverrides={nameOverrides}
          skippedSlugs={skippedSlugs}
          confirmedSlugs={confirmedSlugs}
          adapterAgents={adapterAgents}
          adapterOverrides={adapterOverrides}
          adapterExpandedSlugs={adapterExpandedSlugs}
          adapterConfigValues={adapterConfigValues}
          onConflictRename={handleConflictRename}
          onConflictToggleSkip={handleConflictToggleSkip}
          onConflictToggleConfirm={handleConflictToggleConfirm}
          onAdapterChange={handleAdapterChange}
          onAdapterToggleExpand={handleAdapterToggleExpand}
          onAdapterConfigChange={handleAdapterConfigChange}
          onToggleDir={handleToggleDir}
          onSelectFile={setSelectedFile}
          onToggleCheck={handleToggleCheck}
          onImport={() => importMutation.mutate()}
        />
      )}
    </div>
  );
}
