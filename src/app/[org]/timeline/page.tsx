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
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";

function isInDay(cron: string, day: number): boolean {
  if (cron.includes("1-5")) return day < 5;
  const parts = cron.split(" ");
  const dow = parts[4];
  if (dow === "*") return true;
  if (dow === "1-5") return day < 5;
  const n = parseInt(dow);
  if (!isNaN(n)) return n % 7 === day;
  return false;
}

function cronToHuman(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length < 5) return cron;
  const [min, hour, dom, , dow] = parts;
  const h = hour.padStart(2, "0");
  const m = min.padStart(2, "0");
  if (dow === "1-5") return `Mon-Fri ${h}:${m}`;
  if (dow === "1") return `Mon ${h}:${m}`;
  if (dow === "2") return `Tue ${h}:${m}`;
  if (dow === "3") return `Wed ${h}:${m}`;
  if (dow === "4") return `Thu ${h}:${m}`;
  if (dow === "5") return `Fri ${h}:${m}`;
  if (dom === "L") return `Last day ${h}:${m}`;
  if (dow === "*") return `Daily ${h}:${m}`;
  return `${h}:${m}`;
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const routines = await db.listRoutines(o.id);
  const active = routines.filter((r) => r.enabled);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Timeline</PageTitle>
          <Hint>
            What's about to run, and when. Active routines fan out across the week.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>Scheduled routines ({routines.length})</Eyebrow>
            {routines.length === 0 ? (
              <p className="text-sm text-ink-muted mt-2">
                No routines yet.{" "}
                <Link href={`/${org}/routines/new`} className="underline hover:text-ink">
                  Create one
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-line/60 mt-2">
                {routines.map((r) => (
                  <li key={r.id} className="py-2 flex items-start gap-3">
                    <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
                      <Calendar className="size-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${org}/routines`}
                        className="text-sm font-medium tracking-tight text-ink hover:underline decoration-line"
                      >
                        {r.name}
                      </Link>
                      <div className="text-xs text-ink-muted inline-flex items-center gap-2">
                        <Clock className="size-3" />
                        <span className="font-mono">{cronToHuman(r.cron)}</span>
                        <span>·</span>
                        <span>{r.agent}</span>
                      </div>
                    </div>
                    <Pill tone={r.enabled ? "sage" : "neutral"}>
                      {r.enabled ? "Active" : "Paused"}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {active.length > 0 && (
          <Card>
            <CardBody>
              <Eyebrow>Day strip (active only)</Eyebrow>
              <div className="grid grid-cols-7 gap-1 text-center text-2xs text-ink-soft mt-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="font-medium text-ink-muted">{d}</div>
                ))}
                {Array.from({ length: 7 }, (_, i) => i).map((day) => (
                  <div key={day} className="rounded-md border border-line/70 bg-canvas h-20 relative overflow-hidden">
                    {active.filter((r) => isInDay(r.cron, day)).map((r, idx) => (
                      <span
                        key={r.id}
                        className="absolute left-1 right-1 rounded text-2xs px-1 truncate bg-sage/40 text-sage-ink"
                        style={{ top: `${idx * 18 + 4}px`, lineHeight: "14px" }}
                        title={`${r.name} · ${r.cron}`}
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
