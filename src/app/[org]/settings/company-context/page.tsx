"use client";

import { useState } from "react";
import { Copy, Check, Upload } from "lucide-react";

const SOURCES = [
  { id: "chatgpt", label: "ChatGPT", note: "Memory + chats" },
  { id: "claude", label: "Claude", note: "Projects + memory" },
  { id: "openclaw", label: "OpenClaw", note: "Workspace memory" },
  { id: "paperclip", label: "Paperclip", note: "Notes + clips" },
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
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <h1 className="text-xl tracking-tight">Company Context</h1>
          <p className="text-[12px] text-stone-500">
            Import durable company knowledge from another AI tool. Run the
            prompt there, paste the report here, preview, then import to Company
            Memory.
          </p>
        </header>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
          <div className="text-[14px] font-medium tracking-tight">
            1. Pick the source
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {SOURCES.map((s) => {
              const on = source === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSource(s.id)}
                  className={`text-left rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
                    on
                      ? "border-stone-900 bg-stone-100"
                      : "border-stone-200 hover:border-stone-400"
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-[10px] text-stone-500">{s.note}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-medium tracking-tight">
              2. Copy this prompt into {SOURCES.find((s) => s.id === source)?.label}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed bg-stone-50 rounded-md p-3 max-h-64 overflow-y-auto text-stone-700">
            {PROMPT}
          </pre>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[14px] font-medium tracking-tight">
            3. Paste the report
          </div>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            rows={10}
            placeholder="Paste the Company Context Export here…"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-stone-400"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={!report.trim()}
              onClick={() => setPreviewing(true)}
              className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400 disabled:opacity-40"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={!previewing}
              className="inline-flex items-center gap-1 text-[12px] rounded-md bg-stone-900 text-white px-3 py-1.5 disabled:opacity-40"
            >
              <Upload className="size-3" /> Import to Company Memory
            </button>
          </div>
        </section>

        {previewing && (
          <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
            <div className="text-[14px] font-medium tracking-tight">
              Preview
            </div>
            <p className="text-[11px] text-stone-500">
              Items extracted. Uncheck anything you don&apos;t want imported.
            </p>
            <ul className="space-y-1 text-[12px]">
              {parseItems(report).map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-stone-200/70 px-2 py-1.5"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1"
                  />
                  <span className="font-mono text-[11px] text-stone-700">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function parseItems(report: string): string[] {
  const lines = report.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.filter((l) => l.startsWith("-") || l.startsWith("•")).slice(0, 30);
}
