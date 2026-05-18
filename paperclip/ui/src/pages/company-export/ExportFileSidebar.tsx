import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FileTreeNode } from "../../components/FileTree";
import { FileTree } from "../../components/FileTree";

export function ExportFileSidebar({
  displayTree,
  selectedFile,
  expandedDirs,
  checkedFiles,
  treeSearch,
  totalTaskChildren,
  visibleTaskChildren,
  onSearchChange,
  onTaskLimitIncrease,
  onToggleDir,
  onSelectFile,
  onToggleCheck,
}: {
  displayTree: FileTreeNode[];
  selectedFile: string | null;
  expandedDirs: Set<string>;
  checkedFiles: Set<string>;
  treeSearch: string;
  totalTaskChildren: number;
  visibleTaskChildren: number;
  onSearchChange: (query: string) => void;
  onTaskLimitIncrease: () => void;
  onToggleDir: (path: string) => void;
  onSelectFile: (filePath: string | null, replace?: boolean) => void;
  onToggleCheck: (path: string, kind: "file" | "dir") => void;
}) {
  return (
    <aside className="flex flex-col overflow-hidden border-r border-border">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">Package files</h2>
      </div>
      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            type="text"
            value={treeSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            data-page-search-target="true"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FileTree
          nodes={displayTree}
          selectedFile={selectedFile}
          expandedDirs={expandedDirs}
          checkedFiles={checkedFiles}
          onToggleDir={onToggleDir}
          onSelectFile={onSelectFile}
          onToggleCheck={onToggleCheck}
          wrapLabels={false}
        />
        {totalTaskChildren > visibleTaskChildren && !treeSearch && (
          <div className="px-4 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTaskLimitIncrease}
              className="w-full text-xs"
            >
              Show more issues ({visibleTaskChildren} of {totalTaskChildren})
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
