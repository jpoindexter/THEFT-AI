"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { NODE_META, FALLBACK } from "./how-to-build-node-meta";
import { DetailDrawer, type RoadmapNode } from "./how-to-build-detail";

type Edge = { x1: number; y1: number; x2: number; y2: number; sourceId: string; targetId: string };

const STAGE_LABELS: Record<string, string> = {
  idea: "IDEA STAGE", initial: "INITIAL STAGE", identity: "IDENTITY STAGE",
  build: "BUILD STAGE", gtm: "GTM STAGE", launch: "LAUNCH STAGE",
  scale: "SCALE STAGE", mature: "MATURE STAGE",
};
const STAGE_ORDER = ["idea", "initial", "identity", "build", "gtm", "launch", "scale", "mature"];

export default function HowToBuildModal({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const router = useRouter();
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [selected, setSelected] = useState<RoadmapNode | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    fetch(`/api/${orgSlug}/roadmap`).then((r) => r.json()).then((d) => setNodes(d.nodes ?? []));
  }, [orgSlug]);

  useLayoutEffect(() => {
    if (!boardRef.current || nodes.length === 0) return;
    const br = boardRef.current.getBoundingClientRect();
    const next: Edge[] = [];
    for (const node of nodes) {
      const tEl = cardRefs.current.get(node.id);
      if (!tEl) continue;
      const tr = tEl.getBoundingClientRect();
      for (const depId of node.dependencies) {
        const sEl = cardRefs.current.get(depId);
        if (!sEl) continue;
        const sr = sEl.getBoundingClientRect();
        next.push({
          x1: sr.right - br.left, y1: sr.top - br.top + sr.height / 2,
          x2: tr.left - br.left,  y2: tr.top - br.top + tr.height / 2,
          sourceId: depId, targetId: node.id,
        });
      }
    }
    setEdges(next);
  }, [nodes]);

  const stages = STAGE_ORDER.filter((s) => nodes.some((n) => n.stage === s));

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col" data-canvas-pan-block>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line/70 shrink-0 bg-paper">
        <div className="size-8 rounded-md bg-blue-50 border border-blue-200/70 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.2" fill="#3b82f6" opacity="0.9" />
            <rect x="9" y="1" width="6" height="6" rx="1.2" fill="#3b82f6" opacity="0.55" />
            <rect x="1" y="9" width="6" height="6" rx="1.2" fill="#3b82f6" opacity="0.55" />
            <rect x="9" y="9" width="6" height="6" rx="1.2" fill="#3b82f6" opacity="0.25" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-ink">How to Build a Company</div>
          <div className="text-xs text-ink-muted">{orgName}</div>
        </div>
        <button type="button" onClick={() => router.push(`/${orgSlug}`)}
          className="ml-auto size-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div ref={boardRef} className="flex h-full min-w-max relative">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
            {edges.map((e, i) => {
              const isActive = selected?.id === e.sourceId || selected?.id === e.targetId;
              const dx = Math.max(30, (e.x2 - e.x1) * 0.4);
              return (
                <path key={i}
                  d={`M ${e.x1} ${e.y1} C ${e.x1 + dx} ${e.y1} ${e.x2 - dx} ${e.y2} ${e.x2} ${e.y2}`}
                  fill="none"
                  stroke={isActive ? "#6366f1" : "#d1d5db"}
                  strokeWidth={isActive ? "1.5" : "1"}
                  strokeDasharray="4 3"
                  opacity={isActive ? "1" : "0.6"}
                />
              );
            })}
          </svg>

          {stages.map((stage, si) => {
            const stageNodes = nodes.filter((n) => n.stage === stage);
            const doneCount = stageNodes.filter((n) => n.status === "complete").length;
            return (
              <div key={stage}
                className={`flex flex-col w-56 h-full border-r border-line/60 ${si === 0 ? "border-l" : ""}`}
              >
                <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
                  <span className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">
                    {STAGE_LABELS[stage] ?? stage.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-ink-soft">{doneCount}/{stageNodes.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 relative z-[1]">
                  {stageNodes.map((n) => (
                    <NodeCard key={n.id} node={n}
                      selected={selected?.id === n.id}
                      onSelect={() => setSelected(selected?.id === n.id ? null : n)}
                      setRef={(el) => { if (el) cardRefs.current.set(n.id, el); else cardRefs.current.delete(n.id); }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <DetailDrawer node={selected} allNodes={nodes} onClose={() => setSelected(null)} orgSlug={orgSlug} />
      )}
    </div>
  );
}

function NodeCard({ node, selected, onSelect, setRef }: {
  node: RoadmapNode; selected: boolean; onSelect: () => void;
  setRef: (el: HTMLButtonElement | null) => void;
}) {
  const { icon: Icon, color } = NODE_META[node.slug] ?? FALLBACK;
  return (
    <button ref={setRef} type="button" onClick={onSelect}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors bg-paper ${
        selected
          ? "border-indigo-300 shadow-sm ring-1 ring-indigo-100"
          : "border-line/70 hover:border-line-strong hover:shadow-sm"
      } ${node.status === "locked" ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className={`size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
          <Icon className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink leading-snug truncate">{node.title}</span>
            {node.status === "complete" && <span className="size-2 rounded-full bg-emerald-400 shrink-0" />}
            {node.status === "in_progress" && <span className="size-2 rounded-full bg-amber-400 shrink-0" />}
            {node.status === "available" && <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">
            {node.status === "locked"
              ? "Needs earlier steps first"
              : node.agent_can_do_this ? "Agent can do this" : "Needs your input"}
          </div>
        </div>
      </div>
      {node.status === "available" && (
        <div className="mt-2">
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
            Available
          </span>
        </div>
      )}
    </button>
  );
}
