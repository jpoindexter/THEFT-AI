import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ org: string; routine: string }>;
}) {
  const { org, routine } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();
  const routines = await db.listRoutines(o.id);
  const r = routines.find((x) => x.id === routine);
  if (!r) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/routines`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to routines
        </Link>

        <header>
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Routine · {r.agent}
          </div>
          <h1 className="text-xl tracking-tight">{r.name}</h1>
          <div className="text-sm text-ink-muted inline-flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              <code className="font-mono">{r.cron}</code>
            </span>
            <span
              className={`text-2xs uppercase rounded px-1.5 py-0.5 ${
                r.enabled
                  ? "bg-sage/30 text-sage-ink"
                  : "bg-cream text-ink-muted border border-line/70"
              }`}
            >
              {r.enabled ? "Active" : "Paused"}
            </span>
          </div>
        </header>

        {r.description && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Description
            </div>
            <p className="text-base text-ink leading-snug">{r.description}</p>
          </section>
        )}

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Last run
          </div>
          {r.last_run_at ? (
            <div className="flex items-center gap-3">
              <Clock className="size-3.5 text-ink-soft shrink-0" />
              <span className="text-sm font-mono">
                {new Date(r.last_run_at).toLocaleString()}
              </span>
              {r.last_run_status && (
                <span
                  className={`text-2xs uppercase rounded px-1.5 py-0.5 ${
                    r.last_run_status === "ok"
                      ? "bg-sage/30 text-sage-ink"
                      : "bg-brick/15 text-brick-ink"
                  }`}
                >
                  {r.last_run_status}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              No runs yet. First run scheduled at{" "}
              <code className="font-mono">{r.cron}</code>.
            </p>
          )}
        </section>

        <div className="flex justify-end gap-2">
          <Link
            href={`/${org}/routines/${routine}/edit`}
            className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
