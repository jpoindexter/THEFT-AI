"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  SectionHeader,
  SettingsCard,
} from "@/components/settings/section";
import { ButtonPrimary, Hint, Pill } from "@/components/ui/primitives";
import { ArrowLeft, Plus, Trash2, Bell } from "lucide-react";
import { toast } from "@/components/toast-host";

type Channel = "in-app" | "email" | "slack" | "discord";

type Rule = {
  id: string;
  event: string;
  match: string;
  channel: Channel;
  target: string;
  enabled: boolean;
};

const SEED: Rule[] = [
  {
    id: "n1",
    event: "approval.requested",
    match: "agent=Engineer",
    channel: "slack",
    target: "#approvals",
    enabled: true,
  },
  {
    id: "n2",
    event: "task.completed",
    match: "*",
    channel: "in-app",
    target: "(self)",
    enabled: true,
  },
  {
    id: "n3",
    event: "agent.paused",
    match: "*",
    channel: "email",
    target: "jason@theft.studio",
    enabled: true,
  },
];

const EVENTS = [
  "approval.requested",
  "approval.decided",
  "task.created",
  "task.completed",
  "agent.paused",
  "agent.error",
  "memory.updated",
  "billing.alert",
];

const CHANNEL_TONE: Record<Channel, "sage" | "mustard" | "neutral" | "brick"> = {
  "in-app": "neutral",
  email: "sage",
  slack: "mustard",
  discord: "brick",
};

export default function NotificationRoutingPage() {
  const params = useParams<{ org: string }>();
  const [rules, setRules] = useState<Rule[]>(SEED);

  function addRule() {
    setRules((c) => [
      ...c,
      {
        id: `n${Date.now()}`,
        event: "task.completed",
        match: "*",
        channel: "in-app",
        target: "(self)",
        enabled: false,
      },
    ]);
  }

  return (
    <>
      <Link
        href={`/${params.org}/settings/notifications`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-4"
      >
        <ArrowLeft className="size-3" /> Back to notifications
      </Link>
      <SectionHeader
        title="Routing"
        description="Per-event channel routing. First match wins. Add a rule per channel you want to fan out to."
      />

      <SettingsCard>
        <ul className="divide-y divide-line/60">
          {rules.map((r) => (
            <RouteRow
              key={r.id}
              r={r}
              onChange={(patch) =>
                setRules((c) =>
                  c.map((x) => (x.id === r.id ? { ...x, ...patch } : x)),
                )
              }
              onDelete={() => {
                setRules((c) => c.filter((x) => x.id !== r.id));
                toast("Rule removed", "warn");
              }}
            />
          ))}
        </ul>
        <button
          onClick={addRule}
          className="mt-3 inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
        >
          <Plus className="size-3" /> Add routing rule
        </button>
      </SettingsCard>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Hint>Defaults to in-app for any event without a matching rule.</Hint>
        <ButtonPrimary
          onClick={() => toast("Routing saved", "ok")}
          className="inline-flex items-center gap-1"
        >
          <Bell className="size-3.5" /> Save
        </ButtonPrimary>
      </div>
    </>
  );
}

function RouteRow({
  r,
  onChange,
  onDelete,
}: {
  r: Rule;
  onChange: (patch: Partial<Rule>) => void;
  onDelete: () => void;
}) {
  return (
    <li className="py-2 grid grid-cols-12 items-center gap-2">
      <select
        value={r.event}
        onChange={(e) => onChange({ event: e.target.value })}
        className="col-span-3 h-8 rounded-md border border-line bg-paper px-2 text-xs font-mono"
      >
        {EVENTS.map((ev) => (
          <option key={ev} value={ev}>
            {ev}
          </option>
        ))}
      </select>
      <input
        value={r.match}
        onChange={(e) => onChange({ match: e.target.value })}
        placeholder="* or filter"
        className="col-span-2 h-8 rounded-md border border-line bg-paper px-2 text-xs font-mono focus:outline-none focus:border-line-strong"
      />
      <select
        value={r.channel}
        onChange={(e) => onChange({ channel: e.target.value as Channel })}
        className="col-span-2 h-8 rounded-md border border-line bg-paper px-2 text-xs"
      >
        <option value="in-app">In-app</option>
        <option value="email">Email</option>
        <option value="slack">Slack</option>
        <option value="discord">Discord</option>
      </select>
      <input
        value={r.target}
        onChange={(e) => onChange({ target: e.target.value })}
        placeholder="#channel or address"
        className="col-span-3 h-8 rounded-md border border-line bg-paper px-2 text-xs focus:outline-none focus:border-line-strong"
      />
      <div className="col-span-1 inline-flex items-center justify-center">
        <Pill tone={CHANNEL_TONE[r.channel]}>{r.channel}</Pill>
      </div>
      <div className="col-span-1 inline-flex items-center justify-end gap-1">
        <input
          type="checkbox"
          checked={r.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          title={r.enabled ? "Disable" : "Enable"}
        />
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
