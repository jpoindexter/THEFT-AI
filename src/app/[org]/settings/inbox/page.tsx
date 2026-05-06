import { SectionHeader, SettingsCard } from "@/components/settings/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pill } from "@/components/ui/primitives";

const DOMAINS = [{ host: "theft.ai", verified: true }];

const AGENT_INBOXES = [
  { agent: "Marketing Agent", local: "marketing", enabled: true, autoreply: true },
  { agent: "Sales Agent", local: "sales", enabled: true, autoreply: false },
  { agent: "Support Agent", local: "support", enabled: false, autoreply: false },
];

export default function InboxSettings() {
  return (
    <>
      <SectionHeader
        title="Inbox"
        description="Configure organization inboxes and the domains they use to receive messages."
      />

      <SettingsCard
        title="Inbox domains"
        description="Domains verified for inbound email. Add one in Settings → Domains."
      >
        {DOMAINS.length === 0 ? (
          <div className="rounded-md border border-line/70 px-3 py-2 text-sm text-ink-muted">
            No domains are available yet.
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            {DOMAINS.map((d) => (
              <li
                key={d.host}
                className="py-2 flex items-center justify-between text-sm"
              >
                <span className="font-mono">{d.host}</span>
                <Pill tone={d.verified ? "sage" : "mustard"}>
                  {d.verified ? "Verified" : "Pending"}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard
        title="Agent inboxes"
        description="Each agent gets its own inbox address. Inbound messages route to the agent and become tasks."
      >
        <ul className="divide-y divide-line/60">
          {AGENT_INBOXES.map((i) => (
            <li
              key={i.local}
              className="py-3 grid grid-cols-[1fr_auto_auto] items-center gap-3"
            >
              <div>
                <div className="text-base font-medium">{i.agent}</div>
                <code className="text-xs text-ink-muted">
                  {i.local}@{DOMAINS[0]?.host ?? "—"}
                </code>
                <div className="text-xs text-ink-soft mt-0.5">
                  Auto-reply when agent is busy: {i.autoreply ? "on" : "off"}
                </div>
              </div>
              <Switch defaultChecked={i.enabled} />
              <Select defaultValue="immediate">
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Reply immediately</SelectItem>
                  <SelectItem value="batch">Batch every 30 min</SelectItem>
                  <SelectItem value="manual">Manual approval</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Routing rules"
        description="Optional patterns: forward foo+billing@theft.ai to the Finance agent, etc."
      >
        <ul className="space-y-1.5">
          {[
            { pattern: "*+billing@", agent: "Finance" },
            { pattern: "*+legal@", agent: "Legal" },
          ].map((r) => (
            <li
              key={r.pattern}
              className="rounded-md border border-line/70 px-3 py-1.5 flex items-center justify-between text-sm"
            >
              <code className="font-mono">{r.pattern}</code>
              <span className="text-xs text-ink-muted">→ {r.agent}</span>
            </li>
          ))}
        </ul>
        <button className="mt-2 text-xs rounded-md border border-line px-2 py-1 hover:border-line-strong">
          + Add rule
        </button>
      </SettingsCard>
    </>
  );
}
