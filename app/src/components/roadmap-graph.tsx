"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import { NODE_META, FALLBACK } from "@/components/how-to-build-node-meta";
import { DetailDrawer, type RoadmapNode } from "@/components/how-to-build-detail";

const STAGE_ORDER = [
  "idea",
  "initial",
  "identity",
  "build",
  "gtm",
  "launch",
  "scale",
  "mature",
] as const;

const STAGE_LABELS: Record<string, string> = {
  idea: "IDEA STAGE",
  initial: "INITIAL STAGE",
  identity: "IDENTITY STAGE",
  build: "BUILD STAGE",
  gtm: "GTM STAGE",
  launch: "LAUNCH STAGE",
  scale: "SCALE STAGE",
  mature: "MATURE STAGE",
};

type Edge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceId: string;
  targetId: string;
};

export default function RoadmapGraph({
  orgName,
  orgSlug,
  nodes,
}: {
  orgName: string;
  orgSlug: string;
  nodes: RoadmapNode[];
}) {
  const [selected, setSelected] = useState<RoadmapNode | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedRef = useRef<string | null>(null);

  // Drag-to-pan state
  const panRef = useRef<{ active: boolean; startClientX: number; startScrollLeft: number }>({
    active: false,
    startClientX: 0,
    startScrollLeft: 0,
  });
  const [panning, setPanning] = useState(false);

  // Keep selectedRef in sync so highlightNode can read it without stale closure
  useEffect(() => {
    selectedRef.current = selected?.id ?? null;
  }, [selected]);

  const highlightNode = useCallback((nodeId: string | null) => {
    const svg = svgRef.current;
    if (!svg) return;
    const activeId = nodeId ?? selectedRef.current;
    const paths = svg.querySelectorAll<SVGPathElement>("[data-edge-src],[data-edge-tgt]");
    paths.forEach((el) => {
      const src = el.getAttribute("data-edge-src");
      const tgt = el.getAttribute("data-edge-tgt");
      const isActive = activeId !== null && (src === activeId || tgt === activeId);
      if (isActive) {
        el.setAttribute("stroke-dasharray", "");
        el.setAttribute("stroke-width", "1.5");
        el.setAttribute("opacity", "0.9");
      } else {
        el.setAttribute("stroke-dasharray", "4 3");
        el.setAttribute("stroke-width", "1");
        el.setAttribute("opacity", "0.35");
      }
    });
  }, []);

  // Re-run highlight when selected changes (click path)
  useEffect(() => {
    highlightNode(null);
  }, [selected, highlightNode]);

  const stages = STAGE_ORDER.filter((s) => nodes.some((n) => n.stage === s));

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board || nodes.length === 0) return;
    const br = board.getBoundingClientRect();
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
          x1: sr.right - br.left,
          y1: sr.top - br.top + sr.height / 2,
          x2: tr.left - br.left,
          y2: tr.top - br.top + tr.height / 2,
          sourceId: depId,
          targetId: node.id,
        });
      }
    }
    setEdges(next);
  }, [nodes, selected]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-roadmap-node]")) return;
      const scroll = scrollRef.current;
      if (!scroll) return;
      panRef.current = {
        active: true,
        startClientX: e.clientX,
        startScrollLeft: scroll.scrollLeft,
      };
      setPanning(true);
      scroll.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!panRef.current.active) return;
      const scroll = scrollRef.current;
      if (!scroll) return;
      const dx = e.clientX - panRef.current.startClientX;
      scroll.scrollLeft = panRef.current.startScrollLeft - dx;
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    panRef.current.active = false;
    setPanning(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col">
      <GraphHeader orgName={orgName} orgSlug={orgSlug} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden select-none"
        style={{ cursor: panning ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={boardRef} className="flex h-full min-w-max relative">
          {/* SVG dependency lines */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "visible", pointerEvents: "none" }}
            aria-hidden
          >
            {edges.map((e, i) => {
              const isActive =
                selected?.id === e.sourceId || selected?.id === e.targetId;
              const midX = (e.x1 + e.x2) / 2;
              const r = 6;
              let d: string;
              if (Math.abs(e.y2 - e.y1) < 2) {
                d = `M ${e.x1} ${e.y1} H ${e.x2}`;
              } else {
                const dy = e.y2 > e.y1 ? r : -r;
                d = [
                  `M ${e.x1} ${e.y1}`,
                  `H ${midX - r}`,
                  `Q ${midX} ${e.y1} ${midX} ${e.y1 + dy}`,
                  `V ${e.y2 - dy}`,
                  `Q ${midX} ${e.y2} ${midX + r} ${e.y2}`,
                  `H ${e.x2}`,
                ].join(" ");
              }
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={isActive ? "1.5" : "1"}
                  strokeDasharray={isActive ? undefined : "4 3"}
                  opacity={isActive ? "0.9" : "0.35"}
                  data-edge-src={e.sourceId}
                  data-edge-tgt={e.targetId}
                  style={{ pointerEvents: "none" }}
                />
              );
            })}
          </svg>

          {/* Stage columns */}
          {stages.map((stage, si) => {
            const stageNodes = nodes
              .filter((n) => n.stage === stage)
              .sort((a, b) => a.position - b.position);
            const doneCount = stageNodes.filter(
              (n) => n.status === "complete",
            ).length;

            return (
              <div
                key={stage}
                className={`flex flex-col w-56 h-full border-r border-line/60 ${si === 0 ? "border-l" : ""}`}
              >
                <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
                  <span className="text-2xs uppercase tracking-widest text-ink-muted font-medium">
                    {STAGE_LABELS[stage] ?? stage.toUpperCase()}
                  </span>
                  <span className="text-2xs text-ink-soft">
                    {doneCount}/{stageNodes.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 relative z-[1]">
                  {stageNodes.map((n) => (
                    <NodeCard
                      key={n.id}
                      node={n}
                      selected={selected?.id === n.id}
                      onSelect={() => {
                        const next = selected?.id === n.id ? null : n;
                        setSelected(next);
                        highlightNode(next?.id ?? null);
                      }}
                      onHover={highlightNode}
                      setRef={(el) => {
                        if (el) cardRefs.current.set(n.id, el);
                        else cardRefs.current.delete(n.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <DetailDrawer
          node={selected}
          allNodes={nodes}
          onClose={() => setSelected(null)}
          orgSlug={orgSlug}
        />
      )}
    </div>
  );
}

function GraphHeader({
  orgName,
  orgSlug,
}: {
  orgName: string;
  orgSlug: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line/70 shrink-0 bg-paper">
      <div className="size-8 rounded-md bg-blue-50 border border-blue-200/70 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
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
      <a
        href={`/${orgSlug}`}
        className="ml-auto size-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
        aria-label="Close roadmap"
      >
        <X className="size-4" />
      </a>
    </div>
  );
}

function NodeCard({
  node,
  selected,
  onSelect,
  onHover,
  setRef,
}: {
  node: RoadmapNode;
  selected: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  setRef: (el: HTMLButtonElement | null) => void;
}) {
  const { icon: Icon, color } = NODE_META[node.slug] ?? FALLBACK;
  return (
    <button
      ref={setRef}
      type="button"
      data-roadmap-node={node.id}
      onClick={onSelect}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors bg-paper ${
        selected
          ? "border-amber-400 shadow-sm ring-1 ring-amber-200"
          : "border-line/70 hover:border-line-strong hover:shadow-sm"
      } ${node.status === "locked" ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${color}`}
        >
          <Icon className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink leading-snug truncate">
              {node.title}
            </span>
            {node.status === "complete" && (
              <span className="size-2 rounded-full bg-ink shrink-0" />
            )}
            {node.status === "in_progress" && (
              <span className="size-2 rounded-full bg-ink-muted shrink-0" />
            )}
            {node.status === "available" && (
              <span className="size-1.5 rounded-full bg-ink-soft shrink-0" />
            )}
          </div>
          <div className="text-2xs text-ink-muted mt-0.5">
            {node.status === "complete"
              ? "Complete"
              : node.status === "locked"
                ? "Needs earlier steps first"
                : node.agent_can_do_this
                  ? "Agent can do this"
                  : "Needs your input"}
          </div>
        </div>
      </div>
      {node.status === "available" && (
        <div className="mt-2">
          <span className="text-2xs uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium bg-canvas text-ink border-line">
            Available
          </span>
        </div>
      )}
    </button>
  );
}
