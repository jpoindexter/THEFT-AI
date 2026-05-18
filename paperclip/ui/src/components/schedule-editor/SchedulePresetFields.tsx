import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  DAYS_OF_MONTH,
  DAYS_OF_WEEK,
  HOURS,
  MINUTES,
  type SchedulePreset,
} from "./scheduleModel";

export function SchedulePresetFields({
  preset,
  hour,
  minute,
  dayOfWeek,
  dayOfMonth,
  onHourChange,
  onMinuteChange,
  onDayOfWeekChange,
  onDayOfMonthChange,
}: {
  preset: SchedulePreset;
  hour: string;
  minute: string;
  dayOfWeek: string;
  dayOfMonth: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  onDayOfWeekChange: (dayOfWeek: string) => void;
  onDayOfMonthChange: (dayOfMonth: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {preset !== "every_minute" && preset !== "every_hour" ? (
        <TimeFields hour={hour} minute={minute} onHourChange={onHourChange} onMinuteChange={onMinuteChange} />
      ) : null}
      {preset === "every_hour" ? <MinuteField minute={minute} onMinuteChange={onMinuteChange} /> : null}
      {preset === "weekly" ? <WeekdayButtons dayOfWeek={dayOfWeek} onDayOfWeekChange={onDayOfWeekChange} /> : null}
      {preset === "monthly" ? <MonthDayField dayOfMonth={dayOfMonth} onDayOfMonthChange={onDayOfMonthChange} /> : null}
    </div>
  );
}

function TimeFields({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  hour: string;
  minute: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">at</span>
      <Select value={hour} onValueChange={onHourChange}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">:</span>
      <MinuteSelect value={minute} onValueChange={onMinuteChange} />
    </>
  );
}

function MinuteField({
  minute,
  onMinuteChange,
}: {
  minute: string;
  onMinuteChange: (minute: string) => void;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">at minute</span>
      <MinuteSelect value={minute} onValueChange={onMinuteChange} prefix=":" />
    </>
  );
}

function MinuteSelect({
  value,
  onValueChange,
  prefix = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MINUTES.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {prefix}{option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function WeekdayButtons({
  dayOfWeek,
  onDayOfWeekChange,
}: {
  dayOfWeek: string;
  onDayOfWeekChange: (dayOfWeek: string) => void;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">on</span>
      <div className="flex gap-1">
        {DAYS_OF_WEEK.map((day) => (
          <Button
            key={day.value}
            type="button"
            variant={dayOfWeek === day.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onDayOfWeekChange(day.value)}
          >
            {day.label}
          </Button>
        ))}
      </div>
    </>
  );
}

function MonthDayField({
  dayOfMonth,
  onDayOfMonthChange,
}: {
  dayOfMonth: string;
  onDayOfMonthChange: (dayOfMonth: string) => void;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">on day</span>
      <Select value={dayOfMonth} onValueChange={onDayOfMonthChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DAYS_OF_MONTH.map((day) => (
            <SelectItem key={day.value} value={day.value}>
              {day.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
