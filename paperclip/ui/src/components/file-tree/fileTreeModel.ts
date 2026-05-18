import type { ReactNode } from "react";

export type FileTreeNode = {
  name: string;
  path: string;
  kind: "dir" | "file";
  children: FileTreeNode[];
  /** Optional per-node metadata (e.g. import action) */
  action?: string | null;
};

export type FileTreeBadgeVariant = "ok" | "warning" | "error" | "info" | "pending";

export type FileTreeBadge = {
  label: string;
  status: FileTreeBadgeVariant;
  tooltip?: string;
};

export type FileTreeTone = "default" | "warning" | "error" | "muted";

export type FileTreeEmptyState = {
  title?: string;
  description?: string;
};

export type FileTreeErrorState = {
  message: string;
  retry?: () => void;
};

export type VisibleFileTreeNode = {
  node: FileTreeNode;
  depth: number;
};

export type FileTreeProps = {
  nodes: FileTreeNode[];
  selectedFile: string | null;
  expandedDirs: Set<string>;
  checkedFiles?: Set<string>;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
  onToggleCheck?: (path: string, kind: "file" | "dir") => void;
  /** Serializable badge metadata keyed by path. This is safe to expose through plugin UI contracts. */
  fileBadges?: Record<string, FileTreeBadge | undefined>;
  /** Closed row tone metadata keyed by path. This avoids raw host class names in public contracts. */
  fileTones?: Record<string, FileTreeTone | undefined>;
  /** Internal-only escape hatch for current host call sites that need richer row content. */
  renderFileExtra?: (node: FileTreeNode, checked: boolean) => ReactNode;
  /** @deprecated Use fileTones for public surfaces. Kept for compatibility with host-only callers. */
  fileRowClassName?: (node: FileTreeNode, checked: boolean) => string | undefined;
  showCheckboxes?: boolean;
  /** Allow long file and directory names to wrap instead of forcing horizontal overflow. */
  wrapLabels?: boolean;
  loading?: boolean;
  error?: FileTreeErrorState | null;
  empty?: FileTreeEmptyState;
  ariaLabel?: string;
};

export const TREE_ROW_HEIGHT_CLASS = "min-h-9";

export const fileTreeToneClass: Record<FileTreeTone, string | undefined> = {
  default: undefined,
  warning: "bg-amber-500/5 text-amber-700 dark:text-amber-300",
  error: "bg-destructive/5 text-destructive",
  muted: "opacity-50",
};

export function buildFileTree(
  files: Record<string, unknown>,
  actionMap?: Map<string, string>,
): FileTreeNode[] {
  const root: FileTreeNode = { name: "", path: "", kind: "dir", children: [] };

  for (const filePath of Object.keys(files)) {
    const segments = filePath.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isLeaf = i === segments.length - 1;
      let next = current.children.find((child) => child.name === segment);
      if (!next) {
        next = {
          name: segment,
          path: currentPath,
          kind: isLeaf ? "file" : "dir",
          children: [],
          action: isLeaf ? (actionMap?.get(filePath) ?? null) : null,
        };
        current.children.push(next);
      }
      current = next;
    }
  }

  function sortNode(node: FileTreeNode) {
    node.children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "file" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  }

  sortNode(root);
  return root.children;
}

export function countFiles(nodes: FileTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.kind === "file") count++;
    else count += countFiles(node.children);
  }
  return count;
}

export function collectAllPaths(
  nodes: FileTreeNode[],
  type: "file" | "dir" | "all" = "all",
): Set<string> {
  const paths = new Set<string>();
  for (const node of nodes) {
    if (type === "all" || node.kind === type) paths.add(node.path);
    for (const path of collectAllPaths(node.children, type)) paths.add(path);
  }
  return paths;
}

export function flattenVisibleNodes(
  nodes: FileTreeNode[],
  expandedDirs: Set<string>,
  depth = 0,
): VisibleFileTreeNode[] {
  const flattened: VisibleFileTreeNode[] = [];
  for (const node of nodes) {
    flattened.push({ node, depth });
    if (node.kind === "dir" && expandedDirs.has(node.path)) {
      flattened.push(...flattenVisibleNodes(node.children, expandedDirs, depth + 1));
    }
  }
  return flattened;
}

export function checkboxState(node: FileTreeNode, checkedFiles: Set<string>) {
  if (node.kind === "file") {
    return {
      allChecked: checkedFiles.has(node.path),
      someChecked: false,
    };
  }

  const childFilePaths = [...collectAllPaths(node.children, "file")];
  const allChecked = childFilePaths.length > 0 && childFilePaths.every((path) => checkedFiles.has(path));
  const someChecked = childFilePaths.some((path) => checkedFiles.has(path));
  return { allChecked, someChecked: someChecked && !allChecked };
}

export type FrontmatterData = Record<string, string | string[]>;

export function parseFrontmatter(content: string): { data: FrontmatterData; body: string } | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const data: FrontmatterData = {};
  const rawYaml = match[1];
  const body = match[2];
  let currentKey: string | null = null;
  let currentList: string[] | null = null;

  for (const line of rawYaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("- ") && currentKey) {
      if (!currentList) currentList = [];
      currentList.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    if (currentKey && currentList) {
      data[currentKey] = currentList;
      currentList = null;
      currentKey = null;
    }

    const kvMatch = trimmed.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim().replace(/^["']|["']$/g, "");
      if (val === "null") {
        currentKey = null;
        continue;
      }
      if (val) {
        data[key] = val;
        currentKey = null;
      } else {
        currentKey = key;
      }
    }
  }

  if (currentKey && currentList) {
    data[currentKey] = currentList;
  }

  return Object.keys(data).length > 0 ? { data, body } : null;
}

export const FRONTMATTER_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  title: "Title",
  kind: "Kind",
  reportsTo: "Reports to",
  skills: "Skills",
  status: "Status",
  description: "Description",
  priority: "Priority",
  assignee: "Assignee",
  project: "Project",
  recurring: "Recurring",
  targetDate: "Target date",
};
