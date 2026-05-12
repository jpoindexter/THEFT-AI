import { Pill } from "@/components/ui/primitives";
import { Box } from "lucide-react";

export type TechNode = {
  id: string;
  slug: string;
  stage: string;
  title: string;
  description: string | null;
  what_becomes_true: string | null;
  how_to_move_forward: string | null;
  checklist_item: string | null;
  external_cta: { label: string; url: string } | null;
  position: number | null;
  agent_can_do_this: boolean;
  status: string;
  dependencies: string[];
  department?: string;
};

export function TreeCard({
  n,
  selected,
  highlighted,
  dimmed,
  onSelect,
}: {
  n: TechNode;
  selected: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  onSelect: () => void;
}) {
  const isLocked = n.status === "locked";
  const isComplete = n.status === "complete";

  let borderClass = "border-line/70";
  if (isComplete) borderClass = "border-sage/60 bg-sage/10";

  // Highlight ring takes priority over selected ring
  if (highlighted) {
    borderClass += " ring-2 ring-amber-400";
  } else if (selected) {
    borderClass += " ring-1 ring-ink border-ink";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      data-tt-node={n.id}
      className={`text-left rounded-md border bg-paper px-2.5 py-2 transition-all w-full ${borderClass} ${
        isLocked ? "opacity-35" : "hover:border-line-strong"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className="size-5 rounded shrink-0 bg-canvas border border-line/60 flex items-center justify-center mt-0.5">
          <Box className="size-2.5 text-ink-soft" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <div className="text-xs font-medium leading-snug text-ink">{n.title}</div>
            {isComplete ? (
              <Pill tone="sage">Complete</Pill>
            ) : !isLocked ? (
              <Pill tone="sage">Available</Pill>
            ) : null}
          </div>
          <div className="text-2xs text-ink-muted mt-0.5">
            {n.agent_can_do_this ? "Agent can do this" : "Needs your input"}
          </div>
        </div>
      </div>
    </button>
  );
}
