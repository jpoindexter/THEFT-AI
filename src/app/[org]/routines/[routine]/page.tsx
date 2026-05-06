import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

const ROUTINES: Record<
  string,
  {
    name: string;
    agent: string;
    cron: string;
    prompt: string;
    runs: { when: string; status: "ok" | "failed"; summary: string }[];
  }
> = {
  weekly_status: {
    name: "Weekly status brief",
    agent: "Operations",
    cron: "0 9 * * 1",
    prompt:
      "Write a 5-bullet status brief covering shipped work, in-progress, blockers, decisions needed, and next focus.",
    runs: [
      {
        when: "Mon 2026-05-04 9:00am",
        status: "ok",
        summary: "Posted to #standup. 5 items.",
      },
      {
        when: "Mon 2026-04-27 9:00am",
        status: "ok",
        summary: "Posted to #standup. 4 items.",
      },
    ],
  },
  month_close: {
    name: "Month-end finance close",
    agent: "Finance",
    cron: "0 17 L * *",
    prompt:
      "Reconcile Stripe payouts, AWS bill, and outstanding invoices. Post a close note to #finance with variance vs forecast.",
    runs: [],
  },
  social_pack: {
    name: "Daily social pack",
    agent: "Marketing",
    cron: "0 7 * * 1-5",
    prompt:
      "Draft 3 LinkedIn posts and 3 X posts riffing on yesterday's engineering changes and product launches.",
    runs: [
      {
        when: "Tue 2026-05-05 7:00am",
        status: "failed",
        summary: "No new shipped work to riff on. Skipped.",
      },
    ],
  },
};

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ org: string; routine: string }>;
}) {
  const { org, routine } = await params;
  const r = ROUTINES[routine];
  if (!r) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/routines`}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="size-3" /> Back to routines
        </Link>

        <header>
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Routine · {r.agent}
          </div>
          <h1 className="text-xl tracking-tight">{r.name}</h1>
          <div className="text-[12px] text-stone-500 inline-flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" /> <code className="font-mono">{r.cron}</code>
            </span>
          </div>
        </header>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Prompt
          </div>
          <p className="text-[13px] text-stone-700 leading-snug">{r.prompt}</p>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Recent runs
          </div>
          {r.runs.length === 0 ? (
            <p className="text-[12px] text-stone-500">
              No runs yet. First run scheduled at{" "}
              <code className="font-mono">{r.cron}</code>.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {r.runs.map((run, i) => (
                <li key={i} className="py-2 flex items-start gap-3">
                  <Clock className="size-3.5 text-stone-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-mono text-stone-700">
                      {run.when}
                    </div>
                    <div className="text-[12px] text-stone-600">
                      {run.summary}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                      run.status === "ok"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {run.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end gap-2">
          <button className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400">
            Pause
          </button>
          <button className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400">
            Run now
          </button>
          <button className="text-[12px] rounded-md bg-stone-900 text-white px-3 py-1.5">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
