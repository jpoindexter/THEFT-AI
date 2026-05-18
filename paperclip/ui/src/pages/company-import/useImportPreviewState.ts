import { useMemo, useState } from "react";
import type {
  CompanyPortabilityFileEntry,
  CompanyPortabilityPreviewResult,
} from "@paperclipai/shared";
import {
  buildFileTree,
  collectAllPaths,
  countFiles,
  type FileTreeNode,
} from "../../components/FileTree";
import {
  buildActionMap,
  buildConflictList,
  ensureMarkdownPath,
} from "./importPreviewModel";

type TargetMode = "existing" | "new";
type FileTreeKind = "file" | "dir";

interface UseImportPreviewStateOptions {
  importPreview: CompanyPortabilityPreviewResult | null;
  targetMode: TargetMode;
  nameOverrides: Record<string, string>;
  skippedSlugs: Set<string>;
}

function findFileTreeNode(nodes: FileTreeNode[], target: string): FileTreeNode | null {
  for (const node of nodes) {
    if (node.path === target) return node;
    const found = findFileTreeNode(node.children, target);
    if (found) return found;
  }
  return null;
}

function buildInitialCheckedFiles(
  result: CompanyPortabilityPreviewResult,
  targetMode: TargetMode,
) {
  const checkedFiles = new Set(Object.keys(result.files));
  if (
    targetMode === "existing"
    && result.manifest.company
    && result.plan.companyAction === "update"
  ) {
    checkedFiles.delete(ensureMarkdownPath(result.manifest.company.path));
  }
  return checkedFiles;
}

function buildInitialExpandedDirs(result: CompanyPortabilityPreviewResult) {
  const actionMap = buildActionMap(result);
  const tree = buildFileTree(result.files, actionMap);
  const dirsToExpand = new Set<string>();

  for (const node of tree) {
    if (node.kind === "dir") dirsToExpand.add(node.path);
  }

  for (const [filePath, action] of actionMap) {
    if (action !== "update") continue;
    const segments = filePath.split("/").filter(Boolean);
    let current = "";
    for (let i = 0; i < segments.length - 1; i += 1) {
      current = current ? `${current}/${segments[i]}` : segments[i];
      dirsToExpand.add(current);
    }
  }

  return dirsToExpand;
}

function buildRenameMap({
  importPreview,
  conflicts,
  nameOverrides,
  skippedSlugs,
}: Pick<UseImportPreviewStateOptions, "importPreview" | "nameOverrides" | "skippedSlugs"> & {
  conflicts: ReturnType<typeof buildConflictList>;
}) {
  const map = new Map<string, string>();
  if (!importPreview) return map;

  for (const conflict of conflicts) {
    if (!conflict.filePath) continue;
    if (skippedSlugs.has(conflict.slug)) continue;
    const renamedTo = nameOverrides[conflict.slug] ?? conflict.plannedName;
    if (renamedTo === conflict.originalName) continue;

    const parentDir = conflict.filePath.split("/").slice(0, -1).join("/");
    if (parentDir) map.set(parentDir, renamedTo);
    map.set(conflict.filePath, renamedTo);
  }

  return map;
}

export function useImportPreviewState({
  importPreview,
  targetMode,
  nameOverrides,
  skippedSlugs,
}: UseImportPreviewStateOptions) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());

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

  const renameMap = useMemo(
    () => buildRenameMap({ importPreview, conflicts, nameOverrides, skippedSlugs }),
    [importPreview, conflicts, nameOverrides, skippedSlugs],
  );

  const totalFiles = useMemo(() => countFiles(tree), [tree]);
  const selectedCount = checkedFiles.size;
  const previewContent: CompanyPortabilityFileEntry | null =
    selectedFile && importPreview ? (importPreview.files[selectedFile] ?? null) : null;
  const selectedAction = selectedFile ? (actionMap.get(selectedFile) ?? null) : null;
  const renamedTo = selectedFile ? (renameMap.get(selectedFile) ?? null) : null;

  function initializeForPreview(result: CompanyPortabilityPreviewResult) {
    setCheckedFiles(buildInitialCheckedFiles(result, targetMode));
    setExpandedDirs(buildInitialExpandedDirs(result));
    setSelectedFile(Object.keys(result.files)[0] ?? null);
  }

  function handleToggleDir(path: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function handleToggleCheck(path: string, kind: FileTreeKind) {
    if (!importPreview) return;
    setCheckedFiles((prev) => {
      const next = new Set(prev);
      if (kind === "file") {
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      }

      const dirNode = findFileTreeNode(tree, path);
      if (!dirNode) return next;
      const childFiles = collectAllPaths(dirNode.children, "file");
      for (const child of dirNode.children) {
        if (child.kind === "file") childFiles.add(child.path);
      }
      const allChecked = [...childFiles].every((filePath) => next.has(filePath));
      for (const filePath of childFiles) {
        if (allChecked) next.delete(filePath);
        else next.add(filePath);
      }
      return next;
    });
  }

  return {
    actionMap,
    checkedFiles,
    conflicts,
    expandedDirs,
    handleToggleCheck,
    handleToggleDir,
    initializeForPreview,
    previewContent,
    renameMap,
    renamedTo,
    selectedAction,
    selectedCount,
    selectedFile,
    setCheckedFiles,
    setSelectedFile,
    totalFiles,
    tree,
  };
}
