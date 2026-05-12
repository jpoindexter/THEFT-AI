"use client";

import { useState } from "react";

type Advisor = {
  title: string;
  body: string;
  category: string;
};

const ADVISORS: Advisor[] = [
  {
    title: "Missing index on subscriptions.user_id",
    body: "Sequential scans observed on this column. Adding an index would drop the query from 220ms p95 to <5ms.",
    category: "Performance",
  },
  {
    title: "users.email_lower is unused",
    body: "Last query referenced 73 days ago. Drop or document to prevent storage drift.",
    category: "Performance",
  },
  {
    title: "Add ON DELETE CASCADE to messages.task_id",
    body: "Currently NO ACTION. Deletes would orphan messages. Add a cascade constraint to keep referential integrity.",
    category: "Performance",
  },
];

function AdvisorCard({ advisor }: { advisor: Advisor }) {
  const [activeTab, setActiveTab] = useState<"info" | "category">("info");

  return (
    <li className="rounded-lg border border-line bg-paper overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-line">
        <h2 className="text-sm font-medium text-ink leading-snug">
          {advisor.title}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`text-2xs uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${
              activeTab === "info"
                ? "bg-canvas border-line-strong text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            INFO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("category")}
            className={`text-2xs uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${
              activeTab === "category"
                ? "bg-canvas border-line-strong text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {advisor.category}
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-ink leading-relaxed">{advisor.body}</p>
      </div>
    </li>
  );
}

export default function SuggestionsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight">Advisors</h1>
        <p className="text-sm text-ink-muted">
          Improve your project&apos;s security and performance.
        </p>
      </header>

      <ul className="space-y-2">
        {ADVISORS.map((advisor, i) => (
          <AdvisorCard key={i} advisor={advisor} />
        ))}
      </ul>
    </div>
  );
}
