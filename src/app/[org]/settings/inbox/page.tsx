import { SectionHeader, SettingsCard } from "@/components/settings/section";

const AGENTS = ["Marketing Agent", "Sales Agent", "Support Agent"];

export default function InboxSettings() {
  return (
    <>
      <SectionHeader
        title="Inbox"
        description="Configure organization inboxes and the domains they use to receive messages."
      />

      <SettingsCard
        title="Inbox domains"
        description="Choose which of your domains can receive email for agents. We'll handle the domain setup and keep the status here up to date."
      >
        <div className="rounded-md border border-line/70 px-3 py-2 text-sm text-ink-muted">
          No domains are available yet. Add or buy a domain in settings domains first.
        </div>
      </SettingsCard>

      <SettingsCard
        title="Agent inboxes"
        description="Give each custom agent its own inbox address and control whether that inbox is active."
      >
        <div className="space-y-2">
          <label className="text-xs text-ink-muted">Agent</label>
          <select className="w-full rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm focus:outline-none focus:border-line-strong appearance-none">
            {AGENTS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <div className="rounded-md border border-line/70 px-3 py-2 text-sm text-ink-muted">
            An inbox-ready domain is required before you can create an inbox for Marketing Agent.
          </div>
        </div>
      </SettingsCard>
    </>
  );
}
