import { Plus, Calendar } from "lucide-react";

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

export default function RoutinesPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Routines</h1>
            <p className="text-[12px] text-stone-500">
              Scheduled, recurring tasks an agent runs without you asking.
            </p>
          </div>
          <button className="inline-flex items-center gap-1 rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]">
            <Plus className="size-3.5" /> New routine
          </button>
        </header>
        <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
          {ROUTINES.map((r) => (
            <li
              key={r.id}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="text-[13px] font-medium tracking-tight">
                  {r.name}
                </div>
                <div className="text-[11px] text-stone-500 inline-flex items-center gap-2 mt-0.5">
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
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                    r.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {r.enabled ? "Active" : "Paused"}
                </span>
                <button className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400">
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
