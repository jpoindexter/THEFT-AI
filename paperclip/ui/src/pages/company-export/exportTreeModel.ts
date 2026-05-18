import type { FileTreeNode } from "../../components/FileTree";
import { collectAllPaths } from "../../components/FileTree";

export const TASKS_PAGE_SIZE = 10;

export function filterTree(nodes: FileTreeNode[], query: string): FileTreeNode[] {
  if (!query) return nodes;
  const lower = query.toLowerCase();
  return nodes
    .map((node) => {
      if (node.kind === "file") {
        return node.name.toLowerCase().includes(lower) || node.path.toLowerCase().includes(lower)
          ? node
          : null;
      }
      const filteredChildren = filterTree(node.children, query);
      return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
    })
    .filter((n): n is FileTreeNode => n !== null);
}

export function collectMatchedParentDirs(nodes: FileTreeNode[], query: string): Set<string> {
  const dirs = new Set<string>();
  const lower = query.toLowerCase();

  function walk(node: FileTreeNode, ancestors: string[]) {
    if (node.kind === "file") {
      if (node.name.toLowerCase().includes(lower) || node.path.toLowerCase().includes(lower)) {
        for (const a of ancestors) dirs.add(a);
      }
    } else {
      for (const child of node.children) {
        walk(child, [...ancestors, node.path]);
      }
    }
  }

  for (const node of nodes) walk(node, []);
  return dirs;
}

export function sortByChecked(nodes: FileTreeNode[], checkedFiles: Set<string>): FileTreeNode[] {
  return nodes
    .map((node) => {
      if (node.kind === "dir") {
        return { ...node, children: sortByChecked(node.children, checkedFiles) };
      }
      return node;
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "file" ? -1 : 1;
      if (a.kind === "file" && b.kind === "file") {
        const aChecked = checkedFiles.has(a.path);
        const bChecked = checkedFiles.has(b.path);
        if (aChecked !== bChecked) return aChecked ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
}

export function paginateTaskNodes(
  nodes: FileTreeNode[],
  limit: number,
  checkedFiles: Set<string>,
  searchQuery: string,
): { nodes: FileTreeNode[]; totalTaskChildren: number; visibleTaskChildren: number } {
  let totalTaskChildren = 0;
  let visibleTaskChildren = 0;

  const result = nodes.map((node) => {
    if (node.kind === "dir" && node.name === "tasks") {
      totalTaskChildren = node.children.length;
      const pinned: FileTreeNode[] = [];
      const rest: FileTreeNode[] = [];
      const lower = searchQuery.toLowerCase();

      for (const child of node.children) {
        const childFiles = collectAllPaths([child], "file");
        const isChecked = [...childFiles].some((p) => checkedFiles.has(p));
        const isSearchMatch = searchQuery && (
          child.name.toLowerCase().includes(lower) ||
          child.path.toLowerCase().includes(lower) ||
          [...childFiles].some((p) => p.toLowerCase().includes(lower))
        );
        if (isChecked || isSearchMatch) {
          pinned.push(child);
        } else {
          rest.push(child);
        }
      }

      const remaining = Math.max(0, limit - pinned.length);
      const visible = [...pinned, ...rest.slice(0, remaining)];
      visibleTaskChildren = visible.length;
      return { ...node, children: visible };
    }
    return node;
  });

  return { nodes: result, totalTaskChildren, visibleTaskChildren };
}

export function filePathFromLocation(pathname: string): string | null {
  const marker = "/company/export/files/";
  const idx = pathname.indexOf(marker);
  if (idx === -1) return null;
  const filePath = decodeURIComponent(pathname.slice(idx + marker.length));
  return filePath || null;
}

export function expandAncestors(filePath: string): string[] {
  const parts = filePath.split("/").slice(0, -1);
  const dirs: string[] = [];
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    dirs.push(current);
  }
  return dirs;
}

export function findTreeNode(nodes: FileTreeNode[], target: string): FileTreeNode | null {
  for (const node of nodes) {
    if (node.path === target) return node;
    if (node.kind === "dir") {
      const found = findTreeNode(node.children, target);
      if (found) return found;
    }
  }
  return null;
}
