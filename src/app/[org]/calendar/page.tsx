import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { CalendarDays, Repeat, Flag, Sparkles } from "lucide-react";

type EventKind = "routine" | "task" | "meeting" | "publish";
type Tone = "sage" | "mustard" | "brick" | "neutral";

type Event = {
  id: string;
  title: string;
  day: number;
  hour: number;
  duration: number;
  kind: EventKind;
  tone: Tone;
  who: string;
};

const TODAY_INDEX = 2;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

const EVENTS: Event[] = [
  { id: "e1", title: "Daily digest", day: 0, hour: 9, duration: 1, kind: "routine", tone: "sage", who: "Operations" },
  { id: "e2", title: "Weekly digest", day: 4, hour: 9, duration: 1, kind: "routine", tone: "sage", who: "Operations" },
  { id: "e3", title: "Monthly close", day: 1, hour: 14, duration: 2, kind: "routine", tone: "sage", who: "Finance" },
  { id: "e4", title: "Subscriptions PR review", day: 2, hour: 11, duration: 1, kind: "task", tone: "mustard", who: "Engineer" },
  { id: "e5", title: "Encompass demo", day: 3, hour: 16, duration: 1, kind: "meeting", tone: "neutral", who: "Sales" },
  { id: "e6", title: "Launch broadcast", day: 4, hour: 10, duration: 1, kind: "publish", tone: "mustard", who: "Marketing" },
  { id: "e7", title: "Deadline · v0 ship", day: 4, hour: 18, duration: 1, kind: "task", tone: "brick", who: "Cofounder" },
  { id: "e8", title: "User research recap", day: 5, hour: 10, duration: 2, kind: "task", tone: "neutral", who: "Operations" },
];

const ICON: Record<EventKind, React.ComponentType<{ className?: string }>> = {
  routine: Repeat,
  task: Flag,
  meeting: CalendarDays,
  publish: Sparkles,
};

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <CalendarDays className="size-5 text-ink-muted" /> Calendar
            </PageTitle>
            <Hint>
              Routines, tasks with deadlines, and scheduled publishes — the
              week your agents have committed to.
            </Hint>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/${org}/routines`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Routines
            </Link>
            <Link
              href={`/${org}/publishing`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Publishing
            </Link>
          </div>
        </header>

        <Card>
          <CardBody className="p-0">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-line/60 text-2xs uppercase tracking-wider text-ink-soft">
              <div className="px-2 py-2"></div>
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className={`px-2 py-2 ${
                    i === TODAY_INDEX ? "text-ink font-medium" : ""
                  }`}
                >
                  {d}
                  {i === TODAY_INDEX && (
                    <span className="ml-1 rounded bg-ink text-paper px-1 py-0.5 normal-case tracking-normal">
                      today
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {HOURS.map((h) => (
                <HourRow
                  key={h}
                  hour={h}
                  events={EVENTS.filter((e) => e.hour === h)}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Up next this week</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {EVENTS.filter((e) => e.day >= TODAY_INDEX)
                .sort(
                  (a, b) => a.day * 24 + a.hour - (b.day * 24 + b.hour),
                )
                .slice(0, 5)
                .map((e) => {
                  const Icon = ICON[e.kind];
                  return (
                    <li
                      key={e.id}
                      className="py-2 flex items-center justify-between text-sm"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Icon className="size-3.5 text-ink-muted shrink-0" />
                        <span className="truncate">{e.title}</span>
                        <Pill tone={e.tone}>{e.kind}</Pill>
                      </span>
                      <span className="text-2xs text-ink-soft shrink-0">
                        {DAYS[e.day]} · {e.hour.toString().padStart(2, "0")}:00 ·
                        {" "}
                        {e.who}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function HourRow({ hour, events }: { hour: number; events: Event[] }) {
  return (
    <>
      <div className="px-2 py-1 border-b border-line/40 text-2xs text-ink-soft">
        {hour.toString().padStart(2, "0")}:00
      </div>
      {Array.from({ length: 7 }, (_, day) => {
        const evt = events.find((e) => e.day === day);
        return (
          <div
            key={day}
            className={`relative border-l border-line/40 border-b border-b-line/40 px-1 py-1 min-h-9 ${
              day === TODAY_INDEX ? "bg-cream/40" : ""
            }`}
          >
            {evt && <EventBlock e={evt} />}
          </div>
        );
      })}
    </>
  );
}

function EventBlock({ e }: { e: Event }) {
  const cls =
    e.tone === "sage"
      ? "border-sage/40 bg-sage/15 text-sage-ink"
      : e.tone === "mustard"
        ? "border-mustard/40 bg-mustard/15 text-mustard-ink"
        : e.tone === "brick"
          ? "border-brick/40 bg-brick/10 text-brick-ink"
          : "border-line/70 bg-paper text-ink";
  const Icon = ICON[e.kind];
  return (
    <div
      className={`rounded-md border px-1.5 py-1 text-2xs leading-tight ${cls}`}
      style={{ minHeight: `${e.duration * 32}px` }}
      title={`${e.title} · ${e.who}`}
    >
      <div className="inline-flex items-center gap-1 truncate">
        <Icon className="size-3 shrink-0" />
        <span className="truncate">{e.title}</span>
      </div>
      <div className="text-ink-soft truncate">{e.who}</div>
    </div>
  );
}
