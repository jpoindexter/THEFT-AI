import { SectionHeader, SettingsCard } from "@/components/settings/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InboxSettings() {
  return (
    <>
      <SectionHeader
        title="Inbox"
        description="Configure organization inboxes and the domains they use to receive messages."
      />

      <SettingsCard title="Inbox domains" description="Choose which domain agents receive email through.">
        <div className="rounded-md border border-line/70 px-3 py-2 text-[12px] text-ink-muted">
          No domains are available yet. Add or buy a domain in Settings → Domains first.
        </div>
      </SettingsCard>

      <SettingsCard title="Agent inboxes" description="Give each custom agent its own inbox address and control whether that inbox is active.">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Agent</div>
          <Select defaultValue="marketing">
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketing">Marketing Agent</SelectItem>
              <SelectItem value="sales">Sales Agent</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border border-line/70 px-3 py-2 text-[12px] text-ink-muted mt-3">
            An inbox-ready domain is required before you can create an inbox for the Marketing Agent.
          </div>
        </div>
      </SettingsCard>
    </>
  );
}
