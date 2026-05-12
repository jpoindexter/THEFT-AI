"use client";

import { useState, useMemo, useRef } from "react";
import { Lock, ArrowRight, X, ExternalLink, Plus } from "lucide-react";

type NodeStatus = "locked" | "available" | "in_progress" | "complete";

type RNode = {
  id: string;
  slug: string;
  stage: string;
  title: string;
  description: string | null;
  how_to_move_forward: string | null;
  dependencies: string[];
  department?: string;
  status: NodeStatus;
  agent_can_do_this: boolean;
};

const STAGES = [
  { id: "idea", name: "Idea" },
  { id: "initial", name: "Initial" },
  { id: "identity", name: "Identity" },
  { id: "build", name: "Build" },
  { id: "gtm", name: "GTM" },
  { id: "launch", name: "Launch" },
  { id: "scale", name: "Scale" },
  { id: "mature", name: "Mature" },
];

const NODE_W = 220;
const NODE_H = 64;
const COL_W = 244;
const ROW_GAP = 12;

const STATUS_LABEL: Record<NodeStatus, string> = {
  locked: "Locked",
  available: "Available",
  in_progress: "In progress",
  complete: "Complete",
};

function DotIndicator({ status }: { status: NodeStatus }) {
  if (status === "in_progress")
    return (
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--t-ink)",
          animation: "pulse 1.6s ease-in-out infinite",
          display: "inline-block",
        }}
      />
    );
  if (status === "complete")
    return (
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--t-sage)",
          display: "inline-block",
        }}
      />
    );
  if (status === "available")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 16,
          padding: "0 6px",
          borderRadius: 4,
          fontSize: 9.5,
          fontWeight: 400,
          letterSpacing: "0.05em",
          textTransform: "uppercase" as const,
          background: "transparent",
          color: "var(--t-ink-muted)",
          border: "1px solid var(--t-line-strong)",
        }}
      >
        AVAIL
      </span>
    );
  return <Lock size={11} style={{ color: "var(--t-ink-soft)" }} />;
}

