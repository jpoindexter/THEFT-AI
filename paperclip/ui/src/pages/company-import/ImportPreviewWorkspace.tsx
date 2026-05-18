import type {
  CompanyPortabilityFileEntry,
  CompanyPortabilityPreviewResult,
} from "@paperclipai/shared";
import { Download, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../components/EmptyState";
import { MarkdownBody } from "../../components/MarkdownBody";
import {
  FileTree,
  FRONTMATTER_FIELD_LABELS,
  parseFrontmatter,
  type FileTreeNode,
  type FrontmatterData,
} from "../../components/FileTree";
import { getPortableFileDataUrl, getPortableFileText, isPortableImageFile } from "../../lib/portable-files";
import { cn } from "../../lib/utils";

type FileTreeKind = "file" | "dir";

interface ImportPreviewWorkspaceProps {
  importPreview: CompanyPortabilityPreviewResult;
  tree: FileTreeNode[];
  selectedFile: string | null;
  expandedDirs: Set<string>;
  checkedFiles: Set<string>;
  selectedCount: number;
  totalFiles: number;
  conflictCount: number;
  hasErrors: boolean;
  isImporting: boolean;
  selectedAction: string | null;
  renamedTo: string | null;
  previewContent: CompanyPortabilityFileEntry | null;
  renameMap: Map<string, string>;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
  onToggleCheck: (path: string, kind: FileTreeKind) => void;
  onImport: () => void;
}

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-500 border-emerald-500/30",
  update: "text-amber-500 border-amber-500/30",
  overwrite: "text-red-500 border-red-500/30",
  replace: "text-red-500 border-red-500/30",
  skip: "text-muted-foreground border-border",
  none: "text-muted-foreground border-border",
};

