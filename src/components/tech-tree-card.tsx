import { Pill } from "@/components/ui/primitives";

export type TechNode = {
  id: string;
  slug: string;
  stage: string;
  title: string;
  description: string | null;
  what_becomes_true: string | null;
  how_to_move_forward: string | null;
  position: number | null;
  agent_can_do_this: boolean;
  status: string;
  dependencies: string[];
};

export function TreeCard({
  n,
  selected,
  onSelect,
}: {
  n: TechNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLocked = n.status === "locked";
  const isComplete = n.status === "complete";
  const isInProgress = n.status === "in_progress";

  let toneClass = "border-line/70";
  if (isComplete) toneClass = "border-sage/60 bg-sage/15";
  else if (isInProgress) toneClass = "border-mustard/60 bg-mustard/15";
  if (selected) toneClass += " ring-1 ring-ink border-ink";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-md border bg-paper px-3 py-2 transition-all ${toneClass} ${
        isLocked ? "opacity-40" : "hover:border-line-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-base font-medium leading-tight tracking-tight text-ink">
          {n.title}
        </div>
        {isComplete && <Pill tone="sage">Done</Pill>}
        {!isLocked && !isComplete && <Pill tone="mustard">Avail</Pill>}
      </div>
      <div className="text-2xs text-ink-muted mt-1">
        {n.agent_can_do_this ? "Agent can do this" : "Needs your input"}
      </div>
    </button>
  );
}
