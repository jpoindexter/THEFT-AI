"use client";

import { useEffect, useState } from "react";

type Stack = {
  github: { repo: string | null; status: "ready" | "missing" };
  vercel: { project: string | null; status: "ready" | "missing" };
  supabase: { project: string | null; status: "ready" | "missing" };
  postmark: { server: string | null; status: "ready" | "missing" };
};

export default function CompanyTab({
  organization,
}: {
  organization: { id: string; slug: string };
}) {
  const [stack, setStack] = useState<Stack | null>(null);
  const [memory, setMemory] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/${organization.slug}/company`)
      .then((r) => r.json())
      .then((j) => {
        setStack(j.stack);
        setMemory(j.memory ?? null);
      });
  }, [organization.slug]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[13px]">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-soft mb-2">
          Company memory
        </div>
        {memory ? (
          <div className="rounded-md border border-line/80 bg-paper p-3 text-[12px] text-ink leading-snug whitespace-pre-wrap">
            {memory}
          </div>
        ) : (
          <div className="rounded-md border border-line/80 bg-paper p-3 text-[12px] text-ink-muted">
            No memory imported. Bring durable context from another AI tool via Settings → Organization.
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-soft mb-2">
          Stack status
        </div>
        <div className="space-y-1">
          {stack &&
            (
              [
                ["GitHub", stack.github.repo, stack.github.status],
                ["Vercel", stack.vercel.project, stack.vercel.status],
                ["Supabase", stack.supabase.project, stack.supabase.status],
                ["Postmark", stack.postmark.server, stack.postmark.status],
              ] as const
            ).map(([label, value, status]) => (
              <div
                key={label}
                className="rounded-md border border-line/80 bg-paper px-3 py-1.5 flex items-center justify-between text-[12px]"
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] uppercase ${
                    status === "ready" ? "text-sage-ink" : "text-ink-muted"
                  }`}
                >
                  {value ?? status}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
