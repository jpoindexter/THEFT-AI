"use client";

import { useState, useRef, useEffect } from "react";
import { Inbox, Search, Check } from "lucide-react";

const LOG_TYPES = [
  { key: "edge", label: "Function Edge Logs", desc: "Edge function execution logs with request and response metadata" },
  { key: "auth", label: "Authentication Logs", desc: "User authentication events and security logs" },
  { key: "postgres", label: "PostgreSQL Logs", desc: "Database queries, errors, and performance metrics" },
  { key: "realtime", label: "Realtime Logs", desc: "Realtime channel activity and subscription events" },
];

export default function LogsPage() {
  const [selected, setSelected] = useState(LOG_TYPES[0]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? LOG_TYPES.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()))
    : LOG_TYPES;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Logs</h1>
          <p className="text-sm text-ink-muted">
            Debug errors and track activity in your app.
          </p>
        </div>
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-line/70 bg-paper px-2.5 py-1.5 text-xs text-ink-muted inline-flex items-center gap-1 hover:border-line-strong"
          >
            {selected.label} ▾
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-line/70 bg-paper shadow-lg overflow-hidden">
              <div className="p-2 border-b border-line/70">
                <div className="flex items-center gap-1.5 rounded-md border border-line/70 px-2 py-1 bg-canvas">
                  <Search className="size-3 text-ink-soft shrink-0" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search log types..."
                    className="text-xs bg-transparent focus:outline-none w-full"
                  />
                </div>
              </div>
              <ul className="py-1 max-h-56 overflow-y-auto">
                {filtered.map((t) => (
                  <li key={t.key}>
                    <button
                      type="button"
                      onClick={() => { setSelected(t); setOpen(false); setSearch(""); }}
                      className="w-full text-left px-3 py-2 hover:bg-canvas flex items-start gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-ink">{t.label}</div>
                        <div className="text-2xs text-ink-muted mt-0.5 leading-snug">{t.desc}</div>
                      </div>
                      {selected.key === t.key && (
                        <Check className="size-3 text-ink-muted shrink-0 mt-0.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      <div className="rounded-lg border border-line/70 bg-paper p-12 flex flex-col items-center justify-center text-center min-h-[200px] gap-2">
        <Inbox className="size-6 text-line-strong" />
        <div className="text-base text-ink font-medium">No logs found</div>
        <p className="text-xs text-ink-muted max-w-xs">
          Logs will appear here when your application generates activity.
        </p>
      </div>
    </div>
  );
}
