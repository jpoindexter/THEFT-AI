"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, Eyebrow, Hint, PageTitle } from "@/components/ui/primitives";

const EVENTS = [
  {
    id: "evt_001",
    when: "2m ago",
    actor: "Engineer",
    action: "opened PR",
    target: "feat/subscriptions-table",
    detail: "12 files changed · +320/-12",
  },
  {
    id: "evt_002",
    when: "6m ago",
    actor: "Cofounder",
    action: "set business plan",
    target: "Business Plan",
    detail: "Product, ICP, pricing thesis saved",
  },
  {
    id: "evt_003",
    when: "21m ago",
    actor: "Marketing",
    action: "drafted launch email",
    target: "Launch broadcast — May",
    detail: "Awaiting approval",
  },
  {
    id: "evt_004",
    when: "1h ago",
    actor: "Sales",
    action: "exported prospect list",
    target: "lenders-mortgage-2026.csv",
    detail: "240 rows",
  },
  {
    id: "evt_005",
    when: "2h ago",
    actor: "Operations",
    action: "kicked routine",
    target: "Weekly status brief",
    detail: "Scheduled · Mondays 9am",
  },
];

const ACTORS = [
  "all",
  "Cofounder",
  "Engineer",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Support",
] as const;

export default function ActivityPage() {
  const params = useParams<{ org: string }>();
  const [actor, setActor] = useState<(typeof ACTORS)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = EVENTS.filter((e) => {
    if (actor !== "all" && e.actor !== actor) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      e.action.toLowerCase().includes(needle) ||
      e.target.toLowerCase().includes(needle) ||
      e.detail.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <PageTitle>Activity</PageTitle>
          <Hint>
            Audit trail of every meaningful action agents take in this workspace.
          </Hint>
        </header>

        <Filters
          actor={actor}
          onActor={setActor}
          q={q}
          onQ={setQ}
          total={filtered.length}
        />

        <Card>
          <ul className="divide-y divide-line/60">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                No events match.
              </li>
            )}
            {filtered.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/${params.org}/activity/${e.id}`}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-canvas"
                >
                  <span className="size-7 rounded-full bg-cream inline-flex items-center justify-center text-2xs font-medium text-ink-muted flex-shrink-0">
                    {e.actor[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{e.actor}</span>{" "}
                      <span className="text-ink-muted">{e.action}</span>{" "}
                      <span className="font-mono text-xs text-ink">
                        {e.target}
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {e.detail}
                    </div>
                  </div>
                  <span className="text-2xs text-ink-soft shrink-0">
                    {e.when}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Filters({
  actor,
  onActor,
  q,
  onQ,
  total,
}: {
  actor: (typeof ACTORS)[number];
  onActor: (a: (typeof ACTORS)[number]) => void;
  q: string;
  onQ: (s: string) => void;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <select
        value={actor}
        onChange={(e) => onActor(e.target.value as (typeof ACTORS)[number])}
        className="rounded-md border border-line bg-paper px-2 py-1"
      >
        {ACTORS.map((a) => (
          <option key={a} value={a}>
            {a === "all" ? "All actors" : a}
          </option>
        ))}
      </select>
      <input
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder="Filter by target or detail…"
        className="flex-1 rounded-md border border-line bg-paper px-2 py-1 focus:outline-none focus:border-line-strong"
      />
      <Eyebrow className="ml-auto">{total} events</Eyebrow>
    </div>
  );
}
