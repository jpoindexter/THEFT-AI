"use client";

import { useState } from "react";
import { Pencil, Send, Trash2, RotateCcw } from "lucide-react";
import { toast } from "@/components/toast-host";

export default function AgentDraft({ initial }: { initial: string }) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const original = initial;
  const dirty = draft !== original;

  function send() {
    toast("Reply sent", "ok");
    setEditing(false);
  }

  return (
    <section className="rounded-lg border border-mustard/40 bg-mustard/15 p-4">
      <div className="flex items-center justify-between text-2xs uppercase tracking-wider text-mustard-ink mb-1">
        <span>Agent draft (not sent)</span>
        {dirty && <span className="text-ink-soft normal-case tracking-normal">edited</span>}
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong"
        />
      ) : (
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {draft}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-3">
        {dirty && (
          <button
            type="button"
            onClick={() => setDraft(original)}
            className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
          >
            <RotateCcw className="size-3" /> Revert
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            toast("Draft discarded", "warn");
            setDraft("");
          }}
          className="inline-flex items-center gap-1 text-xs rounded-md border border-brick/40 bg-paper text-brick-ink px-2 py-1 hover:bg-brick/10"
        >
          <Trash2 className="size-3" /> Discard
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
        >
          <Pencil className="size-3" /> {editing ? "Done" : "Edit"}
        </button>
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
        >
          <Send className="size-3" /> Send reply
        </button>
      </div>
    </section>
  );
}
