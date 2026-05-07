"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  ButtonPrimary,
} from "@/components/ui/primitives";
import { Brain, Plus } from "lucide-react";
import { MemoryRow, type MemoryItem } from "@/components/memory/memory-row";
import {
  MemoryFilters,
  type SourceFilter,
} from "@/components/memory/memory-filters";

const SEED: MemoryItem[] = [
  {
    id: "m1",
    topic: "Pricing thesis",
    body: "Anchor at $60/seat for Team. $200 monthly credit per workspace covers ~80% of agent runs at current volume. Flat $1.2k for Studio buys multi-workspace + SSO.",
    source: "task",
    pinned: true,
    updated_at: "2026-05-04",
  },
  {
    id: "m2",
    topic: "ICP",
    body: "Solo founders + 2-5 person teams who would otherwise hire fractional ops/marketing. Mortgage tech and dev tools have shown highest activation in trials.",
    source: "manual",
    pinned: true,
    updated_at: "2026-05-02",
  },
  {
    id: "m3",
    topic: "Engineer agent prefers reversible migrations",
    body: "Always reversible. Backfills run in their own migration. Default rollout is staging → prod via PR.",
    source: "task",
    pinned: false,
    updated_at: "2026-04-30",
  },
  {
    id: "m4",
    topic: "Postmark inbound parsing",
    body: "Inbound mail is parsed into a Task at the matching agent's inbox. Subject becomes title; first paragraph becomes description.",
    source: "integration",
    pinned: false,
    updated_at: "2026-04-22",
  },
];

export default function MemoryPage() {
  const params = useParams<{ org: string }>();
  const [items, setItems] = useState<MemoryItem[]>(SEED);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [editing, setEditing] = useState<MemoryItem | null>(null);

  useEffect(() => {
    void params.org;
  }, [params.org]);

  const filtered = items.filter((m) => {
    if (pinnedOnly && !m.pinned) return false;
    if (source !== "all" && m.source !== source) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      m.topic.toLowerCase().includes(needle) ||
      m.body.toLowerCase().includes(needle)
    );
  });

  function save() {
    if (!editing) return;
    setItems((cur) =>
      cur.some((c) => c.id === editing.id)
        ? cur.map((c) => (c.id === editing.id ? editing : c))
        : [...cur, editing],
    );
    setEditing(null);
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <Brain className="size-5 text-ink-muted" /> Company memory
            </PageTitle>
            <Hint>
              Durable workspace context every agent can read. Pin the items
              that should always travel with the prompt.
            </Hint>
          </div>
          <ButtonPrimary
            onClick={() =>
              setEditing({
                id: `m_${Date.now()}`,
                topic: "",
                body: "",
                source: "manual",
                pinned: false,
                updated_at: new Date().toISOString().slice(0, 10),
              })
            }
            className="inline-flex items-center gap-1"
          >
            <Plus className="size-3.5" /> New memory
          </ButtonPrimary>
        </header>

        <MemoryFilters
          q={q}
          setQ={setQ}
          source={source}
          setSource={setSource}
          pinnedOnly={pinnedOnly}
          setPinnedOnly={setPinnedOnly}
        />

        <div className="text-2xs text-ink-soft px-1">
          {filtered.length} of {items.length} memory items
        </div>

        <Card>
          <ul className="divide-y divide-line/60">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                No matches. Try a broader search or clear filters.
              </li>
            )}
            {filtered.map((m) => (
              <MemoryRow
                key={m.id}
                m={m}
                onEdit={() => setEditing(m)}
                onPin={() =>
                  setItems((cur) =>
                    cur.map((c) =>
                      c.id === m.id ? { ...c, pinned: !c.pinned } : c,
                    ),
                  )
                }
                onDelete={() =>
                  setItems((cur) => cur.filter((c) => c.id !== m.id))
                }
              />
            ))}
          </ul>
        </Card>

        {editing && (
          <Card>
            <CardBody>
              <Eyebrow>
                {items.some((i) => i.id === editing.id) ? "Edit" : "New"} memory
              </Eyebrow>
              <input
                value={editing.topic}
                onChange={(e) =>
                  setEditing({ ...editing, topic: e.target.value })
                }
                placeholder="Topic"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong mt-1"
              />
              <textarea
                value={editing.body}
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
                placeholder="Durable fact, decision, or workflow worth keeping…"
                rows={5}
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong mt-2"
              />
              <label className="inline-flex items-center gap-2 mt-2 text-xs">
                <input
                  type="checkbox"
                  checked={editing.pinned}
                  onChange={(e) =>
                    setEditing({ ...editing, pinned: e.target.checked })
                  }
                />
                Pin (always include in prompt)
              </label>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="text-xs rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
                >
                  Cancel
                </button>
                <ButtonPrimary
                  onClick={save}
                  disabled={!editing.topic.trim() || !editing.body.trim()}
                  className="text-xs px-3 py-1.5"
                >
                  Save
                </ButtonPrimary>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
