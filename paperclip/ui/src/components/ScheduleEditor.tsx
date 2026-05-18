import { useCallback, useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { SchedulePresetFields } from "./schedule-editor/SchedulePresetFields";
import {
  buildCron,
  describeSchedule,
  parseCronToPreset,
  PRESETS,
  type SchedulePreset,
} from "./schedule-editor/scheduleModel";

export { describeSchedule };

export function ScheduleEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (cron: string) => void;
}) {
  const parsed = useMemo(() => parseCronToPreset(value), [value]);
  const [preset, setPreset] = useState<SchedulePreset>(parsed.preset);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [dayOfWeek, setDayOfWeek] = useState(parsed.dayOfWeek);
  const [dayOfMonth, setDayOfMonth] = useState(parsed.dayOfMonth);
  const [customCron, setCustomCron] = useState(preset === "custom" ? value : "");

  useEffect(() => {
    const nextParsed = parseCronToPreset(value);
    setPreset(nextParsed.preset);
    setHour(nextParsed.hour);
    setMinute(nextParsed.minute);
    setDayOfWeek(nextParsed.dayOfWeek);
    setDayOfMonth(nextParsed.dayOfMonth);
    if (nextParsed.preset === "custom") setCustomCron(value);
  }, [value]);

  const emitChange = useCallback(
    (nextPreset: SchedulePreset, nextHour: string, nextMinute: string, nextDow: string, nextDom: string, custom: string) => {
      onChange(nextPreset === "custom" ? custom : buildCron(nextPreset, nextHour, nextMinute, nextDow, nextDom));
    },
    [onChange],
  );

  const handlePresetChange = (newPreset: SchedulePreset) => {
    setPreset(newPreset);
    if (newPreset === "custom") {
      setCustomCron(value);
      return;
    }
    emitChange(newPreset, hour, minute, dayOfWeek, dayOfMonth, customCron);
  };

  return (
    <div className="space-y-3">
      <Select value={preset} onValueChange={(nextPreset) => handlePresetChange(nextPreset as SchedulePreset)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose frequency..." />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" ? (
        <CustomCronField
          value={customCron}
          onChange={(nextCron) => {
            setCustomCron(nextCron);
            emitChange("custom", hour, minute, dayOfWeek, dayOfMonth, nextCron);
          }}
        />
      ) : (
        <SchedulePresetFields
          preset={preset}
          hour={hour}
          minute={minute}
          dayOfWeek={dayOfWeek}
          dayOfMonth={dayOfMonth}
          onHourChange={(nextHour) => {
            setHour(nextHour);
            emitChange(preset, nextHour, minute, dayOfWeek, dayOfMonth, customCron);
          }}
          onMinuteChange={(nextMinute) => {
            setMinute(nextMinute);
            emitChange(preset, hour, nextMinute, dayOfWeek, dayOfMonth, customCron);
          }}
          onDayOfWeekChange={(nextDayOfWeek) => {
            setDayOfWeek(nextDayOfWeek);
            emitChange(preset, hour, minute, nextDayOfWeek, dayOfMonth, customCron);
          }}
          onDayOfMonthChange={(nextDayOfMonth) => {
            setDayOfMonth(nextDayOfMonth);
            emitChange(preset, hour, minute, dayOfWeek, nextDayOfMonth, customCron);
          }}
        />
      )}
    </div>
  );
}

function CustomCronField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0 10 * * *"
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Five fields: minute hour day-of-month month day-of-week
      </p>
    </div>
  );
}
