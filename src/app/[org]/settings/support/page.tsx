import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { Send, RefreshCw } from "lucide-react";

export default function Support() {
  return (
    <>
      <SectionHeader
        title="Support"
        description="Reach the Cofounder team and review your support reports."
      />
      <SettingsCard title="Reach us" description={`Send a report from here, or type "/help" in an agent conversation to flag the current step.`}>
        <div className="text-sm text-ink-muted space-y-1">
          <div>What we include:</div>
          <ul className="list-disc list-inside text-xs">
            <li>What you wrote</li>
            <li>Current page and session</li>
            <li>Recent replay (if available)</li>
          </ul>
        </div>
        <button className="inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-3 py-1">
          <Send className="size-3" />
          Send a report
        </button>
      </SettingsCard>

      <SettingsCard title="Your reports" description="Recent reports from this browser and account.">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-muted">No reports yet</span>
          <button className="inline-flex items-center gap-1 text-xs rounded-md border border-line px-2 py-0.5 hover:border-line-strong">
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>
        <div className="rounded-md border border-line/70 p-6 text-center text-sm text-ink-muted">
          Reports you send will appear here so you can track while the team has seen.
        </div>
      </SettingsCard>
    </>
  );
}