function FrontmatterCard({ data }: { data: FrontmatterData }) {
  return (
    <div className="mb-4 rounded-md border border-border bg-accent/20 px-4 py-3">
      <dl className="space-y-1.5 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
            <dt className="shrink-0 py-0.5 text-muted-foreground sm:w-36">
              {FRONTMATTER_FIELD_LABELS[key] ?? key}
            </dt>
            <dd className="min-w-0 py-0.5">
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <span>{value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function renderImportFileExtra(node: FileTreeNode, checked: boolean, renameMap: Map<string, string>) {
  const renamedTo = node.kind === "dir" ? renameMap.get(node.path) : undefined;
  const actionBadge = node.action ? (
    <span
      className={cn(
        "theft-label-nano shrink-0 rounded-full border px-2 py-0.5",
        ACTION_COLORS[node.action] ?? ACTION_COLORS.skip,
      )}
    >
      {checked ? node.action : "skip"}
    </span>
  ) : null;

  if (!actionBadge && !renamedTo) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {renamedTo && checked && (
        <span className="max-w-28 truncate font-mono text-nano text-cyan-500" title={renamedTo}>
          &rarr; {renamedTo}
        </span>
      )}
      {actionBadge}
    </span>
  );
}

function importFileRowClassName(_node: FileTreeNode, checked: boolean) {
  return !checked ? "opacity-50" : undefined;
}

function ImportPreviewPane({
  selectedFile,
  content,
  allFiles,
  action,
  renamedTo,
}: {
  selectedFile: string | null;
  content: CompanyPortabilityFileEntry | null;
  allFiles: Record<string, CompanyPortabilityFileEntry>;
  action: string | null;
  renamedTo: string | null;
}) {
  if (!selectedFile || content === null) {
    return <EmptyState icon={Package} message="Select a file to preview its contents." />;
  }

  const textContent = getPortableFileText(content);
  const isMarkdown = selectedFile.endsWith(".md") && textContent !== null;
  const parsed = isMarkdown && textContent ? parseFrontmatter(textContent) : null;
  const imageSrc = isPortableImageFile(selectedFile, content) ? getPortableFileDataUrl(selectedFile, content) : null;
  const actionColor = action ? (ACTION_COLORS[action] ?? ACTION_COLORS.skip) : "";

  const resolveImageSrc = isMarkdown
    ? (src: string) => {
        if (/^(?:https?:|data:)/i.test(src)) return null;
        const dir = selectedFile.includes("/") ? selectedFile.slice(0, selectedFile.lastIndexOf("/") + 1) : "";
        const resolved = dir + src;
        const entry = allFiles[resolved] ?? allFiles[src];
        if (!entry) return null;
        return getPortableFileDataUrl(resolved in allFiles ? resolved : src, entry);
      }
    : undefined;

  return (
    <div className="min-w-0">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono text-sm">{selectedFile}</span>
            {renamedTo && (
              <span className="shrink-0 font-mono text-sm text-cyan-500">
                &rarr; {renamedTo}
              </span>
            )}
          </div>
          {action && (
            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide", actionColor)}>
              {action}
            </span>
          )}
        </div>
      </div>
      <div className="min-h-96 px-5 py-5">
        {parsed ? (
          <>
            <FrontmatterCard data={parsed.data} />
            {parsed.body.trim() && <MarkdownBody resolveImageSrc={resolveImageSrc} softBreaks={false} linkIssueReferences={false}>{parsed.body}</MarkdownBody>}
          </>
        ) : isMarkdown ? (
          <MarkdownBody resolveImageSrc={resolveImageSrc} softBreaks={false} linkIssueReferences={false}>{textContent ?? ""}</MarkdownBody>
        ) : imageSrc ? (
          <div className="flex min-h-96 items-center justify-center rounded-lg border border-border bg-accent/10 p-6">
            <img src={imageSrc} alt={selectedFile} className="max-h-96 max-w-full object-contain" />
          </div>
        ) : textContent !== null ? (
          <pre className="overflow-x-auto whitespace-pre-wrap break-words border-0 bg-transparent p-0 font-mono text-sm text-foreground">
            <code>{textContent}</code>
          </pre>
        ) : (
          <div className="rounded-lg border border-border bg-accent/10 px-4 py-3 text-sm text-muted-foreground">
            Binary asset preview is not available for this file type.
          </div>
        )}
      </div>
    </div>
  );
}

export function ImportPreviewWorkspace({
  importPreview,
  tree,
  selectedFile,
  expandedDirs,
  checkedFiles,
  selectedCount,
  totalFiles,
  conflictCount,
  hasErrors,
  isImporting,
  selectedAction,
  renamedTo,
  previewContent,
  renameMap,
  onToggleDir,
  onSelectFile,
  onToggleCheck,
  onImport,
}: ImportPreviewWorkspaceProps) {
  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-background px-5 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium">Import preview</span>
          <span className="text-muted-foreground">
            {selectedCount} / {totalFiles} file{totalFiles === 1 ? "" : "s"} selected
          </span>
          {conflictCount > 0 && (
            <span className="text-amber-500">
              {conflictCount} conflict{conflictCount === 1 ? "" : "s"}
            </span>
          )}
          {importPreview.errors.length > 0 && (
            <span className="text-destructive">
              {importPreview.errors.length} error{importPreview.errors.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="mx-5 mt-3 flex justify-end">
        <Button size="sm" onClick={onImport} disabled={isImporting || hasErrors || selectedCount === 0}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {isImporting ? "Importing..." : `Import ${selectedCount} file${selectedCount === 1 ? "" : "s"}`}
        </Button>
      </div>

      {importPreview.warnings.length > 0 && (
        <div className="mx-5 mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          {importPreview.warnings.map((warning) => (
            <div key={warning} className="text-xs text-amber-500">{warning}</div>
          ))}
        </div>
      )}

      {importPreview.errors.length > 0 && (
        <div className="mx-5 mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
          {importPreview.errors.map((error) => (
            <div key={error} className="text-xs text-destructive">{error}</div>
          ))}
        </div>
      )}

      <div className="grid min-h-96 gap-0 xl:grid-cols-4">
        <aside className="flex max-h-screen flex-col overflow-hidden border-r border-border xl:col-span-1">
          <div className="shrink-0 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold">Package files</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileTree
              nodes={tree}
              selectedFile={selectedFile}
              expandedDirs={expandedDirs}
              checkedFiles={checkedFiles}
              onToggleDir={onToggleDir}
              onSelectFile={onSelectFile}
              onToggleCheck={onToggleCheck}
              renderFileExtra={(node, checked) => renderImportFileExtra(node, checked, renameMap)}
              fileRowClassName={importFileRowClassName}
              wrapLabels={false}
            />
          </div>
        </aside>
        <div className="min-w-0 overflow-y-auto pl-6 xl:col-span-3">
          <ImportPreviewPane
            selectedFile={selectedFile}
            content={previewContent}
            allFiles={importPreview.files}
            action={selectedAction}
            renamedTo={renamedTo}
          />
        </div>
      </div>
    </>
  );
}
