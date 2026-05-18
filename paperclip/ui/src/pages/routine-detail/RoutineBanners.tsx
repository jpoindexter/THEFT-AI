import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoutineEditDraft, SecretMessage } from "./routineDetailModel";

export function SecretMaterialBanner({
  secretMessage,
  onCopy,
}: {
  secretMessage: SecretMessage;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3 text-sm">
      <div>
        <p className="font-medium">{secretMessage.title}</p>
        <p className="text-xs text-muted-foreground">Save this now. Paperclip will not show the secret value again.</p>
      </div>
      <div className="space-y-3">
        {secretMessage.entries.map((entry, index) => (
          <div key={`${entry.webhookUrl}-${index}`} className="space-y-2">
            {secretMessage.entries.length > 1 && (
              <p className="text-xs font-medium text-muted-foreground">
                Webhook trigger {index + 1} of {secretMessage.entries.length}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input value={entry.webhookUrl} readOnly className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => onCopy("Webhook URL", entry.webhookUrl)}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                URL
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input value={entry.webhookSecret} readOnly className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => onCopy("Webhook secret", entry.webhookSecret)}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Secret
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SaveConflictBanner({
  routineDefaults,
  onReload,
}: {
  routineDefaults: RoutineEditDraft | null;
  onReload: (defaults: RoutineEditDraft) => void;
}) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-amber-200">Out of date</p>
          <p className="text-xs text-muted-foreground">
            This routine changed while you were editing. Reload to merge the latest revision before saving again.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (routineDefaults) onReload(routineDefaults);
            }}
          >
            Reload latest
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MissingDefaultAgentBanner() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200">
      Default agent required. This routine can stay as a draft and still run manually, but automation stays paused until you assign a default agent.
    </div>
  );
}
