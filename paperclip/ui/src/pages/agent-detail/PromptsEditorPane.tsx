import { Copy, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyText } from "../../components/CopyText";
import { MarkdownEditor } from "../../components/MarkdownEditor";
import { cn } from "../../lib/utils";
import { PromptEditorSkeleton } from "./PromptsTabSkeleton";

type SelectedFileSummary = {
  deprecated?: boolean;
  language?: string;
};

export function PromptsEditorPane({
  agentId,
  currentEntryFile,
  deleteFilePending,
  displayValue,
  fileLoading,
  isMobile,
  onDeleteFile,
  onUploadImage,
  selectedFileExists,
  selectedFileSummary,
  selectedOrEntryFile,
  setDraft,
  setShowFilePanel,
  showFilePanel,
}: {
  agentId: string;
  currentEntryFile: string;
  deleteFilePending: boolean;
  displayValue: string;
  fileLoading: boolean;
  isMobile: boolean;
  onDeleteFile: (path: string) => void;
  onUploadImage: (file: File, namespace: string) => Promise<{ contentPath: string }>;
  selectedFileExists: boolean;
  selectedFileSummary: SelectedFileSummary | null;
  selectedOrEntryFile: string;
  setDraft: (value: string | null) => void;
  setShowFilePanel: (value: boolean) => void;
  showFilePanel: boolean;
}) {
  return (
    <div className={cn("min-w-0 w-full space-y-3 overflow-hidden rounded-lg border border-border p-4", isMobile && showFilePanel && "hidden")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isMobile ? (
            <Button type="button" size="icon" variant="outline" className="h-7 w-7 shrink-0" onClick={() => setShowFilePanel(true)}>
              <FolderOpen className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h4 className="truncate font-mono text-sm font-medium">{selectedOrEntryFile}</h4>
            <p className="text-xs text-muted-foreground">
              {selectedFileExists
                ? selectedFileSummary?.deprecated
                  ? "Deprecated virtual file"
                  : `${selectedFileSummary?.language ?? "text"} file`
                : "New file in this bundle"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!fileLoading ? (
            <CopyText
              text={displayValue}
              ariaLabel="Copy instructions file as markdown"
              title="Copy as markdown"
              copiedLabel="Copied"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </CopyText>
          ) : null}
          {selectedFileExists && !selectedFileSummary?.deprecated && selectedOrEntryFile !== currentEntryFile ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onDeleteFile(selectedOrEntryFile)} disabled={deleteFilePending}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {selectedFileExists && fileLoading ? (
        <PromptEditorSkeleton />
      ) : selectedOrEntryFile.toLowerCase().endsWith(".md") ? (
        <MarkdownEditor
          key={selectedOrEntryFile}
          value={displayValue}
          onChange={(value) => setDraft(value ?? "")}
          placeholder="# Agent instructions"
          className="min-w-0 overflow-hidden"
          contentClassName="theft-library-editor max-w-full break-words font-mono text-sm"
          imageUploadHandler={async (file) => {
            const namespace = `agents/${agentId}/instructions/${selectedOrEntryFile.replaceAll("/", "-")}`;
            const asset = await onUploadImage(file, namespace);
            return asset.contentPath;
          }}
        />
      ) : (
        <Textarea
          value={displayValue}
          onChange={(event) => setDraft(event.target.value)}
          className="theft-library-editor min-w-0 font-mono text-sm"
          placeholder="File contents"
        />
      )}
    </div>
  );
}
