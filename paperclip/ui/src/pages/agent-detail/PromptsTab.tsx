import type { Agent } from "@paperclipai/shared";
import { cn } from "../../lib/utils";
import { PromptsAdvancedSettings } from "./PromptsAdvancedSettings";
import { PromptsEditorPane } from "./PromptsEditorPane";
import { PromptsFilePanel } from "./PromptsFilePanel";
import { PromptsTabSkeleton } from "./PromptsTabSkeleton";
import { usePromptsTabController } from "./usePromptsTabController";

export function PromptsTab({
  agent,
  companyId,
  onDirtyChange,
  onSaveActionChange,
  onCancelActionChange,
  onSavingChange,
}: {
  agent: Agent;
  companyId?: string;
  onDirtyChange: (dirty: boolean) => void;
  onSaveActionChange: (save: (() => void) | null) => void;
  onCancelActionChange: (cancel: (() => void) | null) => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const controller = usePromptsTabController({
    agent,
    companyId,
    onCancelActionChange,
    onDirtyChange,
    onSaveActionChange,
    onSavingChange,
  });
  const {
    bundle,
    bundleLoading,
    currentEntryFile,
    currentMode,
    currentRootPath,
    deleteFile,
    displayValue,
    expandedDirs,
    externalBundleRef,
    fileLoading,
    fileOptions,
    fileTree,
    isLocal,
    isMobile,
    newFilePath,
    paneLayout,
    selectedFileDetail,
    selectedFileExists,
    selectedFileSummary,
    selectedOrEntryFile,
    setBundleDraft,
    setDraft,
    setExpandedDirs,
    setNewFilePath,
    setPendingFiles,
    setSelectedFile,
    setShowFilePanel,
    setShowNewFileInput,
    showFilePanel,
    showNewFileInput,
    uploadMarkdownImage,
  } = controller;

  if (!isLocal) {
    return (
      <div className="max-w-3xl">
        <p className="text-sm text-muted-foreground">
          Instructions bundles are only available for local adapters.
        </p>
      </div>
    );
  }

  if (bundleLoading && !bundle) return <PromptsTabSkeleton />;

  const instructionsSideBySide =
    !isMobile &&
    paneLayout.instructionPaneWidth !== null &&
    paneLayout.instructionPaneWidth >= paneLayout.filePanelWidth + 520;

  return (
    <div className="space-y-6">
      {(bundle?.warnings ?? []).length > 0 ? (
        <div className="space-y-2">
          {bundle!.warnings.map((warning) => (
            <div key={warning} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      <PromptsAdvancedSettings
        currentEntryFile={currentEntryFile}
        currentMode={currentMode}
        currentRootPath={currentRootPath}
        externalBundle={externalBundleRef.current ? { ...externalBundleRef.current, mode: "external" } : null}
        managedRootPath={bundle?.managedRootPath}
        persistedExternalRootPath={bundle?.mode === "external" ? (bundle.rootPath ?? "") : ""}
        selectedOrEntryFile={selectedOrEntryFile}
        setBundleDraft={setBundleDraft}
        setExternalBundle={(value) => {
          externalBundleRef.current = value
            ? { rootPath: value.rootPath, entryFile: value.entryFile, selectedFile: value.selectedFile }
            : null;
        }}
        setSelectedFile={setSelectedFile}
      />

      <div
        ref={paneLayout.containerRef}
        className={cn("grid min-w-0 gap-3", instructionsSideBySide && "agent-instructions-pane-grid")}
      >
        <PromptsFilePanel
          bundleFiles={bundle?.files ?? []}
          checkedFiles={new Set()}
          expandedDirs={expandedDirs}
          fileOptions={fileOptions}
          fileTree={fileTree}
          isMobile={isMobile}
          newFilePath={newFilePath}
          selectedOrEntryFile={selectedOrEntryFile}
          setDraft={setDraft}
          setExpandedDirs={setExpandedDirs}
          setNewFilePath={setNewFilePath}
          setPendingFiles={setPendingFiles}
          setSelectedFile={setSelectedFile}
          setShowFilePanel={setShowFilePanel}
          setShowNewFileInput={setShowNewFileInput}
          showFilePanel={showFilePanel}
          showNewFileInput={showNewFileInput}
        />

        {instructionsSideBySide ? (
          <div
            className="w-1 cursor-col-resize rounded transition-colors hover:bg-border active:bg-primary/50"
            onMouseDown={paneLayout.handleSeparatorDrag}
          />
        ) : null}

        <PromptsEditorPane
          agentId={agent.id}
          currentEntryFile={currentEntryFile}
          deleteFilePending={deleteFile.isPending}
          displayValue={displayValue}
          fileLoading={fileLoading && !selectedFileDetail}
          isMobile={isMobile}
          onDeleteFile={(path) => {
            if (!confirm(`Delete ${path}?`)) return;
            deleteFile.mutate(path, {
              onSuccess: () => {
                setSelectedFile(currentEntryFile);
                setDraft(null);
              },
            });
          }}
          onUploadImage={(file, namespace) => uploadMarkdownImage.mutateAsync({ file, namespace })}
          selectedFileExists={selectedFileExists}
          selectedFileSummary={selectedFileSummary ? { ...selectedFileSummary, language: selectedFileDetail?.language } : null}
          selectedOrEntryFile={selectedOrEntryFile}
          setDraft={setDraft}
          setShowFilePanel={setShowFilePanel}
          showFilePanel={showFilePanel}
        />
      </div>
    </div>
  );
}
