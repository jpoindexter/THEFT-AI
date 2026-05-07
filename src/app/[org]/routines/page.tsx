import { Plus, Calendar } from "lucide-react";
import Link from "next/link";

const ROUTINES = [
  {
    id: "weekly_status",
    name: "Weekly status brief",
    agent: "Operations",
    cron: "Mondays at 9am",
    last_run: "Mon 2026-05-04 9:00am",
    enabled: true,
  },
  {
    id: "month_close",
    name: "Month-end finance close",
    agent: "Finance",
    cron: "Last day of month at 5pm",
    last_run: "—",
    enabled: true,
  },
  {
    id: "social_pack",
    name: "Daily social pack",
    agent: "Marketing",
    cron: "Every weekday at 7am",
    last_run: "Tue 2026-05-05 7:00am",
    enabled: false,
  },
];

export default async function RoutinesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Routines</h1>
            <p className="text-[12px] text-ink-muted">
              Scheduled, recurring tasks an agent runs without you asking.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/${org}/timeline`}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-[11px] hover:border-line-strong"
            >
              Timeline
            </Link>
            <Link
              href={`/${org}/routines/new`}
              className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-[12px]"
            >
              <Plus className="size-3.5" /> New routine
            </Link>
          </div>
        </header>
        <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
          {ROUTINES.map((r) => (
            <li key={r.id} className="relative hover:bg-canvas">
              <Link
                href={`/${org}/routines/${r.id}`}
                className="absolute inset-0 z-0"
                aria-label={r.name}
              />
              <div className="relative z-10 px-4 py-3 flex items-center justify-between pointer-events-none">
                <div>
                  <div className="text-[13px] font-medium tracking-tight">
                    {r.name}
                  </div>
                  <div className="text-[11px] text-ink-muted inline-flex items-center gap-2 mt-0.5">
                    <span>{r.agent}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {r.cron}
                    </span>
                    <span>·</span>
                    <span>last run {r.last_run}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span
                    className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                      r.enabled
                        ? "bg-sage/30 text-sage-ink"
                        : "bg-cream text-ink-muted"
                    }`}
                  >
                    {r.enabled ? "Active" : "Paused"}
                  </span>
                  <Link
                    href={`/${org}/routines/${r.id}`}
                    className="text-[11px] rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
