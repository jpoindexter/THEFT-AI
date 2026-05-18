import { Clock, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

type IssueRecoverySectionProps = {
  enabled: boolean;
  lookbackHours: number;
  lookbackHoursDraft: string;
  lookbackHoursIsValid: boolean;
  parsedLookbackHours: number;
  isPending: boolean;
  onDraftChange: (value: string) => void;
  onToggle: () => void;
  onSaveHours: () => void;
  onPreview: () => void;
  onRunNow: () => void;
};

export function IssueRecoverySection({
  enabled,
  lookbackHours,
  lookbackHoursDraft,
  lookbackHoursIsValid,
  parsedLookbackHours,
  isPending,
  onDraftChange,
  onToggle,
  onSaveHours,
  onPreview,
  onRunNow,
}: IssueRecoverySectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">Auto-Create Issue Recovery Tasks</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Let the heartbeat scheduler create recovery issues for issue dependency chains found inside the
              configured lookback window.
            </p>
          </div>
          <ToggleSwitch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={isPending}
            aria-label="Toggle issue graph liveness auto-recovery"
          />
        </div>

        <div className="settings-control-grid grid gap-3 sm:items-end">
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Lookback hours
            </span>
            <Input
              type="number"
              min={1}
              max={720}
              step={1}
              value={lookbackHoursDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              aria-invalid={!lookbackHoursIsValid}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onSaveHours}
              disabled={isPending || parsedLookbackHours === lookbackHours}
            >
              Save hours
            </Button>
            <Button variant="outline" onClick={onPreview} disabled={isPending}>
              <Search className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={onRunNow} disabled={isPending || !enabled}>
              <Play className="h-4 w-4" />
              Run now
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Current window: last {lookbackHours} {lookbackHours === 1 ? "hour" : "hours"}.
        </p>
      </div>
    </section>
  );
}
