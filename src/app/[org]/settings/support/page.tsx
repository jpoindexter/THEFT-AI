import { SectionHeader } from "@/components/settings/section";
import { Send, RefreshCw, Inbox } from "lucide-react";

export default function Support() {
  return (
    <>
      <SectionHeader
        title="Support"
        description="Reach the Cofounder team and review your support reports."
      />

      <section className="rounded-lg border border-line/70 bg-paper p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-md font-medium">Reach us</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Send a report from here, or type &quot;/help&quot; in an agent conversation to flag the current step.
            </p>
          </div>
          <button className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 shrink-0 ml-4">
            <Send className="size-3" />
            Send a report
          </button>
        </div>
        <div className="text-sm text-ink-muted space-y-1">
          <div>What we include:</div>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            <li>What you wrote</li>
            <li>Current page and session</li>
            <li>Recent replay (if available)</li>
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-line/70 bg-paper p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-md font-medium">Your reports</h2>
            <p className="text-sm text-ink-muted mt-0.5">Recent reports from this browser and account.</p>
          </div>
          <button className="inline-flex items-center gap-1.5 text-xs rounded-md border border-line px-2 py-1 hover:border-line-strong shrink-0 ml-4">
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>
        <div className="rounded-md border border-line/70 p-6 text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="size-8 rounded-full border border-line/70 flex items-center justify-center">
              <Inbox className="size-4 text-ink-soft" />
            </div>
          </div>
          <div className="text-sm font-medium text-ink">No reports yet</div>
          <p className="text-xs text-ink-muted">
            Reports you send will appear here so you can track while the team has seen.
          </p>
        </div>
      </section>
    </>
  );
}
