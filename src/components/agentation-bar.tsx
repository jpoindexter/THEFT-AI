"use client";

import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

export default function AgentationBar() {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper pl-2 pr-3 py-1.5 text-xs hover:opacity-90 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.35)]"
      >
        <MessageSquare className="size-3.5" />
        Leave feedback
      </button>
    );
  }

  return (
    <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 rounded-md bg-paper border border-line shadow-md p-3 space-y-2">
      <header className="flex items-center justify-between">
        <div className="text-xs font-medium text-ink">Comment on preview</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-ink-soft hover:text-ink"
          aria-label="Close" title="Close"
        >
          <X className="size-3" />
        </button>
      </header>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Click an element on the preview, or type general feedback…"
        className="w-full text-xs rounded-md border border-line bg-canvas px-2 py-1.5 focus:outline-none focus:border-line-strong"
      />
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!comment.trim()}
          className="text-xs rounded-md bg-ink text-paper px-2 py-1 inline-flex items-center gap-1 disabled:opacity-40"
        >
          <Send className="size-3" /> Send to Engineer
        </button>
      </div>
    </div>
  );
}
