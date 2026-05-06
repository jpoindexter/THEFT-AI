"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Server, ArrowRight } from "lucide-react";

const INSTALLED = [
  { slug: "linear", name: "Linear", status: "running" },
  { slug: "notion", name: "Notion", status: "running" },
  { slug: "postgres", name: "Postgres", status: "stopped" },
];

const SUGGESTED = [
  {
    name: "Linear",
    cmd: "npx -y @linear/mcp-server",
    desc: "Issues, projects, cycles. Read + write.",
  },
  {
    name: "Notion",
    cmd: "npx -y @notionhq/mcp-server",
    desc: "Pages, databases, search.",
  },
  {
    name: "Postgres",
    cmd: "npx -y @modelcontextprotocol/server-postgres",
    desc: "Read-only SQL against any Postgres URL.",
  },
  {
    name: "Slack",
    cmd: "npx -y slack-mcp",
    desc: "Channel messages and DM history.",
  },
];

export default function McpSetupPage() {
  const params = useParams<{ org: string }>();
  const [name, setName] = useState("");
  const [cmd, setCmd] = useState("");
  const [env, setEnv] = useState("");

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/integrations`}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="size-3" /> Back to integrations
        </Link>

        <header>
          <h1 className="text-xl tracking-tight inline-flex items-center gap-2">
            <Server className="size-5 text-stone-500" /> MCP servers
          </h1>
          <p className="text-[12px] text-stone-500">
            Plug any Model Context Protocol server into the workspace. Tools
            exposed by the server become callable by every agent.
          </p>
        </header>

        {INSTALLED.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 mb-2">
              Installed
            </div>
            <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
              {INSTALLED.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/${params.org}/integrations/mcp/${s.slug}`}
                    className="px-4 py-3 flex items-center justify-between hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          s.status === "running"
                            ? "bg-emerald-500"
                            : "bg-stone-300"
                        }`}
                      />
                      <span className="text-[13px] font-medium">{s.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-500">
                        {s.status}
                      </span>
                    </div>
                    <ArrowRight className="size-3 text-stone-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 mb-2">
            Suggested
          </div>
          <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
            {SUGGESTED.map((s) => (
              <li
                key={s.name}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{s.name}</div>
                  <div className="text-[11px] text-stone-500">{s.desc}</div>
                  <code className="text-[10px] font-mono text-stone-400 block mt-1 truncate">
                    {s.cmd}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setName(s.name);
                    setCmd(s.cmd);
                  }}
                  className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400 shrink-0"
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
          <div className="text-[14px] font-medium tracking-tight">
            Add server
          </div>
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linear"
              className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-[13px] focus:outline-none focus:border-stone-400"
            />
          </Field>
          <Field label="Command" hint="The CLI command that starts the MCP server.">
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="npx -y @vendor/mcp-server"
              className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-[13px] font-mono focus:outline-none focus:border-stone-400"
            />
          </Field>
          <Field
            label="Environment"
            hint="One KEY=VALUE per line. Stored encrypted."
          >
            <textarea
              value={env}
              onChange={(e) => setEnv(e.target.value)}
              rows={4}
              placeholder="LINEAR_API_KEY=lin_..."
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-stone-400"
            />
          </Field>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={!name || !cmd}
              className="text-[12px] rounded-md bg-stone-900 text-white px-3 py-1.5 disabled:opacity-40"
            >
              Add server
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[12px] text-stone-700">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-stone-500">{hint}</p>}
    </div>
  );
}
