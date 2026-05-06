"use client";

import { useState } from "react";
import { X, Folder, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eyebrow, ButtonPrimary } from "@/components/ui/primitives";
import { TreeCard, type TechNode } from "@/components/tech-tree-card";

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

  return (
    <div className="absolute inset-0 bg-cream flex flex-col">
      <BoardHeader orgName={orgName} />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-8 min-w-max">
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
        <h1 className="text-md tracking-tight text-ink">
          How to Build a Company
        </h1>
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
    <div className="w-56 flex flex-col gap-2">
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

function DetailDrawer({
  n,
  onClose,
}: {
  n: TechNode;
  onClose: () => void;
}) {
  const params = useParams<{ org: string }>();
  return (
    <aside className="absolute right-0 top-[57px] bottom-0 w-80 bg-paper border-l border-line/70 p-5 overflow-y-auto">
      <header className="flex items-start justify-between mb-5">
        <div>
          <Eyebrow>{n.stage}</Eyebrow>
          <h2 className="text-md font-medium tracking-tight mt-1 text-ink">
            {n.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-ink-soft hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </header>
      {n.what_becomes_true && (
        <Section label="What becomes true" body={n.what_becomes_true} />
      )}
      {n.how_to_move_forward && (
        <Section label="How to move this forward" body={n.how_to_move_forward} />
      )}
      <ButtonPrimary
        className="mt-4 w-full"
        disabled={n.status === "locked"}
      >
        {n.agent_can_do_this ? "Launch Agent" : "Mark complete"}
      </ButtonPrimary>
      <Link
        href={`/${params.org}/roadmap/${n.slug}`}
        className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-md border border-line bg-paper text-sm py-2 hover:border-line-strong"
      >
        Open detail <ArrowUpRight className="size-3" />
      </Link>
    </aside>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="mb-5">
      <Eyebrow className="mb-1.5">{label}</Eyebrow>
      <p className="text-base text-ink leading-snug">{body}</p>
    </div>
  );
}
