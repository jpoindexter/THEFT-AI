import type { KeyboardEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { statusBadge, statusBadgeDefault } from "../lib/status-colors";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Skeleton } from "./ui/skeleton";
import type { FileTreeNode, FileTreeProps } from "./file-tree/fileTreeModel";
import {
  TREE_ROW_HEIGHT_CLASS,
  checkboxState,
  fileTreeToneClass,
  flattenVisibleNodes,
} from "./file-tree/fileTreeModel";

export type {
  FileTreeBadge,
  FileTreeBadgeVariant,
  FileTreeEmptyState,
  FileTreeErrorState,
  FileTreeNode,
  FileTreeProps,
  FileTreeTone,
  FrontmatterData,
} from "./file-tree/fileTreeModel";
export {
  FRONTMATTER_FIELD_LABELS,
  buildFileTree,
  collectAllPaths,
  countFiles,
  parseFrontmatter,
} from "./file-tree/fileTreeModel";

function fileIcon(name: string) {
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return FileCode2;
  return FileText;
}

const FILE_TREE_DEPTH_INDENT_CLASSES = [
  "pl-2",
  "pl-8",
  "pl-14",
  "pl-20",
  "pl-26",
  "pl-32",
  "pl-38",
  "pl-44",
];

function depthIndentClass(depth: number) {
  return FILE_TREE_DEPTH_INDENT_CLASSES[Math.min(depth, FILE_TREE_DEPTH_INDENT_CLASSES.length - 1)];
}

export function FileTree({
  nodes,
  selectedFile,
  expandedDirs,
  checkedFiles,
  onToggleDir,
  onSelectFile,
  onToggleCheck,
  fileBadges,
  fileTones,
  renderFileExtra,
  fileRowClassName,
  showCheckboxes = true,
  wrapLabels = true,
  loading = false,
  error,
  empty,
  ariaLabel = "Files",
}: FileTreeProps) {
  const effectiveCheckedFiles = checkedFiles ?? new Set<string>();
  const visibleNodes = useMemo(
    () => flattenVisibleNodes(nodes, expandedDirs),
    [expandedDirs, nodes],
  );
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  function focusPath(path: string) {
    setFocusedPath(path);
    window.requestAnimationFrame(() => {
      rowRefs.current.get(path)?.focus();
    });
  }

  function toggleNode(node: FileTreeNode) {
    if (node.kind === "dir") onToggleDir(node.path);
    else onSelectFile(node.path);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number, node: FileTreeNode) {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = visibleNodes[Math.min(index + 1, visibleNodes.length - 1)];
        if (next) focusPath(next.node.path);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const previous = visibleNodes[Math.max(index - 1, 0)];
        if (previous) focusPath(previous.node.path);
        break;
      }
      case "ArrowRight":
        if (node.kind === "dir" && !expandedDirs.has(node.path)) {
          event.preventDefault();
          onToggleDir(node.path);
        }
        break;
      case "ArrowLeft":
        if (node.kind === "dir" && expandedDirs.has(node.path)) {
          event.preventDefault();
          onToggleDir(node.path);
        }
        break;
      case "Enter":
        event.preventDefault();
        toggleNode(node);
        break;
      case " ":
        if (showCheckboxes && onToggleCheck) {
          event.preventDefault();
          onToggleCheck(node.path, node.kind);
        }
        break;
    }
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-label={ariaLabel} role="tree" className="py-1">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className={cn("flex items-center gap-2 px-4", TREE_ROW_HEIGHT_CLASS)}>
            <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
            <Skeleton className={cn("h-3.5", row === 1 ? "w-3/5" : "w-4/5")} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div aria-label={ariaLabel} role="tree" className="p-3">
        <div
          role="treeitem"
          aria-level={1}
          className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                statusBadge.error ?? statusBadgeDefault,
              )}
            >
              error
            </span>
            <span className="min-w-0 text-destructive">{error.message}</span>
          </div>
          {error.retry && (
            <Button type="button" size="xs" variant="outline" onClick={error.retry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div aria-label={ariaLabel} role="tree" className="p-3">
        <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
          <div className="text-sm font-medium">{empty?.title ?? "No files"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {empty?.description ?? "Files will appear here when they are available."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-label={ariaLabel} role="tree">
      {visibleNodes.map(({ node, depth }, index) => {
        const expanded = node.kind === "dir" && expandedDirs.has(node.path);
        const { allChecked, someChecked } = checkboxState(node, effectiveCheckedFiles);
        const badge = fileBadges?.[node.path];
        const tone = fileTones?.[node.path] ?? "default";
        const extraClassName = node.kind === "file" ? fileRowClassName?.(node, allChecked) : undefined;
        const FileIcon = node.kind === "file" ? fileIcon(node.name) : null;
        const isSelected = node.kind === "file" && node.path === selectedFile;

        return (
          <div
            key={node.path}
            ref={(element) => {
              if (element) rowRefs.current.set(node.path, element);
              else rowRefs.current.delete(node.path);
            }}
            role="treeitem"
            aria-level={depth + 1}
            aria-expanded={node.kind === "dir" ? expanded : undefined}
            aria-selected={node.kind === "file" ? isSelected : undefined}
            aria-checked={showCheckboxes ? (someChecked ? "mixed" : allChecked) : undefined}
            tabIndex={(focusedPath ?? visibleNodes[0]?.node.path) === node.path ? 0 : -1}
            className={cn(
              node.kind === "dir"
                ? "group flex w-full items-center gap-1 pr-3 text-left text-sm text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                : "group flex w-full items-center gap-1 pr-3 text-left text-sm text-muted-foreground hover:bg-accent/30 hover:text-foreground cursor-pointer",
              depthIndentClass(depth),
              TREE_ROW_HEIGHT_CLASS,
              isSelected && "text-foreground bg-accent/20",
              fileTreeToneClass[tone],
              extraClassName,
              "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
            )}
            onFocus={() => setFocusedPath(node.path)}
            onClick={() => toggleNode(node)}
            onKeyDown={(event) => handleRowKeyDown(event, index, node)}
            data-file-tree-path={node.path}
          >
            {showCheckboxes && (
              <label className="flex items-center pl-2" onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={someChecked ? "indeterminate" : allChecked}
                  onCheckedChange={() => onToggleCheck?.(node.path, node.kind)}
                  className="mr-2"
                />
              </label>
            )}
            <span className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {node.kind === "dir" ? (
                  expanded ? (
                    <FolderOpen className="h-3.5 w-3.5" />
                  ) : (
                    <Folder className="h-3.5 w-3.5" />
                  )
                ) : FileIcon ? (
                  <FileIcon className="h-3.5 w-3.5" />
                ) : null}
              </span>
              <span className={cn("min-w-0", wrapLabels ? "break-all leading-4" : "truncate")}>
                {node.name}
              </span>
            </span>
            {badge && (
              <span
                className={cn(
                  "ml-3 shrink-0 rounded-full px-2 py-0.5 text-micro font-medium uppercase tracking-wide",
                  statusBadge[badge.status] ?? statusBadgeDefault,
                )}
                title={badge.tooltip}
              >
                {badge.label}
              </span>
            )}
            {node.kind === "file" && renderFileExtra?.(node, allChecked)}
            {node.kind === "dir" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto self-center text-muted-foreground opacity-70 transition-[background-color,color,opacity] group-hover:opacity-100 max-sm:hidden"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleDir(node.path);
                }}
                aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
