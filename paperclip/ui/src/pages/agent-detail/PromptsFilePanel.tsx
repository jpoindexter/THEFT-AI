import { Plus, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileTree } from "../../components/FileTree";
import { cn } from "../../lib/utils";

type FileTreeNodes = ComponentProps<typeof FileTree>["nodes"];
type BundleFile = {
  deprecated?: boolean;
  isEntryFile?: boolean;
  path: string;
  size: number;
};

export function PromptsFilePanel({
  bundleFiles,
  checkedFiles,
  expandedDirs,
  fileOptions,
  fileTree,
  isMobile,
  newFilePath,
  selectedOrEntryFile,
  showFilePanel,
  showNewFileInput,
  setDraft,
  setExpandedDirs,
  setNewFilePath,
  setPendingFiles,
  setSelectedFile,
  setShowFilePanel,
  setShowNewFileInput,
}: {
  bundleFiles: BundleFile[];
  checkedFiles: Set<string>;
  expandedDirs: Set<string>;
  fileOptions: string[];
  fileTree: FileTreeNodes;
  isMobile: boolean;
  newFilePath: string;
  selectedOrEntryFile: string;
  showFilePanel: boolean;
  showNewFileInput: boolean;
  setDraft: (value: string | null) => void;
  setExpandedDirs: (updater: (current: Set<string>) => Set<string>) => void;
  setNewFilePath: (value: string) => void;
  setPendingFiles: (updater: (current: string[]) => string[]) => void;
  setSelectedFile: (value: string) => void;
  setShowFilePanel: (value: boolean) => void;
  setShowNewFileInput: (value: boolean) => void;
}) {
  return (
    <div className={cn(
      "min-w-0 w-full space-y-3 rounded-lg border border-border p-3",
      isMobile && showFilePanel && "block",
      isMobile && !showFilePanel && "hidden",
    )}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Files</h4>
        <div className="flex items-center gap-1">
          {!showNewFileInput ? (
            <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setShowNewFileInput(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {isMobile ? (
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowFilePanel(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {showNewFileInput ? (
        <NewFileForm
          newFilePath={newFilePath}
          setDraft={setDraft}
          setNewFilePath={setNewFilePath}
          setPendingFiles={setPendingFiles}
          setSelectedFile={setSelectedFile}
          setShowNewFileInput={setShowNewFileInput}
        />
      ) : null}
      <FileTree
        nodes={fileTree}
        selectedFile={selectedOrEntryFile}
        expandedDirs={expandedDirs}
        checkedFiles={checkedFiles}
        onToggleDir={(dirPath) => setExpandedDirs((current) => {
          const next = new Set(current);
          if (next.has(dirPath)) next.delete(dirPath);
          else next.add(dirPath);
          return next;
        })}
        onSelectFile={(filePath) => {
          setSelectedFile(filePath);
          if (!fileOptions.includes(filePath)) setDraft("");
          if (isMobile) setShowFilePanel(false);
        }}
        onToggleCheck={() => {}}
        showCheckboxes={false}
        wrapLabels
        renderFileExtra={(node) => renderFileExtra(bundleFiles.find((entry) => entry.path === node.path))}
      />
    </div>
  );
}

function NewFileForm({
  newFilePath,
  setDraft,
  setNewFilePath,
  setPendingFiles,
  setSelectedFile,
  setShowNewFileInput,
}: {
  newFilePath: string;
  setDraft: (value: string | null) => void;
  setNewFilePath: (value: string) => void;
  setPendingFiles: (updater: (current: string[]) => string[]) => void;
  setSelectedFile: (value: string) => void;
  setShowNewFileInput: (value: boolean) => void;
}) {
  const reset = () => {
    setShowNewFileInput(false);
    setNewFilePath("");
  };
  return (
    <div className="space-y-2">
      <Input
        value={newFilePath}
        onChange={(event) => setNewFilePath(event.target.value)}
        placeholder="TOOLS.md"
        className="font-mono text-sm"
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Escape") reset();
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          className="flex-1"
          disabled={!newFilePath.trim() || newFilePath.includes("..")}
          onClick={() => {
            const candidate = newFilePath.trim();
            if (!candidate || candidate.includes("..")) return;
            setPendingFiles((prev) => prev.includes(candidate) ? prev : [...prev, candidate]);
            setSelectedFile(candidate);
            setDraft("");
            reset();
          }}
        >
          Create
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={reset}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function renderFileExtra(file: BundleFile | undefined): ReactNode {
  if (!file) return null;
  if (file.deprecated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="theft-label-nano ml-3 shrink-0 cursor-help rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-amber-200">
            virtual file
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={4}>
          Legacy inline prompt - this deprecated virtual file preserves the old promptTemplate content
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <span className="theft-label-nano ml-3 shrink-0 rounded border border-border px-1.5 py-0.5 text-muted-foreground">
      {file.isEntryFile ? "entry" : `${file.size}b`}
    </span>
  );
}
