"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";
import { Brain, Search, Plus, Trash2 } from "lucide-react";

type Memory = {
  id: string;
  topic: string;
  body: string;
  source: "task" | "import" | "manual" | "integration";
  pinned: boolean;
  updated_at: string;
};

const SEED: Memory[] = [
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
];

export default function MemoryPage() {
  const params = useParams<{ org: string }>();
  const [items, setItems] = useState<Memory[]>(SEED);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Memory | null>(null);

  useEffect(() => {
    void params.org;
  }, [params.org]);

  const filtered = items.filter((m) =>
    !q
      ? true
      : m.topic.toLowerCase().includes(q.toLowerCase()) ||
        m.body.toLowerCase().includes(q.toLowerCase()),
  );

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

        <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-2 py-1.5">
          <Search className="size-3.5 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search memory…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-ink-soft"
          />
        </div>

        <Card>
          <ul className="divide-y divide-line/60">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                No memory yet. Pin something the agents shouldn't forget.
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
              <Eyebrow>{items.some((i) => i.id === editing.id) ? "Edit" : "New"} memory</Eyebrow>
              <input
                value={editing.topic}
                onChange={(e) => setEditing({ ...editing, topic: e.target.value })}
                placeholder="Topic"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong mt-1"
              />
              <textarea
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
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

function MemoryRow({
  m,
  onEdit,
  onPin,
  onDelete,
}: {
  m: Memory;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-3 flex items-start justify-between gap-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 text-left min-w-0"
      >
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
        <div className="text-2xs text-ink-soft mt-1">
          updated {m.updated_at}
        </div>
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
