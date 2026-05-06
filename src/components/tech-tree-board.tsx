"use client";

import { useState } from "react";
import { X, Folder } from "lucide-react";

type Node = {
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
  nodes: Node[];
}) {
  const [selected, setSelected] = useState<Node | null>(null);

  return (
    <div className="absolute inset-0 bg-[#f5f4f0] flex flex-col">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-stone-200/80">
        <div className="size-8 rounded-md bg-stone-200 inline-flex items-center justify-center">
          <Folder className="size-4 text-stone-500" />
        </div>
        <div>
          <h1 className="text-[15px] tracking-tight">How to Build a Company</h1>
          <p className="text-[11px] text-stone-500">{orgName}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-8 min-w-max">
          {STAGES.map((stage) => {
            const stageNodes = nodes
              .filter((n) => n.stage === stage.key)
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            if (stageNodes.length === 0) return null;
            return (
              <div key={stage.key} className="w-56 flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 px-1 mb-1">
                  {stage.label}
                </div>
                {stageNodes.map((n) => {
                  const isLocked = n.status === "locked";
                  const isComplete = n.status === "complete";
                  const isInProgress = n.status === "in_progress";
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelected(n)}
                      className={`text-left rounded-md border bg-white px-3 py-2 transition-all ${
                        isLocked ? "opacity-40" : "hover:border-stone-400"
                      } ${
                        selected?.id === n.id
                          ? "border-stone-900 ring-1 ring-stone-900"
                          : "border-stone-200/80"
                      } ${
                        isComplete
                          ? "bg-emerald-50/60 border-emerald-200"
                          : isInProgress
                            ? "bg-amber-50/60 border-amber-200"
                            : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[13px] font-medium leading-tight tracking-tight">
                          {n.title}
                        </div>
                        {isComplete && (
                          <span className="text-[9px] uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                            Done
                          </span>
                        )}
                        {!isLocked && !isComplete && (
                          <span className="text-[9px] uppercase tracking-wider text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
                            Avail
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1">
                        {n.agent_can_do_this
                          ? "Agent can do this"
                          : "Needs your input"}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {selected && (
        <aside className="absolute right-0 top-[57px] bottom-0 w-80 bg-white border-l border-stone-200/80 p-5 overflow-y-auto">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-stone-400">
                {selected.stage}
              </div>
              <h2 className="text-base font-medium tracking-tight mt-1">
                {selected.title}
              </h2>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-stone-400 hover:text-stone-900"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          {selected.what_becomes_true && (
            <Section
              label="What becomes true"
              body={selected.what_becomes_true}
            />
          )}
          {selected.how_to_move_forward && (
            <Section
              label="How to move this forward"
              body={selected.how_to_move_forward}
            />
          )}
          <button
            type="button"
            className="mt-4 w-full rounded-md bg-stone-900 text-white text-[12px] py-2 hover:bg-stone-800 transition-colors"
            disabled={selected.status === "locked"}
          >
            {selected.agent_can_do_this ? "Launch Agent" : "Mark complete"}
          </button>
        </aside>
      )}
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="mb-5">
      <div className="text-[9px] uppercase tracking-[0.14em] text-stone-400 mb-1.5">
        {label}
      </div>
      <p className="text-[13px] text-stone-700 leading-snug">{body}</p>
    </div>
  );
}
