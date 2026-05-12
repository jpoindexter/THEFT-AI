"use client";

import { Search, Pin } from "lucide-react";
import type { MemoryItem } from "@/components/memory/memory-row";

export type SourceFilter = MemoryItem["source"] | "all";

const SOURCES: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "task", label: "Task" },
  { id: "manual", label: "Manual" },
  { id: "import", label: "Import" },
  { id: "integration", label: "Integration" },
];

export function MemoryFilters({
  q,
  setQ,
  source,
  setSource,
  pinnedOnly,
  setPinnedOnly,
}: {
  q: string;
  setQ: (v: string) => void;
  source: SourceFilter;
  setSource: (v: SourceFilter) => void;
  pinnedOnly: boolean;
  setPinnedOnly: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-2 py-1.5">
        <Search className="size-3.5 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topic, body, or paste a snippet…"
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-ink-soft"
        />
        <button
          type="button"
          onClick={() => setPinnedOnly(!pinnedOnly)}
          title={pinnedOnly ? "Show all" : "Show pinned only"}
          className={`inline-flex items-center gap-1 text-2xs rounded-md px-2 py-1 ${
            pinnedOnly
              ? "bg-mustard/30 text-mustard-ink"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Pin className="size-3" /> Pinned
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSource(s.id)}
            className={`text-2xs uppercase tracking-wider rounded px-2 py-0.5 transition-colors ${
              source === s.id
                ? "bg-ink text-paper"
                : "bg-cream text-ink-muted hover:bg-line"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
