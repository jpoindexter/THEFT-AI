"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Eyebrow, Hint, PageTitle } from "@/components/ui/primitives";

type Event = {
  id: string;
  when: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  href: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  mode: string;
  agent_id: string | null;
  updated_at: string;
  created_at: string;
};

type Agent = { id: string; name: string };

export default function ActivityPage() {
  const params = useParams<{ org: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [actor, setActor] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const org = params.org;
    Promise.all([
      fetch(`/api/${org}/tasks`).then((r) => r.ok ? r.json() : { tasks: [] }),
      fetch(`/api/${org}/agents`).then((r) => r.ok ? r.json() : { agents: [] }),
    ]).then(([tj, aj]: [{ tasks: Task[] }, { agents: Agent[] }]) => {
      const agentName = new Map(aj.agents.map((a) => [a.id, a.name]));
      const relTime = (iso: string) => {
        const ms = Date.now() - new Date(iso).getTime();
        if (ms < 60_000) return "just now";
        if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
        if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
        return `${Math.floor(ms / 86_400_000)}d ago`;
      };

      const derived: Event[] = [];
      for (const t of tj.tasks) {
        const agent = t.agent_id ? (agentName.get(t.agent_id) ?? "Agent") : "You";
        const statusLabel: Record<string, string> = {
          done: "completed",
          in_progress: "started",
          in_review: "submitted for review",
          blocked: "blocked on",
          cancelled: "cancelled",
          todo: "queued",
          backlog: "added to backlog",
        };
        const action = statusLabel[t.status] ?? "updated";
        derived.push({
          id: t.id,
          when: relTime(t.updated_at),
          actor: agent,
          action,
          target: t.title,
          detail: `${t.mode} mode · ${t.priority} priority`,
          href: `tasks/${t.id}`,
        });
      }
      derived.sort((a, b) => b.id.localeCompare(a.id));

      setEvents(derived);
      const uniqueActors = [...new Set(derived.map((e) => e.actor))];
      setActors(uniqueActors);
    }).catch(() => undefined);
  }, [params.org]);

  const filtered = events.filter((e) => {
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="rounded-md border border-line bg-paper px-2 py-1"
          >
            <option value="all">All actors</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by target or detail…"
            className="flex-1 rounded-md border border-line bg-paper px-2 py-1 focus:outline-none focus:border-line-strong"
          />
          <Eyebrow className="ml-auto">{filtered.length} events</Eyebrow>
        </div>

        <Card>
          <ul className="divide-y divide-line/60">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                {events.length === 0 ? "No activity yet." : "No events match."}
              </li>
            )}
            {filtered.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/${params.org}/${e.href}`}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-canvas"
                >
                  <span className="size-7 rounded-full bg-cream inline-flex items-center justify-center text-2xs font-medium text-ink-muted flex-shrink-0">
                    {e.actor[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{e.actor}</span>{" "}
                      <span className="text-ink-muted">{e.action}</span>{" "}
                      <span className="font-mono text-xs text-ink truncate">{e.target}</span>
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">{e.detail}</div>
                  </div>
                  <span className="text-2xs text-ink-soft shrink-0">{e.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
