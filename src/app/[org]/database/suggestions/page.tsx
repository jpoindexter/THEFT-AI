import { Lightbulb, AlertTriangle } from "lucide-react";

const SUGGESTIONS = [
  {
    severity: "high",
    title: "Missing index on subscriptions.user_id",
    body: "Sequential scans observed on this column. Adding an index would drop the query from 220ms p95 to <5ms.",
    impact: "Hot read path",
    fix: "CREATE INDEX subscriptions_user_id_idx ON subscriptions (user_id);",
  },
  {
    severity: "medium",
    title: "users.email_lower is unused",
    body: "Last query referenced 73 days ago. Drop or document.",
    impact: "Storage drift",
    fix: "ALTER TABLE users DROP COLUMN email_lower;",
  },
  {
    severity: "low",
    title: "Add ON DELETE CASCADE to messages.task_id",
    body: "Currently NO ACTION. Deletes would orphan messages.",
    impact: "Cleanup ergonomics",
    fix: "ALTER TABLE messages ADD CONSTRAINT … ON DELETE CASCADE;",
  },
];

const TONE: Record<string, string> = {
  high: "border-brick/40 bg-brick/10",
  medium: "border-mustard/40 bg-mustard/15",
  low: "border-line bg-paper",
};

export default function SuggestionsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
          <Lightbulb className="size-4 text-ink-muted" /> Suggestions
        </h1>
        <p className="text-sm text-ink-muted">
          Observations from the schema linter and query profiler. The Engineer
          agent can implement any of these.
        </p>
      </header>

      <ul className="space-y-2">
        {SUGGESTIONS.map((s, i) => (
          <li
            key={i}
            className={`rounded-lg border p-4 space-y-2 ${TONE[s.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xs uppercase tracking-wider text-ink-muted inline-flex items-center gap-1">
                  <AlertTriangle className="size-3" /> {s.severity} ·{" "}
                  {s.impact}
                </div>
                <h2 className="text-base font-medium tracking-tight mt-0.5">
                  {s.title}
                </h2>
              </div>
              <button className="text-xs rounded-md bg-ink text-paper px-2 py-1 shrink-0">
                Hand to Engineer
              </button>
            </div>
            <p className="text-sm text-ink">{s.body}</p>
            <pre className="text-xs font-mono text-ink bg-paper/70 rounded-md px-3 py-2">
              {s.fix}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
