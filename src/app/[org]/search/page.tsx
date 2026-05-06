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

export default function SearchPage() {
  const [q, setQ] = useState("");
  const filtered = q
    ? RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(q.toLowerCase()) ||
          r.sub.toLowerCase().includes(q.toLowerCase()),
      )
    : RESULTS;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight mb-3">Search</h1>
          <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 inline-flex items-center gap-2 w-full">
            <Search className="size-4 text-stone-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks, agents, artifacts, tech tree, skills…"
              className="flex-1 text-[13px] focus:outline-none bg-transparent"
            />
          </div>
        </header>

        <ul className="space-y-1">
          {filtered.map((r, i) => (
            <li
              key={i}
              className="rounded-md border border-stone-200/70 bg-white px-3 py-2 flex items-center justify-between hover:border-stone-400 cursor-pointer"
            >
              <div>
                <div className="text-[13px]">{r.title}</div>
                <div className="text-[11px] text-stone-500">{r.sub}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">
                {r.kind}
              </span>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-md border border-stone-200/70 bg-white px-3 py-3 text-center text-[12px] text-stone-500">
              No matches.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
