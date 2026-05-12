"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast-host";

export default function TaskStopButton({
  taskId,
  orgSlug,
  status,
}: {
  taskId: string;
  orgSlug: string;
  status: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (status === "done" || status === "cancelled") return null;

  async function stop() {
    setBusy(true);
    await fetch(`/api/${orgSlug}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    toast("Task stopped successfully", "ok");
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void stop()}
      disabled={busy}
      aria-label="Stop task"
      className="ml-1 text-ink-muted hover:text-ink disabled:opacity-40"
    >
      <X className="size-3" />
    </button>
  );
}
