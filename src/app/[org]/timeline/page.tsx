import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

type Slot = {
  when: string;
  agent: string;
  routine: string;
  routineId: string;
  cron: string;
  enabled: boolean;
  durationMin: number;
};

const SLOTS: Slot[] = [
  {
    when: "Mon 9:00",
    agent: "Operations",
    routine: "Weekly status brief",
    routineId: "weekly_status",
    cron: "0 9 * * 1",
    enabled: true,
    durationMin: 8,
  },
  {
    when: "Mon-Fri 7:00",
    agent: "Marketing",
    routine: "Daily social pack",
    routineId: "social_pack",
    cron: "0 7 * * 1-5",
    enabled: false,
    durationMin: 15,
  },
  {
    when: "Last day · 17:00",
    agent: "Finance",
    routine: "Month-end finance close",
    routineId: "month_close",
    cron: "0 17 L * *",
    enabled: true,
    durationMin: 25,
  },
  {
    when: "Tue 14:00",
    agent: "Engineer",
    routine: "Dependency audit",
    routineId: "dep_audit",
    cron: "0 14 * * 2",
    enabled: true,
    durationMin: 12,
  },
];

const HOURS = ["00", "06", "09", "12", "17", "22"];

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Timeline</PageTitle>
          <Hint>
            What's about to run, and when. Active routines fan out across the
            week.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>This week</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {SLOTS.map((s) => (
                <SlotRow key={s.routineId} s={s} org={org} />
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Day strip</Eyebrow>
            <div className="grid grid-cols-7 gap-1 text-center text-2xs text-ink-soft mt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="font-medium text-ink-muted">{d}</div>
              ))}
              {Array.from({ length: 7 }, (_, i) => i).map((day) => (
                <div
                  key={day}
                  className="rounded-md border border-line/70 bg-canvas h-20 relative overflow-hidden"
                >
                  {SLOTS.filter((s) => isInDay(s, day)).map((s, idx) => (
                    <span
                      key={idx}
                      className={`absolute left-1 right-1 rounded text-2xs px-1 truncate ${
                        s.enabled
                          ? "bg-sage/40 text-sage-ink"
                          : "bg-line/40 text-ink-soft"
                      }`}
                      style={{
                        top: `${idx * 18 + 4}px`,
                        lineHeight: "14px",
                      }}
                      title={`${s.routine} · ${s.cron}`}
                    >
                      {s.routine}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-2xs text-ink-soft px-1">
              {HOURS.map((h) => (
                <span key={h} className="font-mono">
                  {h}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function SlotRow({ s, org }: { s: Slot; org: string }) {
  return (
    <li className="py-2 flex items-start gap-3">
      <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
        <Calendar className="size-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <Link
          href={`/${org}/routines/${s.routineId}`}
          className="text-sm font-medium tracking-tight text-ink hover:underline decoration-line"
        >
          {s.routine}
        </Link>
        <div className="text-xs text-ink-muted inline-flex items-center gap-2">
          <Clock className="size-3" />
          <span className="font-mono">{s.when}</span>
          <span>·</span>
          <span>{s.agent}</span>
          <span>·</span>
          <span>{s.durationMin} min</span>
        </div>
      </div>
      <Pill tone={s.enabled ? "sage" : "neutral"}>
        {s.enabled ? "Active" : "Paused"}
      </Pill>
    </li>
  );
}

function isInDay(s: Slot, day: number) {
  if (s.cron.includes("1-5")) return day < 5;
  if (s.cron.endsWith("* 1")) return day === 0;
  if (s.cron.endsWith("* 2")) return day === 1;
  if (s.cron.includes("L * *")) return day === 6;
  return false;
}
