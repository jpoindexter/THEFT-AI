"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

type Result = { kind: string; id: string; title: string; sub: string; href: string };

const KINDS = ["all", "task", "agent", "artifact"] as const;
type Kind = (typeof KINDS)[number];

export default function SearchPage() {
  const params = useParams<{ org: string }>();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(
    (query: string) => {
      setLoading(true);
      const url = `/api/${params.org}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      void fetch(url)
        .then((r) => r.json())
        .then((j: { results: Result[] }) => {
          setResults(j.results ?? []);
          setLoading(false);
        });
    },
    [params.org],
  );

  useEffect(() => {
    fetchResults("");
  }, [fetchResults]);

  useEffect(() => {
    const t = setTimeout(() => fetchResults(q), 200);
    return () => clearTimeout(t);
  }, [q, fetchResults]);

  const filtered = kind === "all" ? results : results.filter((r) => r.kind === kind);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight mb-3">Search</h1>
          <div className="rounded-lg border border-line bg-paper px-3 py-2 inline-flex items-center gap-2 w-full">
            <Search className="size-4 text-ink-soft" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks, agents, artifacts…"
              className="flex-1 text-base focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {KINDS.map((k) => {
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`text-xs uppercase tracking-wider rounded px-2 py-0.5 transition-colors ${
                    on
                      ? "bg-ink text-paper"
                      : "bg-cream text-ink-muted hover:bg-line"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </header>

        {loading && (
          <p className="text-sm text-ink-muted px-1">Loading…</p>
        )}

        <ul className="space-y-1">
          {!loading && filtered.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <Link
                href={r.href}
                className="rounded-md border border-line/70 bg-paper px-3 py-2 flex items-center justify-between hover:border-line-strong"
              >
                <div>
                  <div className="text-base">{r.title}</div>
                  <div className="text-xs text-ink-muted">{r.sub}</div>
                </div>
                <span className="text-2xs uppercase tracking-wider text-ink-soft">
                  {r.kind}
                </span>
              </Link>
            </li>
          ))}
          {!loading && filtered.length === 0 && (
            <li className="rounded-md border border-line/70 bg-paper px-3 py-3 text-center text-sm text-ink-muted">
              {q ? "No matches." : "No data yet."}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
