"use client";

import { Pill } from "@/components/ui/primitives";
import { Trash2 } from "lucide-react";

export type MemoryItem = {
  id: string;
  topic: string;
  body: string;
  source: "task" | "import" | "manual" | "integration";
  pinned: boolean;
  updated_at: string;
};

export function MemoryRow({
  m,
  onEdit,
  onPin,
  onDelete,
}: {
  m: MemoryItem;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-3 flex items-start justify-between gap-3">
      <button type="button" onClick={onEdit} className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium tracking-tight text-ink">
            {m.topic}
          </span>
          {m.pinned && <Pill tone="mustard">Pinned</Pill>}
          <Pill>{m.source}</Pill>
        </div>
        <p className="text-sm text-ink-muted leading-snug mt-0.5 line-clamp-3">
          {m.body}
        </p>
        <div className="text-2xs text-ink-soft mt-1">updated {m.updated_at}</div>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onPin}
          title={m.pinned ? "Unpin" : "Pin"}
          className="text-xs rounded-md border border-line px-2 py-1 hover:border-line-strong"
        >
          {m.pinned ? "Unpin" : "Pin"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
