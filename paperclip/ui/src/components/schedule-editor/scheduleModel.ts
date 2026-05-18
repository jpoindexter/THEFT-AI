export type SchedulePreset = "every_minute" | "every_hour" | "every_day" | "weekdays" | "weekly" | "monthly" | "custom";

export const PRESETS: { value: SchedulePreset; label: string }[] = [
  { value: "every_minute", label: "Every minute" },
  { value: "every_hour", label: "Every hour" },
  { value: "every_day", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom (cron)" },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
}));

export const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i * 5),
  label: String(i * 5).padStart(2, "0"),
}));

export const DAYS_OF_WEEK = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
];

export const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export type ParsedSchedule = {
  preset: SchedulePreset;
  hour: string;
  minute: string;
  dayOfWeek: string;
  dayOfMonth: string;
};

export function parseCronToPreset(cron: string): ParsedSchedule {
  const defaults = { hour: "10", minute: "0", dayOfWeek: "1", dayOfMonth: "1" };

  if (!cron || !cron.trim()) return { preset: "every_day", ...defaults };

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return { preset: "custom", ...defaults };

  const [min, hr, dom, , dow] = parts;
  if (min === "*" && hr === "*" && dom === "*" && dow === "*") return { preset: "every_minute", ...defaults };
  if (hr === "*" && dom === "*" && dow === "*") return { preset: "every_hour", ...defaults, minute: min === "*" ? "0" : min };
  if (dom === "*" && dow === "*" && hr !== "*") return { preset: "every_day", ...defaults, hour: hr, minute: min === "*" ? "0" : min };
  if (dom === "*" && dow === "1-5" && hr !== "*") return { preset: "weekdays", ...defaults, hour: hr, minute: min === "*" ? "0" : min };
  if (dom === "*" && /^\d$/.test(dow) && hr !== "*") return { preset: "weekly", ...defaults, hour: hr, minute: min === "*" ? "0" : min, dayOfWeek: dow };
  if (/^\d{1,2}$/.test(dom) && dow === "*" && hr !== "*") return { preset: "monthly", ...defaults, hour: hr, minute: min === "*" ? "0" : min, dayOfMonth: dom };
  return { preset: "custom", ...defaults };
}

export function buildCron(preset: SchedulePreset, hour: string, minute: string, dayOfWeek: string, dayOfMonth: string): string {
  switch (preset) {
    case "every_minute":
      return "* * * * *";
    case "every_hour":
      return `${minute} * * * *`;
    case "every_day":
      return `${minute} ${hour} * * *`;
    case "weekdays":
      return `${minute} ${hour} * * 1-5`;
    case "weekly":
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case "monthly":
      return `${minute} ${hour} ${dayOfMonth} * *`;
    case "custom":
      return "";
  }
}

export function describeSchedule(cron: string): string {
  const { preset, hour, minute, dayOfWeek, dayOfMonth } = parseCronToPreset(cron);
  const hourLabel = HOURS.find((h) => h.value === hour)?.label ?? `${hour}`;
  const timeStr = `${hourLabel.replace(/ (AM|PM)$/, "")}:${minute.padStart(2, "0")} ${hourLabel.match(/(AM|PM)$/)?.[0] ?? ""}`;

  switch (preset) {
    case "every_minute":
      return "Every minute";
    case "every_hour":
      return `Every hour at :${minute.padStart(2, "0")}`;
    case "every_day":
      return `Every day at ${timeStr}`;
    case "weekdays":
      return `Weekdays at ${timeStr}`;
    case "weekly": {
      const day = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label ?? dayOfWeek;
      return `Every ${day} at ${timeStr}`;
    }
    case "monthly":
      return `Monthly on the ${dayOfMonth}${ordinalSuffix(Number(dayOfMonth))} at ${timeStr}`;
    case "custom":
      return cron || "No schedule set";
  }
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
