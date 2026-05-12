"use client";

import { useState } from "react";

const TOOLKITS = [
  { name: "Outlook", tools: 282, color: "#0078D4", letter: "O" },
  { name: "Perplexity AI", tools: 9, color: "#20808D", letter: "P" },
  { name: "HubSpot", tools: 232, color: "#FF7A59", letter: "H" },
  { name: "Code Interpreter", tools: 5, color: "#6B7280", letter: "C" },
  { name: "SerpApi", tools: 48, color: "#16A34A", letter: "S" },
  { name: "Jira", tools: 94, color: "#0052CC", letter: "J" },
  { name: "Firecrawl", tools: 29, color: "#EF4444", letter: "F" },
  { name: "Tavily", tools: 5, color: "#8B5CF6", letter: "T" },
  { name: "YouTube", tools: 47, color: "#FF0000", letter: "Y" },
  { name: "Slackbot", tools: 85, color: "#4A154B", letter: "S" },
  { name: "Canvas", tools: 573, color: "#E66000", letter: "C" },
];

const PAGE_SIZE = 7;

export default function McpPage() {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const filtered = query
    ? TOOLKITS.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : TOOLKITS;

  const visible = filtered.slice(0, shown);
  const hasMore = filtered.length > shown;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl tracking-tight">MCP</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Connect third-party apps via Composio for your agent to use.
        </p>
      </header>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(PAGE_SIZE); }}
          placeholder="Search toolkits..."
          className="w-full h-9 rounded-md border border-line bg-paper pl-9 pr-3 text-base focus:outline-none focus:border-line-strong"
        />
      </div>

      <div className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
        {visible.map((t) => (
          <div key={t.name} className="px-4 py-3 flex items-center gap-3">
            <div
              className="size-7 rounded-md flex items-center justify-center text-white font-semibold text-xs shrink-0"
              style={{ backgroundColor: t.color }}
            >
              {t.letter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-medium">{t.name}</div>
              <div className="text-xs text-ink-muted">{t.tools} tools</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="size-2 rounded-full border border-ink-soft inline-block" />
                Not connected
              </div>
              {added.has(t.name) ? (
                <span className="text-xs rounded-md border border-sage bg-sage/10 text-sage-ink px-2 py-1">
                  Added
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdded((prev) => new Set([...prev, t.name]))}
                  className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="px-4 py-6 text-sm text-ink-muted text-center">
            No toolkits match &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="text-sm rounded-md border border-line bg-paper px-4 py-1.5 hover:border-line-strong"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
