"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NodeStatus = "locked" | "available" | "in_progress" | "complete";

export default function RoadmapNodeStatusActions({
  orgSlug,
  nodeSlug,
  currentStatus,
}: {
  orgSlug: string;
  nodeSlug: string;
  currentStatus: NodeStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<NodeStatus | null>(null);

  async function update(status: NodeStatus) {
    if (pending || currentStatus === status) return;
    setPending(status);
    try {
      const res = await fetch(`/api/${orgSlug}/roadmap/${nodeSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update node status");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const disabled = pending !== null;

  return (
    <div className="flex justify-end gap-2 pt-1">
      <button
        type="button"
        disabled={disabled || currentStatus === "locked"}
        onClick={() => void update("locked")}
        className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending === "locked" ? "Saving…" : "Mark locked"}
      </button>
      <button
        type="button"
        disabled={disabled || currentStatus === "in_progress"}
        onClick={() => void update("in_progress")}
        className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending === "in_progress" ? "Saving…" : "Mark in progress"}
      </button>
      <button
        type="button"
        disabled={disabled || currentStatus === "complete"}
        onClick={() => void update("complete")}
        className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending === "complete" ? "Saving…" : "Mark done"}
      </button>
    </div>
  );
}
