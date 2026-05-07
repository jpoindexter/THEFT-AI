import { Inbox } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Logs</h1>
          <p className="text-sm text-ink-muted">
            Debug errors and track activity in your app.
          </p>
        </div>
        <div className="rounded-md border border-line/70 bg-paper px-2 py-1.5 text-xs text-ink-muted inline-flex items-center gap-1">
          Function Edge Logs ▾
        </div>
      </header>

      <div className="rounded-lg border border-line/70 bg-paper p-12 flex flex-col items-center justify-center text-center min-h-[200px] gap-2">
        <Inbox className="size-6 text-line-strong" />
        <div className="text-base text-ink font-medium">No logs found</div>
        <p className="text-xs text-ink-muted max-w-xs">
          Logs will appear here when your application generates activity.
        </p>
      </div>
    </div>
  );
}
