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
import { toast } from "@/components/toast-host";

export default function MemoryPage() {
  const params = useParams<{ org: string }>();
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [editing, setEditing] = useState<MemoryItem | null>(null);

  useEffect(() => {
    type ApiItem = MemoryItem & { organization_id: string; created_at: string };
    void fetch(`/api/${params.org}/memory`)
      .then((r) => r.json())
      .then((j: { items: ApiItem[] }) => {
        setItems(
          j.items.map((m) => ({
            id: m.id,
            topic: m.topic,
            body: m.body,
            source: m.source,
            pinned: m.pinned,
            updated_at: m.updated_at.slice(0, 10),
          })),
        );
        setLoading(false);
      });
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

  async function save() {
    if (!editing) return;
    const isUpdate = items.some((c) => c.id === editing.id);
    const url = isUpdate
      ? `/api/${params.org}/memory/${editing.id}`
      : `/api/${params.org}/memory`;
    const method = isUpdate ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: editing.topic,
        body: editing.body,
        pinned: editing.pinned,
        source: editing.source,
      }),
    });
    if (!res.ok) {
      toast("Save failed", "warn");
      return;
    }
    type ApiItem = MemoryItem & { organization_id: string; created_at: string };
    const j = (await res.json()) as { item: ApiItem };
    const saved: MemoryItem = {
      id: j.item.id,
      topic: j.item.topic,
      body: j.item.body,
      source: j.item.source,
      pinned: j.item.pinned,
      updated_at: j.item.updated_at.slice(0, 10),
    };
    setItems((cur) =>
      isUpdate
        ? cur.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...cur],
    );
    toast(isUpdate ? "Memory updated" : "Memory saved", "ok");
    setEditing(null);
  }

  async function togglePin(m: MemoryItem) {
    const next = !m.pinned;
    setItems((cur) =>
      cur.map((c) => (c.id === m.id ? { ...c, pinned: next } : c)),
    );
    await fetch(`/api/${params.org}/memory/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: next }),
    });
  }

  async function remove(m: MemoryItem) {
    setItems((cur) => cur.filter((c) => c.id !== m.id));
    await fetch(`/api/${params.org}/memory/${m.id}`, { method: "DELETE" });
    toast(`Removed "${m.topic}"`, "warn");
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
          {loading
            ? "Loading…"
            : `${filtered.length} of ${items.length} memory items`}
        </div>

        <Card>
          <ul className="divide-y divide-line/60">
            {!loading && filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                {items.length === 0
                  ? "No memory yet. Pin something the agents shouldn't forget."
                  : "No matches. Try a broader search or clear filters."}
              </li>
            )}
            {filtered.map((m) => (
              <MemoryRow
                key={m.id}
                m={m}
                onEdit={() => setEditing(m)}
                onPin={() => togglePin(m)}
                onDelete={() => remove(m)}
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
                  size="sm"
                  disabled={!editing.topic.trim() || !editing.body.trim()}
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
