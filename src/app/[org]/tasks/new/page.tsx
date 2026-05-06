"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, Play } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  ButtonPrimary,
  Pill,
} from "@/components/ui/primitives";

type Agent = { id: string; slug: string; name: string };

export default function NewTaskPage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState<string>("auto");
  const [mode, setMode] = useState<"plan" | "execute">("execute");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/${params.org}/agents`)
      .then((r) => (r.ok ? r.json() : { agents: [] }))
      .then((j: { agents: Agent[] }) => setAgents(j.agents ?? []));
  }, [params.org]);

  async function submit() {
    if (!description.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/${params.org}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        agentId: agentId === "auto" ? null : agentId,
        mode,
      }),
    });
    setBusy(false);
    if (res.ok) {
      const j = await res.json();
      if (j?.task?.id) router.replace(`/${params.org}/tasks/${j.task.id}`);
      else router.replace(`/${params.org}/tasks`);
    }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/tasks`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to tasks
        </Link>

        <header>
          <Eyebrow>Tasks</Eyebrow>
          <PageTitle>New task</PageTitle>
          <Hint>
            Describe what you want done. Pick an agent (or let us auto-assign),
            choose Plan or Execute, and submit.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <textarea
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Add a Stripe checkout flow for the new pricing page and verify the happy path."
              rows={6}
              className="w-full text-base resize-none focus:outline-none placeholder:text-ink-soft bg-transparent"
            />
            <div className="border-t border-line/60 -mx-4 mt-3" />
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                title="Attach files (coming soon)"
              >
                <Paperclip className="size-3" /> Add files
              </button>
              <button
                type="button"
                onClick={() => setMode((m) => (m === "execute" ? "plan" : "execute"))}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                title="Toggle plan/execute mode"
              >
                <Play className="size-3" />
                {mode === "execute" ? "Execute" : "Plan"}
              </button>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="rounded-md border border-line bg-paper px-2 py-1 focus:outline-none focus:border-line-strong"
                title="Choose agent"
              >
                <option value="auto">Auto-assign</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {mode === "plan" && (
                <Pill tone="mustard">Plan first, approve, then run</Pill>
              )}
              <div className="flex-1" />
              <ButtonPrimary
                onClick={submit}
                disabled={!description.trim() || busy}
                className="text-xs px-3 py-1"
              >
                {busy ? "Creating…" : "Create task"}
              </ButtonPrimary>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
