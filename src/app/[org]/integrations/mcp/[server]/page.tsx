import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Server, Activity, Trash2 } from "lucide-react";

const SERVERS: Record<
  string,
  {
    name: string;
    cmd: string;
    env: string[];
    status: "running" | "starting" | "failed" | "stopped";
    tools: { name: string; description: string }[];
    logs: { ts: string; level: "info" | "warn" | "error"; msg: string }[];
  }
> = {
  linear: {
    name: "Linear",
    cmd: "npx -y @linear/mcp-server",
    env: ["LINEAR_API_KEY"],
    status: "running",
    tools: [
      { name: "list_issues", description: "List issues in a team." },
      { name: "create_issue", description: "Create an issue." },
      { name: "update_issue", description: "Update issue state/priority." },
    ],
    logs: [
      { ts: "12:04:11", level: "info", msg: "Started server (pid 24112)" },
      { ts: "12:04:11", level: "info", msg: "Registered 8 tools" },
      { ts: "12:08:42", level: "info", msg: "tool list_issues called" },
    ],
  },
  notion: {
    name: "Notion",
    cmd: "npx -y @notionhq/mcp-server",
    env: ["NOTION_TOKEN"],
    status: "running",
    tools: [
      { name: "search_pages", description: "Search Notion workspace pages." },
      { name: "read_page", description: "Read a Notion page." },
    ],
    logs: [],
  },
  postgres: {
    name: "Postgres",
    cmd: "npx -y @modelcontextprotocol/server-postgres",
    env: ["DATABASE_URL"],
    status: "stopped",
    tools: [{ name: "query", description: "Read-only SQL query." }],
    logs: [],
  },
};

const STATUS_TONE: Record<string, string> = {
  running: "bg-emerald-100 text-emerald-700",
  starting: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  stopped: "bg-stone-100 text-stone-500",
};

export default async function McpServerDetailPage({
  params,
}: {
  params: Promise<{ org: string; server: string }>;
}) {
  const { org, server } = await params;
  const s = SERVERS[server];
  if (!s) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/integrations/mcp`}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="size-3" /> Back to MCP servers
        </Link>

        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-xl tracking-tight inline-flex items-center gap-2">
              <Server className="size-5 text-stone-500" /> {s.name}
            </h1>
            <code className="text-[11px] font-mono text-stone-500 block mt-1">
              {s.cmd}
            </code>
          </div>
          <span
            className={`text-[10px] uppercase rounded px-1.5 py-0.5 shrink-0 ${
              STATUS_TONE[s.status]
            }`}
          >
            {s.status}
          </span>
        </header>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Environment
          </div>
          <ul className="space-y-1">
            {s.env.map((e) => (
              <li
                key={e}
                className="text-[12px] font-mono flex items-center justify-between"
              >
                <span>{e}</span>
                <span className="text-[10px] text-stone-400">
                  set · encrypted
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Tools ({s.tools.length})
          </div>
          <ul className="divide-y divide-stone-100">
            {s.tools.map((t) => (
              <li key={t.name} className="py-2">
                <code className="text-[12px] font-mono">{t.name}</code>
                <div className="text-[11px] text-stone-500">
                  {t.description}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400 inline-flex items-center gap-1">
            <Activity className="size-3" /> Logs
          </div>
          {s.logs.length === 0 ? (
            <p className="text-[12px] text-stone-500">
              No logs yet. Start the server to see output.
            </p>
          ) : (
            <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed bg-stone-50 rounded-md p-2 max-h-64 overflow-y-auto">
              {s.logs
                .map((l) => `${l.ts} [${l.level}] ${l.msg}`)
                .join("\n")}
            </pre>
          )}
        </section>

        <div className="flex justify-end gap-2">
          {s.status === "running" ? (
            <button className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400">
              Restart
            </button>
          ) : (
            <button className="text-[11px] rounded-md bg-stone-900 text-white px-3 py-1.5">
              Start
            </button>
          )}
          <button className="inline-flex items-center gap-1 text-[11px] rounded-md border border-red-300 bg-white text-red-700 px-2 py-1 hover:bg-red-50">
            <Trash2 className="size-3" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}
