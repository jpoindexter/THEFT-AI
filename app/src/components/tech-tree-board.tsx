"use client";

import { useMemo, useRef, useState } from "react";
import { X, Folder, Box } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Eyebrow, ButtonPrimary } from "@/components/ui/primitives";
import { TreeCard, type TechNode } from "@/components/tech-tree-card";
import TechTreeArrows from "@/components/tech-tree-arrows";

const STAGES = [
  { key: "idea", label: "IDEA STAGE" },
  { key: "initial", label: "INITIAL STAGE" },
  { key: "identity", label: "IDENTITY STAGE" },
  { key: "build", label: "BUILD STAGE" },
  { key: "gtm", label: "GTM STAGE" },
  { key: "launch", label: "LAUNCH STAGE" },
  { key: "scale", label: "SCALE STAGE" },
  { key: "mature", label: "MATURE STAGE" },
];

/** BFS both directions from a root node ID, returning all node IDs in chain. */
function buildHighlightSet(rootId: string, nodes: TechNode[]): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const result = new Set<string>();
  const queue = [rootId];
  result.add(rootId);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const node = byId.get(cur);
    if (!node) continue;

    // Upstream: deps of current node
    for (const depId of node.dependencies) {
      if (!result.has(depId)) {
        result.add(depId);
        queue.push(depId);
      }
    }

    // Downstream: nodes that list current as a dependency
    for (const n of nodes) {
      if (n.dependencies.includes(cur) && !result.has(n.id)) {
        result.add(n.id);
        queue.push(n.id);
      }
    }
  }

  return result;
}

export default function TechTreeBoard({
  orgName,
  nodes,
}: {
  orgName: string;
  nodes: TechNode[];
}) {
  const [selected, setSelected] = useState<TechNode | null>(null);
  const [highlightRoot, setHighlightRoot] = useState<string | null>(null);
  const titlesById = new Map(nodes.map((n) => [n.id, n.title]));
  const scrollRef = useRef<HTMLDivElement>(null);

  const edges = nodes.flatMap((n) =>
    n.dependencies
      .filter((depId) => titlesById.has(depId))
      .map((depId) => ({ from: depId, to: n.id })),
  );

  const highlightedIds = useMemo<Set<string> | null>(
    () => (highlightRoot ? buildHighlightSet(highlightRoot, nodes) : null),
    [highlightRoot, nodes],
  );

  function handleSelect(n: TechNode) {
    setSelected(n);
    setHighlightRoot((prev) => (prev === n.id ? null : n.id));
  }

  function handleClose() {
    setSelected(null);
    setHighlightRoot(null);
  }

  return (
    <div className="absolute inset-0 bg-cream flex flex-col">
      <BoardHeader orgName={orgName} />
      <div ref={scrollRef} className="flex-1 overflow-auto p-6 relative">
        <TechTreeArrows
          edges={edges}
          containerRef={scrollRef}
          highlightedNodeIds={highlightedIds}
        />
        <div className="flex gap-8 min-w-max relative">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.key}
              label={stage.label}
              nodes={nodes
                .filter((n) => n.stage === stage.key)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))}
              selectedId={selected?.id ?? null}
              highlightedIds={highlightedIds}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
      {selected && (
        <DetailDrawer
          n={selected}
          allNodes={nodes}
          onClose={handleClose}
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
  highlightedIds,
  onSelect,
}: {
  label: string;
  nodes: TechNode[];
  selectedId: string | null;
  highlightedIds: Set<string> | null;
  onSelect: (n: TechNode) => void;
}) {
  // Gap #1: always render column even when empty
  return (
    <div className="w-52 flex flex-col gap-2">
      {/* Gap #2: stage count badge */}
      <Eyebrow className="px-1 mb-1 flex items-center gap-1">
        {label}
        <span className="text-2xs text-ink-soft bg-canvas border border-line/70 rounded px-1.5 ml-1 normal-case tracking-normal">
          {nodes.length}
        </span>
      </Eyebrow>
      {nodes.map((n) => {
        const highlighted = highlightedIds ? highlightedIds.has(n.id) : false;
        const dimmed = highlightedIds !== null && !highlightedIds.has(n.id);
        return (
          <TreeCard
            key={n.id}
            n={n}
            selected={selectedId === n.id}
            highlighted={highlighted}
            dimmed={dimmed}
            onSelect={() => onSelect(n)}
          />
        );
      })}
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
  const { org } = useParams<{ org: string }>();
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
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

        {/* Gap #3: description body text */}
        {n.description && (
          <p className="text-xs text-ink-muted leading-relaxed">{n.description}</p>
        )}

        {/* Gap #4: what_becomes_true as DrawerSection */}
        {n.what_becomes_true && (
          <DrawerSection label="What becomes true">
            <p className="text-xs text-ink-muted leading-relaxed">{n.what_becomes_true}</p>
          </DrawerSection>
        )}

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

        {/* Gap #7 & #8: TO COMPLETE badge logic */}
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
            <span className="text-xs text-ink flex-1 leading-snug">{n.checklist_item ?? n.title}</span>
            {/* Gap #8: Done badge for complete nodes */}
            {n.status === "complete" && (
              <span className="text-2xs text-sage-ink font-medium">Done</span>
            )}
            {/* Badge: status of the checklist item */}
            {n.status !== "complete" && n.status !== "locked" && (
              <span className="text-2xs text-mustard-ink bg-mustard/20 border border-mustard/40 rounded-full px-1.5 py-0.5 shrink-0">
                TASK QUEUED
              </span>
            )}
            {n.status === "locked" && (
              <span className="text-2xs text-ink-muted border border-line/70 rounded-full px-1.5 py-0.5">
                PENDING
              </span>
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
                  {/* Gap #6: status dot for complete deps */}
                  {d.status === "complete" && (
                    <span className="size-2 rounded-full bg-sage-ink shrink-0" />
                  )}
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
          <ButtonPrimary
            className="w-full"
            disabled={launching}
            onClick={async () => {
              setLaunching(true);
              try {
                const res = await fetch(`/api/${org}/tasks`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ description: n.title }),
                });
                const data = (await res.json()) as { task?: { id: string } };
                if (data.task?.id) {
                  router.push(`/${org}/tasks/${data.task.id}`);
                }
              } finally {
                setLaunching(false);
              }
            }}
          >
            {launching ? "Starting…" : "Launch Agent"}
          </ButtonPrimary>
        )}

        {/* External CTA (e.g. "Open domains" for buy-domain) */}
        {n.external_cta && n.status !== "complete" && (
          <a
            href={n.external_cta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong text-ink inline-block"
          >
            {n.external_cta.label}
          </a>
        )}

        {/* Gap #5: Mark complete button for manual nodes in available status */}
        {!n.agent_can_do_this && n.status === "available" && (
          <div className="flex flex-col items-stretch gap-1">
            <ButtonPrimary onClick={() => { /* no-op for now */ }}>Mark complete</ButtonPrimary>
            <button type="button" className="text-xs text-ink-muted hover:text-ink mt-1">
              ✗ Ask Operator
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
