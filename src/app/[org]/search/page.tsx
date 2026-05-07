"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const RESULTS = [
  {
    kind: "task",
    title: "Build product MVP",
    sub: "Engineering · in_progress",
  },
  {
    kind: "agent",
    title: "Marketing Agent",
    sub: "Marketing · attached: content-engine, last30days-research",
  },
  {
    kind: "artifact",
    title: "Business Plan",
    sub: "Pinned · business_plan",
  },
  {
    kind: "node",
    title: "Build marketing website",
    sub: "Tech tree · BUILD stage · agent can do this",
  },
  {
    kind: "skill",
    title: "huashu-design",
    sub: "Design skill · attached to Design agent",
  },
];

const KINDS = ["all", "task", "agent", "artifact", "node", "skill"] as const;
type Kind = (typeof KINDS)[number];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const filtered = RESULTS.filter((r) => {
    if (kind !== "all" && r.kind !== kind) return false;
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.sub.toLowerCase().includes(q.toLowerCase())
    );
  });

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight mb-3">Search</h1>
          <div className="rounded-lg border border-line bg-paper px-3 py-2 inline-flex items-center gap-2 w-full">
            <Search className="size-4 text-ink-soft" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks, agents, artifacts, tech tree, skills…"
              className="flex-1 text-base focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {KINDS.map((k) => {
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`text-xs uppercase tracking-wider rounded px-2 py-0.5 transition-colors ${
                    on
                      ? "bg-ink text-paper"
                      : "bg-cream text-ink-muted hover:bg-line"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </header>

        <ul className="space-y-1">
          {filtered.map((r, i) => (
            <li
              key={i}
              className="rounded-md border border-line/70 bg-paper px-3 py-2 flex items-center justify-between hover:border-line-strong cursor-pointer"
            >
              <div>
                <div className="text-base">{r.title}</div>
                <div className="text-xs text-ink-muted">{r.sub}</div>
              </div>
              <span className="text-2xs uppercase tracking-wider text-ink-soft">
                {r.kind}
              </span>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-md border border-line/70 bg-paper px-3 py-3 text-center text-sm text-ink-muted">
              No matches.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
