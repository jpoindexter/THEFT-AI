"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paperclip, Play, FileBox } from "lucide-react";

type Agent = {
  id: string;
  slug: string;
  name: string;
  department_id: string | null;
};

export default function NewTaskDialog({
  organization,
  open,
  onOpenChange,
  onCreated,
}: {
  organization: { id: string; slug: string };
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated?: () => void;
}) {
  const [description, setDescription] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState<string | "auto">("auto");
  const [mode, setMode] = useState<"plan" | "execute">("execute");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetch(`/api/${organization.slug}/agents`)
      .then((r) => r.json())
      .then((j) => setAgents(j.agents ?? []));
  }, [organization.slug, open]);

  async function submit() {
    setSubmitting(true);
    try {
      await fetch(`/api/${organization.slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          agentId: agentId === "auto" ? null : agentId,
          mode,
        }),
      });
      onCreated?.();
      onOpenChange(false);
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-paper">
        <DialogHeader className="sr-only">
          <DialogTitle>Create a task</DialogTitle>
        </DialogHeader>
        <div className="p-3">
          <textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe a task for your agent…"
            rows={5}
            className="w-full resize-none text-[13px] focus:outline-none placeholder:text-ink-soft"
          />
        </div>
        <div className="flex items-center gap-2 border-t border-line/80 p-2 text-[11px]">
          <PillButton icon={<Paperclip className="size-3.5" />} label="Add files" />
          <PillButton
            icon={<Play className="size-3.5" />}
            label={mode === "execute" ? "Execute" : "Plan"}
            onClick={() =>
              setMode((m) => (m === "execute" ? "plan" : "execute"))
            }
          />
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="rounded-md border border-line/80 bg-paper px-2 py-1 focus:outline-none"
          >
            <option value="auto">Auto-assign</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <PillButton icon={<FileBox className="size-3.5" />} label="App" />
          <div className="flex-1" />
          <button
            type="button"
            onClick={submit}
            disabled={!description.trim() || submitting}
            className="rounded-md bg-ink text-paper px-3 py-1 text-[11px] disabled:opacity-30"
          >
            {submitting ? "Creating…" : "Create Task"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PillButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-line/80 bg-paper px-2 py-1 hover:border-line-strong transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
