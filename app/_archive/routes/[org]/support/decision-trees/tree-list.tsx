"use client";

import { useState } from "react";
import { GitFork, ChevronDown } from "lucide-react";

export type TreeNode = {
  label: string;
  children?: TreeNode[];
};

export type DecisionTree = {
  id: string;
  title: string;
  nodeCount: number;
  updatedAt: string;
  tree: TreeNode;
};

function TreeNodeRow({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <li>
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}
      >
        {depth > 0 && (
          <span className="text-ink-soft select-none shrink-0">└</span>
        )}
        <span
          className={`text-xs rounded px-1.5 py-0.5 border ${
            node.children && node.children.length > 0
              ? "border-line/70 bg-canvas text-ink"
              : "border-line/40 bg-paper text-ink-muted"
          }`}
        >
          {node.label}
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="border-l border-line/40 ml-2">
          {node.children.map((child, i) => (
            <TreeNodeRow key={i} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TreeList({ trees }: { trees: DecisionTree[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {trees.map((tree) => {
        const isOpen = openId === tree.id;
        return (
          <div
            key={tree.id}
            className="rounded-lg border border-line/70 bg-paper overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : tree.id)}
              className="w-full flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-canvas transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-md border border-line/70 bg-canvas flex items-center justify-center shrink-0">
                  <GitFork className="size-4 text-ink-muted" />
                </div>
                <div>
                  <div className="text-base font-medium text-ink">{tree.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {tree.nodeCount} nodes · Updated {tree.updatedAt}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`size-4 text-ink-soft transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-4 border-t border-line/40">
                <p className="text-xs text-ink-muted mb-3 pt-3">Node structure</p>
                <ul>
                  <TreeNodeRow node={tree.tree} depth={0} />
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
