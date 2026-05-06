import { ScrollText } from "lucide-react";

const LOGS = [
  { ts: "12:42:01", level: "info", source: "api", msg: "POST /api/auth/signin 200 (123ms)" },
  { ts: "12:41:58", level: "info", source: "db", msg: "select 12 rows from public.users (4ms)" },
  { ts: "12:41:50", level: "warn", source: "edge", msg: "rate-limit warning ip=184.x.y.z (8 req/2s)" },
  { ts: "12:41:31", level: "info", source: "api", msg: "GET /api/health 200 (3ms)" },
  { ts: "12:41:22", level: "error", source: "api", msg: "POST /api/stripe/webhook 400 — bad signature" },
  { ts: "12:41:01", level: "info", source: "auth", msg: "user_signed_in user_id=usr_abc123" },
];

const LEVEL_TONE: Record<string, string> = {
  info: "bg-stone-100 text-stone-700",
  warn: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
};

export default function LogsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
          <ScrollText className="size-4 text-stone-500" /> Logs
        </h1>
        <p className="text-[12px] text-stone-500">
          Live tail across edge functions, API routes, database, and auth.
        </p>
      </header>

      <div className="flex items-center gap-2 text-[11px]">
        <select className="rounded-md border border-stone-200 bg-white px-2 py-1">
          <option>All sources</option>
          <option>api</option>
          <option>db</option>
          <option>edge</option>
          <option>auth</option>
        </select>
        <select className="rounded-md border border-stone-200 bg-white px-2 py-1">
          <option>All levels</option>
          <option>info</option>
          <option>warn</option>
          <option>error</option>
        </select>
        <input
          placeholder="Filter…"
          className="rounded-md border border-stone-200 bg-white px-2 py-1 flex-1 focus:outline-none focus:border-stone-400"
        />
      </div>

      <div className="rounded-lg border border-stone-200/70 bg-stone-950 p-3 max-h-[420px] overflow-y-auto">
        <ul className="space-y-1 font-mono text-[11px]">
          {LOGS.map((l, i) => (
            <li key={i} className="flex items-start gap-2 text-stone-300">
              <span className="text-stone-500 shrink-0">{l.ts}</span>
              <span
                className={`uppercase rounded px-1 text-[9px] shrink-0 ${
                  LEVEL_TONE[l.level] ?? "bg-stone-100 text-stone-700"
                }`}
              >
                {l.level}
              </span>
              <span className="text-stone-400 shrink-0">[{l.source}]</span>
              <span className="break-all">{l.msg}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
