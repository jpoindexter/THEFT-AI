import type { BackupRetentionPolicy, PatchInstanceGeneralSettings } from "@paperclipai/shared";
import {
  DAILY_RETENTION_PRESETS,
  MONTHLY_RETENTION_PRESETS,
  WEEKLY_RETENTION_PRESETS,
} from "@paperclipai/shared";
import { Button } from "@/components/ui/button";

type BackupRetentionSectionProps = {
  backupRetention: BackupRetentionPolicy;
  disabled: boolean;
  onUpdate: (patch: PatchInstanceGeneralSettings) => void;
};

export function BackupRetentionSection({
  backupRetention,
  disabled,
  onUpdate,
}: BackupRetentionSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold">Backup retention</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Configure how long automatic database backups are retained. Backups run roughly every hour and are
            compressed with gzip. Within the daily window all backups are kept; beyond that, one backup per week and one
            per month are preserved.
          </p>
        </div>

        <PresetRow
          label="Daily"
          values={DAILY_RETENTION_PRESETS}
          activeValue={backupRetention.dailyDays}
          unit={(value) => `${value} days`}
          disabled={disabled}
          onSelect={(dailyDays) => onUpdate({ backupRetention: { ...backupRetention, dailyDays } })}
        />
        <PresetRow
          label="Weekly"
          values={WEEKLY_RETENTION_PRESETS}
          activeValue={backupRetention.weeklyWeeks}
          unit={(value) => value === 1 ? "1 week" : `${value} weeks`}
          disabled={disabled}
          onSelect={(weeklyWeeks) => onUpdate({ backupRetention: { ...backupRetention, weeklyWeeks } })}
        />
        <PresetRow
          label="Monthly"
          values={MONTHLY_RETENTION_PRESETS}
          activeValue={backupRetention.monthlyMonths}
          unit={(value) => value === 1 ? "1 month" : `${value} months`}
          disabled={disabled}
          onSelect={(monthlyMonths) => onUpdate({ backupRetention: { ...backupRetention, monthlyMonths } })}
        />
      </div>
    </section>
  );
}

function PresetRow<T extends number>({
  label,
  values,
  activeValue,
  unit,
  disabled,
  onSelect,
}: {
  label: string;
  values: readonly T[];
  activeValue: T;
  unit: (value: T) => string;
  disabled: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="theft-label-compact font-medium">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Button
            key={value}
            type="button"
            variant={activeValue === value ? "default" : "outline"}
            disabled={disabled}
            onClick={() => onSelect(value)}
          >
            {unit(value)}
          </Button>
        ))}
      </div>
    </div>
  );
}
