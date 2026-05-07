"use client";

import { useState } from "react";
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
import { Webhook, Plus, Trash2, Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/components/toast-host";

const ALL_EVENTS = [
  { id: "task.created", label: "Task created" },
  { id: "task.completed", label: "Task completed" },
  { id: "approval.requested", label: "Approval requested" },
  { id: "approval.decided", label: "Approval decided" },
  { id: "agent.paused", label: "Agent paused" },
  { id: "memory.updated", label: "Memory updated" },
  { id: "artifact.created", label: "Artifact created" },
] as const;

type EndpointStatus = "ok" | "failing" | "paused";

type Endpoint = {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: EndpointStatus;
  lastDelivery: string | null;
  successRate: number;
};

const SEED: Endpoint[] = [
  {
    id: "wh-slack",
    name: "Slack #ops",
    url: "https://hooks.slack.com/services/T0/B0/abc",
    events: ["task.completed", "approval.decided", "agent.paused"],
    status: "ok",
    lastDelivery: "12m ago",
    successRate: 100,
  },
  {
    id: "wh-zapier",
    name: "Zapier · sheets backup",
    url: "https://hooks.zapier.com/hooks/catch/123/abc",
    events: ["artifact.created"],
    status: "failing",
    lastDelivery: "3h ago",
    successRate: 64,
  },
];

export default function WebhooksPage() {
  const params = useParams<{ org: string }>();
  const [items, setItems] = useState<Endpoint[]>(SEED);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    url: string;
    events: string[];
  }>({ name: "", url: "", events: ["task.completed"] });

  function save() {
    if (!draft.name || !draft.url.startsWith("https://")) return;
    setItems((c) => [
      ...c,
      {
        id: `wh-${Date.now()}`,
        name: draft.name,
        url: draft.url,
        events: draft.events,
        status: "ok",
        lastDelivery: null,
        successRate: 100,
      },
    ]);
    setDraft({ name: "", url: "", events: ["task.completed"] });
    setAdding(false);
    toast("Webhook saved", "ok");
  }

  function ping(id: string) {
    void params.org;
    toast("Test event delivered · 200 OK", "ok");
    void id;
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <Webhook className="size-5 text-ink-muted" /> Webhooks
            </PageTitle>
            <Hint>
              Outgoing HTTPS endpoints that receive workspace events. Each
              delivery is signed with HMAC-SHA256 over the body.
            </Hint>
          </div>
          <ButtonPrimary
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1"
          >
            <Plus className="size-3.5" /> New endpoint
          </ButtonPrimary>
        </header>

        {adding && (
          <Card>
            <CardBody>
              <Eyebrow>New endpoint</Eyebrow>
              <div className="space-y-2 mt-2">
                <input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({ ...draft, name: e.target.value })
                  }
                  placeholder="Name (e.g. Slack · #ops)"
                  className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
                />
                <input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {ALL_EVENTS.map((e) => {
                    const on = draft.events.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            events: on
                              ? draft.events.filter((x) => x !== e.id)
                              : [...draft.events, e.id],
                          })
                        }
                        className={`text-2xs uppercase tracking-wider rounded px-2 py-0.5 ${
                          on ? "bg-ink text-paper" : "bg-cream text-ink-muted hover:bg-line"
                        }`}
                      >
                        {e.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setAdding(false)}
                    className="text-xs rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
                  >
                    Cancel
                  </button>
                  <ButtonPrimary
                    onClick={save}
                    disabled={!draft.name || !draft.url.startsWith("https://")}
                    className="text-xs px-3 py-1.5"
                  >
                    Save endpoint
                  </ButtonPrimary>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-line/60">
              {items.length === 0 && (
                <li className="px-4 py-6 text-sm text-ink-muted text-center">
                  No webhooks yet. Pipe workspace events to Slack, Zapier, or
                  your own listener.
                </li>
              )}
              {items.map((e) => (
                <EndpointRow
                  key={e.id}
                  e={e}
                  onPing={() => ping(e.id)}
                  onDelete={() =>
                    setItems((c) => c.filter((x) => x.id !== e.id))
                  }
                />
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function EndpointRow({
  e,
  onPing,
  onDelete,
}: {
  e: Endpoint;
  onPing: () => void;
  onDelete: () => void;
}) {
  const tone =
    e.status === "ok" ? "sage" : e.status === "failing" ? "brick" : "neutral";
  return (
    <li className="px-4 py-3 grid grid-cols-12 items-start gap-2">
      <div className="col-span-7 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          {e.status === "ok" ? (
            <CheckCircle2 className="size-3.5 text-sage-ink shrink-0" />
          ) : (
            <XCircle className="size-3.5 text-brick-ink shrink-0" />
          )}
          <span className="font-medium tracking-tight truncate">{e.name}</span>
          <Pill tone={tone}>{e.status}</Pill>
        </div>
        <div className="text-2xs font-mono text-ink-muted truncate mt-0.5">
          {e.url}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {e.events.map((ev) => (
            <span
              key={ev}
              className="text-2xs rounded bg-cream text-ink-muted px-1.5 py-0.5 font-mono"
            >
              {ev}
            </span>
          ))}
        </div>
      </div>
      <div className="col-span-3 text-2xs text-ink-soft">
        <div>{e.successRate}% success</div>
        <div>last {e.lastDelivery ?? "never"}</div>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1">
        <button
          onClick={onPing}
          title="Send test event"
          className="size-7 rounded-md border border-line bg-paper inline-flex items-center justify-center hover:border-line-strong"
        >
          <Play className="size-3" />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </li>
  );
}
