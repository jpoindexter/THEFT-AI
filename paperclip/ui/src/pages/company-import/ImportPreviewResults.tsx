import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import type {
  CompanyPortabilityFileEntry,
  CompanyPortabilityPreviewResult,
} from "@paperclipai/shared";
import { ImportPreviewWorkspace } from "./ImportPreviewWorkspace";
import {
  AdapterPickerList,
  ConflictResolutionList,
  type AdapterPickerItem,
  type ConflictItem,
} from "./ImportReviewSetup";
import type { FileTreeNode } from "../../components/FileTree";

type FileTreeKind = "file" | "dir";

interface ImportPreviewResultsProps {
  importPreview: CompanyPortabilityPreviewResult;
  tree: FileTreeNode[];
  selectedFile: string | null;
  expandedDirs: Set<string>;
  checkedFiles: Set<string>;
  selectedCount: number;
  totalFiles: number;
  conflicts: ConflictItem[];
  hasErrors: boolean;
  isImporting: boolean;
  selectedAction: string | null;
  renamedTo: string | null;
  previewContent: CompanyPortabilityFileEntry | null;
  renameMap: Map<string, string>;
  nameOverrides: Record<string, string>;
  skippedSlugs: Set<string>;
  confirmedSlugs: Set<string>;
  adapterAgents: AdapterPickerItem[];
  adapterOverrides: Record<string, string>;
  adapterExpandedSlugs: Set<string>;
  adapterConfigValues: Record<string, CreateConfigValues>;
  onConflictRename: (slug: string, newName: string) => void;
  onConflictToggleSkip: (slug: string, filePath: string | null) => void;
  onConflictToggleConfirm: (slug: string) => void;
  onAdapterChange: (slug: string, adapterType: string) => void;
  onAdapterToggleExpand: (slug: string) => void;
  onAdapterConfigChange: (slug: string, patch: Partial<CreateConfigValues>) => void;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
  onToggleCheck: (path: string, kind: FileTreeKind) => void;
  onImport: () => void;
}

export function ImportPreviewResults({
  importPreview,
  tree,
  selectedFile,
  expandedDirs,
  checkedFiles,
  selectedCount,
  totalFiles,
  conflicts,
  hasErrors,
  isImporting,
  selectedAction,
  renamedTo,
  previewContent,
  renameMap,
  nameOverrides,
  skippedSlugs,
  confirmedSlugs,
  adapterAgents,
  adapterOverrides,
  adapterExpandedSlugs,
  adapterConfigValues,
  onConflictRename,
  onConflictToggleSkip,
  onConflictToggleConfirm,
  onAdapterChange,
  onAdapterToggleExpand,
  onAdapterConfigChange,
  onToggleDir,
  onSelectFile,
  onToggleCheck,
  onImport,
}: ImportPreviewResultsProps) {
  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-background px-5 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium">
            Import preview
          </span>
          <span className="text-muted-foreground">
            {selectedCount} / {totalFiles} file{totalFiles === 1 ? "" : "s"} selected
          </span>
          {conflicts.length > 0 && (
            <span className="text-amber-500">
              {conflicts.length} conflict{conflicts.length === 1 ? "" : "s"}
            </span>
          )}
          {importPreview.errors.length > 0 && (
            <span className="text-destructive">
              {importPreview.errors.length} error{importPreview.errors.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <ConflictResolutionList
        conflicts={conflicts}
        nameOverrides={nameOverrides}
        skippedSlugs={skippedSlugs}
        confirmedSlugs={confirmedSlugs}
        onRename={onConflictRename}
        onToggleSkip={onConflictToggleSkip}
        onToggleConfirm={onConflictToggleConfirm}
      />

      <AdapterPickerList
        agents={adapterAgents}
        adapterOverrides={adapterOverrides}
        expandedSlugs={adapterExpandedSlugs}
        configValues={adapterConfigValues}
        onChangeAdapter={onAdapterChange}
        onToggleExpand={onAdapterToggleExpand}
        onChangeConfig={onAdapterConfigChange}
      />

      <ImportPreviewWorkspace
        importPreview={importPreview}
        tree={tree}
        selectedFile={selectedFile}
        expandedDirs={expandedDirs}
        checkedFiles={checkedFiles}
        selectedCount={selectedCount}
        totalFiles={totalFiles}
        conflictCount={conflicts.length}
        hasErrors={hasErrors}
        isImporting={isImporting}
        selectedAction={selectedAction}
        renamedTo={renamedTo}
        previewContent={previewContent}
        renameMap={renameMap}
        onToggleDir={onToggleDir}
        onSelectFile={onSelectFile}
        onToggleCheck={onToggleCheck}
        onImport={onImport}
      />
    </>
  );
}
