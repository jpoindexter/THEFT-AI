"use client";

import { useRef, useState } from "react";
import { X, Folder, Box } from "lucide-react";
import { useParams } from "next/navigation";
import { Eyebrow, ButtonPrimary } from "@/components/ui/primitives";
import { TreeCard, type TechNode } from "@/components/tech-tree-card";
import TechTreeArrows from "@/components/tech-tree-arrows";

const STAGES = [
  { key: "idea", label: "IDEA STAGE" },
  { key: "initial", label: "INITIAL STAGE" },
  { key: "identity", label: "IDENTITY STAGE" },
  { key: "build", label: "BUILD STAGE" },
  { key: "live", label: "LIVE STAGE" },
  { key: "launch", label: "LAUNCH STAGE" },
  { key: "scale", label: "SCALE STAGE" },
];

export default function TechTreeBoard({
  orgName,
  nodes,
}: {
  orgName: string;
  nodes: TechNode[];
}) {
  const [selected, setSelected] = useState<TechNode | null>(null);
  const titlesById = new Map(nodes.map((n) => [n.id, n.title]));
  const scrollRef = useRef<HTMLDivElement>(null);

  const edges = nodes.flatMap((n) =>
    n.dependencies
      .filter((depId) => titlesById.has(depId))
      .map((depId) => ({ from: depId, to: n.id })),
  );

  return (
    <div className="absolute inset-0 bg-cream flex flex-col">
      <BoardHeader orgName={orgName} />
      <div ref={scrollRef} className="flex-1 overflow-auto p-6 relative">
        <TechTreeArrows edges={edges} containerRef={scrollRef} />
        <div className="flex gap-8 min-w-max relative">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.key}
              label={stage.label}
              nodes={nodes
                .filter((n) => n.stage === stage.key)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>
      {selected && (
        <DetailDrawer
          n={selected}
          allNodes={nodes}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function BoardHeader({ orgName }: { orgName: string }) {
  return (
    <div className="px-6 py-4 flex items-center gap-3 border-b border-line/70">
      <div className="size-8 rounded-md bg-cream inline-flex items-center justify-center">
        <Folder className="size-4 text-ink-muted" />
      </div>
      <div>
        <h1 className="text-md tracking-tight text-ink">How to Build a Company</h1>
        <p className="text-xs text-ink-muted">{orgName}</p>
      </div>
    </div>
  );
}

function StageColumn({
  label,
  nodes,
  selectedId,
  onSelect,
}: {
  label: string;
  nodes: TechNode[];
  selectedId: string | null;
  onSelect: (n: TechNode) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="w-52 flex flex-col gap-2">
      <Eyebrow className="px-1 mb-1">{label}</Eyebrow>
      {nodes.map((n) => (
        <TreeCard
          key={n.id}
          n={n}
          selected={selectedId === n.id}
          onSelect={() => onSelect(n)}
        />
      ))}
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
    <div className="space-y-2">
      <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">{label}</div>
      {children}
    </div>
  );
}

function DetailDrawer({
  n,
  allNodes,
  onClose,
}: {
  n: TechNode;
  allNodes: TechNode[];
  onClose: () => void;
}) {
  useParams<{ org: string }>();
  const deps = n.dependencies
    .map((id) => allNodes.find((x) => x.id === id))
    .filter((x): x is TechNode => Boolean(x));
  const unblocks = allNodes.filter((x) => x.dependencies.includes(n.id));
  const incompleteDeps = deps.filter((d) => d.status !== "complete");

  return (
    <aside className="absolute right-0 top-[57px] bottom-0 w-80 bg-paper border-l border-line/70 overflow-y-auto">
      <div className="px-4 py-3 border-b border-line/70 flex items-center justify-between">
        <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
          {n.stage.toUpperCase()}
        </span>
        <button
          onClick={onClose}
          className="text-ink-soft hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {(() => {
          const headline = n.what_becomes_true ?? n.title;
          const headlineIsWBT = Boolean(n.what_becomes_true);
          return (
            <div className="space-y-2">
              <div className="size-8 rounded-md border border-line/70 bg-canvas flex items-center justify-center">
                <Box className="size-4 text-ink-soft" />
              </div>
              <h2 className="text-xl font-medium tracking-tight text-ink leading-snug">{headline}</h2>
              {headlineIsWBT ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-2xs text-ink-muted border border-line/70 rounded-full px-2 py-0.5">
                    {n.title}
                  </span>
                  <span className="text-2xs text-ink-muted border border-line/70 rounded-full px-2 py-0.5">
                    {n.agent_can_do_this ? "Agent can do this" : "Needs your input"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  {n.agent_can_do_this ? "Agent can do this" : "Needs your input"}
                </p>
              )}
            </div>
          );
        })()}

        {n.status === "locked" && incompleteDeps.length > 0 && (
          <DrawerSection label="LOCKED CONTEXT">
            <p className="text-xs text-ink-muted">Needs earlier steps first</p>
            <p className="text-2xs text-ink-soft">
              Complete {incompleteDeps.length} prerequisite
              {incompleteDeps.length > 1 ? "s" : ""} before this is ready.
            </p>
          </DrawerSection>
        )}

        {n.how_to_move_forward && (
          <DrawerSection label="HOW TO MOVE THIS FORWARD">
            <p className="text-xs text-ink leading-snug">{n.how_to_move_forward}</p>
          </DrawerSection>
        )}

        <DrawerSection label="TO COMPLETE">
          <div className="flex items-center gap-2 rounded-md border border-line/70 px-2.5 py-1.5">
            <div
              className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                n.status === "complete"
                  ? "bg-sage/60 border-sage/60"
                  : "border-line"
              }`}
            >
              {n.status === "complete" && (
                <span className="text-[8px] leading-none text-paper">✓</span>
              )}
            </div>
            <span className="text-xs text-ink flex-1 leading-snug">{n.title}</span>
            {n.status !== "complete" && n.status !== "locked" && (
              n.agent_can_do_this ? (
                <span className="text-2xs text-ink-muted border border-line/70 rounded-full px-1.5 py-0.5">
                  Launch
                </span>
              ) : (
                <span className="text-2xs text-ink-muted border border-line/70 rounded-full px-1.5 py-0.5">
                  SETUP
                </span>
              )
            )}
          </div>
        </DrawerSection>

        {deps.length > 0 && (
          <DrawerSection label="REQUIRED FIRST">
            <ul className="space-y-1">
              {deps.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-2 rounded-md border border-line/70 px-2.5 py-1.5 text-xs"
                >
                  <span className="flex-1 text-ink leading-snug">{d.title}</span>
                  <span className="text-2xs uppercase text-ink-soft shrink-0">
                    {d.stage.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </DrawerSection>
        )}

        {unblocks.length > 0 && (
          <DrawerSection label="COMPLETING THIS UNLOCKS">
            <ul className="space-y-1">
              {unblocks.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-2 rounded-md border border-line/70 px-2.5 py-1.5 text-xs"
                >
                  <span className="flex-1 text-ink leading-snug">{u.title}</span>
                  <span className="text-2xs uppercase text-ink-soft shrink-0">
                    {u.stage.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </DrawerSection>
        )}

        {n.agent_can_do_this && n.status !== "locked" && (
          <ButtonPrimary className="w-full">Launch Agent</ButtonPrimary>
        )}
      </div>
    </aside>
  );
}
