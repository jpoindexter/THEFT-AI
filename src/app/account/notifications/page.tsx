"use client";

import { useState } from "react";
import {
  SectionHeader,
  SettingsCard,
} from "@/components/settings/section";
import { Switch } from "@/components/ui/switch";
import { ButtonPrimary } from "@/components/ui/primitives";
import { Bell } from "lucide-react";
import { toast } from "@/components/toast-host";

const PREFS = [
  { id: "approvals", label: "Approval requests", description: "When an agent needs your call before continuing.", default: true },
  { id: "tasks_done", label: "Tasks completed", description: "When an agent ships a task you started or assigned.", default: false },
  { id: "memory_updates", label: "Memory edits", description: "When an agent writes durable workspace memory.", default: false },
  { id: "weekly_digest", label: "Weekly digest", description: "What shipped, what's blocked, what's coming.", default: true },
  { id: "agent_paused", label: "Agent paused or stalled", description: "When an agent stops without finishing.", default: true },
  { id: "billing_alerts", label: "Billing alerts", description: "Cost spikes, budget overages, plan changes.", default: true },
];

const CHANNELS = ["In-app", "Email", "Mobile push"];

export default function AccountNotificationsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.id, p.default])),
  );
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  return (
    <>
      <SectionHeader
        title="Notifications"
        description="Account-level. Each workspace can override these to be louder or quieter."
      />

      <SettingsCard
        title="What you hear about"
        description="Every event is delivered in-app. Email and push add channels for the loud ones."
      >
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 gap-y-2 text-sm">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Event
          </div>
          {CHANNELS.map((c) => (
            <div
              key={c}
              className="text-2xs uppercase tracking-wider text-ink-soft text-center"
            >
              {c}
            </div>
          ))}

          {PREFS.map((p) => (
            <PrefRow
              key={p.id}
              p={p}
              on={prefs[p.id]}
              onToggle={(v) =>
                setPrefs((cur) => ({ ...cur, [p.id]: v }))
              }
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Quiet hours"
        description="Push and email pause during this window. In-app notifications still arrive."
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-2xs uppercase tracking-wider text-ink-soft">
              From
            </span>
            <input
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
            />
          </label>
          <label className="space-y-1">
            <span className="text-2xs uppercase tracking-wider text-ink-soft">
              To
            </span>
            <input
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
            />
          </label>
        </div>
      </SettingsCard>

      <div className="flex justify-end pt-2">
        <ButtonPrimary
          onClick={() => toast("Notification preferences saved", "ok")}
          className="inline-flex items-center gap-1"
        >
          <Bell className="size-3.5" /> Save
        </ButtonPrimary>
      </div>
    </>
  );
}

function PrefRow({
  p,
  on,
  onToggle,
}: {
  p: { id: string; label: string; description: string };
  on: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <>
      <div>
        <div className="text-sm">{p.label}</div>
        <div className="text-2xs text-ink-soft">{p.description}</div>
      </div>
      <div className="text-center">
        <Switch checked={on} onCheckedChange={onToggle} />
      </div>
      <div className="text-center">
        <Switch defaultChecked={on && p.id !== "memory_updates"} />
      </div>
      <div className="text-center">
        <Switch defaultChecked={on && p.id === "approvals"} />
      </div>
    </>
  );
}
