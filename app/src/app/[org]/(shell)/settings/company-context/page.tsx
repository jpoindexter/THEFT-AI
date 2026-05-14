"use client";

import { useState } from "react";
import { Copy, Check, Upload } from "lucide-react";
import { SectionHeader, SettingsCard } from "@/components/settings/section";

const SOURCES = [
  { id: "chatgpt", label: "ChatGPT", note: "Memory + chats" },
  { id: "claude", label: "Claude", note: "Projects + memory" },
  { id: "openclaw", label: "OpenClaw", note: "Workspace memory" },
  { id: "workspace_sync", label: "WorkspaceSync", note: "Notes + clips" },
  { id: "other", label: "Other", note: "Generic exporter" },
];

const PROMPT = `Use your saved memory and current conversation context.

Create a portable Company Context Export based on what you can find in the user's memory. Extract only durable information that would help understand the company later.

Include:
- company facts, product facts, customer facts, market facts
- important decisions and why they were made
- operating preferences and recurring workflows
- active projects, goals, and priorities
- known constraints, risks, and unresolved questions
- useful evidence notes, such as source title, date, object name, or short excerpt

Exclude:
- personal or unrelated content
- family, health, finance, relationship, hobby, or private life details
- secrets, passwords, API keys, tokens, private keys, credentials
- raw transcripts or long logs
- unsupported guesses

Return only plain text in the Company Context Export format.`;

export default function CompanyContextPage() {
  const [source, setSource] = useState("chatgpt");
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState("");
  const [previewing, setPreviewing] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <SectionHeader
        title="Company Context"
        description="Import durable company knowledge from another AI tool. Run the prompt there, paste the report here, preview, then import to Company Memory."
      />

      <SettingsCard title="1. Pick the Source">
          <div className="text-md font-medium tracking-tight">
            Source tool
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {SOURCES.map((s) => {
              const on = source === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSource(s.id)}
                  className={`text-left rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    on
                      ? "border-ink bg-cream"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-2xs text-ink-muted">{s.note}</div>
                </button>
              );
            })}
          </div>
      </SettingsCard>

      <SettingsCard title="2. Copy Prompt">
          <div className="flex items-center justify-between">
            <div className="text-md font-medium tracking-tight">
              2. Copy this prompt into {SOURCES.find((s) => s.id === source)?.label}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-sage-ink" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed bg-canvas rounded-md p-3 max-h-64 overflow-y-auto text-ink">
            {PROMPT}
          </pre>
      </SettingsCard>

      <SettingsCard title="3. Paste Report">
          <div className="text-md font-medium tracking-tight">
            3. Paste the report
          </div>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            rows={10}
            placeholder="Paste the Company Context Export here…"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm font-mono focus:outline-none focus:border-line-strong"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={!report.trim()}
              onClick={() => setPreviewing(true)}
              className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong disabled:opacity-40"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={!previewing}
              className="inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-40"
            >
              <Upload className="size-3" /> Import to Company Memory
            </button>
          </div>
      </SettingsCard>

      {previewing && (
          <SettingsCard title="Preview">
            <div className="text-md font-medium tracking-tight">
              Preview
            </div>
            <p className="text-xs text-ink-muted">
              Items extracted. Uncheck anything you don&apos;t want imported.
            </p>
            <ul className="space-y-1 text-sm">
              {parseItems(report).map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-line/70 px-2 py-1.5"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1"
                  />
                  <span className="font-mono text-xs text-ink">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </SettingsCard>
      )}
    </>
  );
}

function parseItems(report: string): string[] {
  const lines = report.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.filter((l) => l.startsWith("-") || l.startsWith("•")).slice(0, 30);
}