function NodeCard({
  node,
  isHovered,
  dim,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  node: RNode;
  isHovered: boolean;
  dim: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const isLocked = node.status === "locked";
  const isComplete = node.status === "complete";
  const isProgress = node.status === "in_progress";

  const borderColor = isProgress
    ? "var(--t-ink-muted)"
    : isComplete
      ? "var(--t-sage)"
      : "var(--t-line)";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={isLocked ? undefined : onClick}
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        background: "var(--t-paper)",
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        padding: "8px 10px",
        opacity: isLocked ? 0.42 : dim ? 0.4 : 1,
        cursor: isLocked ? "default" : "pointer",
        transition: "opacity 200ms, border-color 200ms, transform 120ms",
        transform: isHovered && !isLocked ? "translateY(-1px)" : "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <DotIndicator status={node.status} />
        <div style={{ flex: 1 }} />
        {node.department && (
          <span
            style={{
              fontSize: 10,
              color: "var(--t-ink-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {node.department.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.3,
          color: "var(--t-ink)",
        }}
      >
        {node.title}
      </div>
      <div style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>
        {isLocked ? "Needs earlier steps" : STATUS_LABEL[node.status]}
      </div>
    </div>
  );
}

function connectorPath(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const dx = (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function NodeDrawer({
  node,
  nodes,
  onClose,
  orgSlug,
}: {
  node: RNode;
  nodes: RNode[];
  onClose: () => void;
  orgSlug: string;
}) {
  const prereqs = node.dependencies.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as RNode[];
  const downstream = nodes.filter((n) => n.dependencies.includes(node.id));

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: "var(--t-paper)",
        borderLeft: "1px solid var(--t-line)",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        animation: "slideInRight 220ms cubic-bezier(0.2,0.7,0.2,1) both",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px 10px",
          borderBottom: "1px solid var(--t-line)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--t-ink-muted)",
            }}
          >
            {node.stage} stage
            {node.department ? ` · ${node.department}` : ""}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "var(--t-ink-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "var(--t-ink)",
            marginBottom: 8,
          }}
        >
          {node.title}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {node.department && (
            <Pill>{node.department}</Pill>
          )}
          {node.status === "available" && <Pill tone="mustard">Agent can do this</Pill>}
          {node.status === "in_progress" && <Pill tone="mustard">Running now</Pill>}
          {node.status === "complete" && <Pill tone="sage">Complete</Pill>}
          {node.status === "locked" && <Pill>Needs your input</Pill>}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 18px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {node.how_to_move_forward && (
          <DrawerSection label="How to move this forward">
            <p
              style={{
                margin: 0,
                color: "var(--t-ink-muted)",
                lineHeight: 1.55,
                fontSize: 13,
              }}
            >
              {node.how_to_move_forward}
            </p>
          </DrawerSection>
        )}

        {prereqs.length > 0 && (
          <DrawerSection label="Required first">
            {prereqs.map((p) => {
              const ok = p.status === "complete";
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 0",
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: ok ? "var(--t-sage)" : "var(--t-line-strong)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ flex: 1, color: ok ? "var(--t-ink)" : "var(--t-ink-muted)" }}
                  >
                    {p.title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>
                    {ok ? "Done" : STATUS_LABEL[p.status]}
                  </span>
                </div>
              );
            })}
          </DrawerSection>
        )}

        {downstream.length > 0 && (
          <DrawerSection label="Completing this unlocks">
            {downstream.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 0",
                  fontSize: 13,
                  gap: 8,
                }}
              >
                <ArrowRight size={12} style={{ color: "var(--t-ink-soft)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{d.title}</span>
                <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>
                  {d.department}
                </span>
              </div>
            ))}
          </DrawerSection>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: "1px solid var(--t-line)",
          padding: 14,
          background: "var(--t-paper)",
          display: "flex",
          gap: 8,
        }}
      >
        <button
          style={{
            flex: 1,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "var(--t-ink)",
            color: "var(--t-paper)",
            border: "1px solid var(--t-ink)",
            borderRadius: 4,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {node.status === "in_progress" ? "Open running task" : "Launch agent"}
          <ArrowRight size={14} />
        </button>
        <button
          style={{
            width: 44,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid var(--t-line-strong)",
            borderRadius: 4,
            color: "var(--t-ink-muted)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          aria-label="Open in new tab"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}

function DrawerSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--t-ink-muted)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "mustard" | "sage" | "brick";
}) {
  const colors = {
    mustard: {
      bg: "rgba(0,0,0,0.06)",
      color: "var(--t-ink-muted)",
      border: "rgba(0,0,0,0.2)",
    },
    sage: {
      bg: "rgba(74,140,92,0.1)",
      color: "var(--t-sage)",
      border: "rgba(74,140,92,0.35)",
    },
    brick: {
      bg: "rgba(176,88,88,0.1)",
      color: "var(--t-brick)",
      border: "rgba(176,88,88,0.35)",
    },
  };
  const c = tone ? colors[tone] : null;
  return (
    <span
      style={{
        height: 22,
        padding: "0 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: "-0.01em",
        background: c ? c.bg : "transparent",
        color: c ? c.color : "var(--t-ink-muted)",
        border: `1px solid ${c ? c.border : "var(--t-line-strong)"}`,
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function RoadmapView({
  nodes,
  orgName,
  orgSlug,
}: {
  nodes: RNode[];
  orgName: string;
  orgSlug: string;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);

  const layout = useMemo(() => {
    const cols = STAGES.map((s) => nodes.filter((n) => n.stage === s.id));
    const pos: Record<
      string,
      { x: number; y: number; w: number; h: number; col: number; row: number }
    > = {};
    cols.forEach((col, cIdx) => {
      col.forEach((node, rIdx) => {
        pos[node.id] = {
          x: cIdx * COL_W,
          y: rIdx * (NODE_H + ROW_GAP) + 40,
          w: NODE_W,
          h: NODE_H,
          col: cIdx,
          row: rIdx,
        };
      });
    });
    const maxRows = Math.max(...cols.map((c) => c.length), 1);
    const height = maxRows * (NODE_H + ROW_GAP) + 60;
    const width = STAGES.length * COL_W;
    return { pos, cols, height, width };
  }, [nodes]);

  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    nodes.forEach((n) => {
      n.dependencies.forEach((depId) => {
        if (layout.pos[depId] && layout.pos[n.id]) {
          result.push({ from: depId, to: n.id });
        }
      });
    });
    return result;
  }, [nodes, layout]);

  const hoveredEdges = useMemo(() => {
    if (!hoverId) return new Set<string>();
    const s = new Set<string>();
    edges.forEach((e) => {
      if (e.from === hoverId || e.to === hoverId) {
        s.add(`${e.from}->${e.to}`);
      }
    });
    return s;
  }, [hoverId, edges]);

  const stageStats = STAGES.map((s) => {
    const list = nodes.filter((n) => n.stage === s.id);
    const done = list.filter((n) => n.status === "complete").length;
    return { ...s, done, total: list.length };
  });

  const counts = {
    complete: nodes.filter((n) => n.status === "complete").length,
    in_progress: nodes.filter((n) => n.status === "in_progress").length,
    available: nodes.filter((n) => n.status === "available").length,
  };

  const drawerNode = drawerNodeId ? nodes.find((n) => n.id === drawerNodeId) ?? null : null;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        background: "var(--t-canvas)",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 28px 14px",
          borderBottom: "1px solid var(--t-line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: "var(--t-ink-muted)",
              }}
            >
              Company roadmap
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "var(--t-ink)",
              }}
            >
              {orgName}
              <span style={{ color: "var(--t-ink-soft)", fontWeight: 400 }}>
                {" "}— from idea to mature.
              </span>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Pill>{counts.complete} complete</Pill>
            <Pill tone="mustard">{counts.in_progress} in progress</Pill>
            <Pill>{counts.available} available</Pill>
            <button
              style={{
                marginLeft: 6,
                height: 26,
                padding: "0 10px",
                borderRadius: 4,
                fontSize: 13,
                background: "transparent",
                border: "1px solid var(--t-line-strong)",
                color: "var(--t-ink-muted)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "inherit",
              }}
            >
              <Plus size={13} /> Add capability
            </button>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            color: "var(--t-ink-muted)",
            fontSize: 12,
          }}
        >
          The tree below is your full build. Hover any card to see what depends on it. Click to launch the agent.
        </div>
      </div>

      {/* Roadmap grid */}
      <div style={{ padding: "20px 28px 40px", position: "relative" }}>
        <div
          style={{
            position: "relative",
            width: layout.width,
            height: layout.height,
            paddingBottom: 8,
          }}
        >
          {/* Stage headers */}
          {STAGES.map((s, i) => {
            const stats = stageStats[i];
            return (
              <div
                key={s.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: i * COL_W,
                  width: NODE_W,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 2px 8px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    color: "var(--t-ink)",
                  }}
                >
                  {s.name}
                </div>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--t-ink-soft)",
                    fontFamily: "inherit",
                  }}
                >
                  {stats.done}/{stats.total}
                </span>
              </div>
            );
          })}

          {/* Column dividers */}
          {STAGES.slice(0, -1).map((s, i) => (
            <div
              key={s.id}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: i * COL_W + NODE_W + (COL_W - NODE_W) / 2 - 1,
                width: 1,
                background: "var(--t-line)",
                opacity: 0.5,
              }}
            />
          ))}

          {/* SVG connectors */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
            }}
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
          >
            {edges.map((e) => {
              const a = layout.pos[e.from];
              const b = layout.pos[e.to];
              if (!a || !b) return null;
              const key = `${e.from}->${e.to}`;
              const isHi = hoveredEdges.has(key);
              const isDim = hoverId !== null && !isHi;
              return (
                <path
                  key={key}
                  d={connectorPath(a, b)}
                  fill="none"
                  stroke={isHi ? "var(--t-ink-muted)" : "var(--t-line-strong)"}
                  strokeWidth={isHi ? 1.5 : 1}
                  strokeDasharray={isHi ? "none" : "2 4"}
                  opacity={isDim ? 0.2 : 1}
                  style={{ transition: "stroke 200ms, stroke-width 200ms, opacity 200ms" }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((n) => {
            const p = layout.pos[n.id];
            if (!p) return null;
            const isDim =
              hoverId !== null &&
              hoverId !== n.id &&
              !hoveredEdges.has(`${hoverId}->${n.id}`) &&
              !hoveredEdges.has(`${n.id}->${hoverId}`);
            return (
              <div
                key={n.id}
                style={{ position: "absolute", left: p.x, top: p.y, zIndex: 1 }}
              >
                <NodeCard
                  node={n}
                  isHovered={hoverId === n.id}
                  dim={isDim}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setDrawerNodeId(n.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Node drawer */}
      {drawerNode && (
        <NodeDrawer
          node={drawerNode}
          nodes={nodes}
          onClose={() => setDrawerNodeId(null)}
          orgSlug={orgSlug}
        />
      )}
    </div>
  );
}
