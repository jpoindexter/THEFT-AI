"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Copy, Upload, Check } from "lucide-react";
import { toast } from "@/components/toast-host";

const SOURCES = ["ChatGPT", "Claude", "Perplexity", "OpenAI", "Other"];

function sourcePrompt(source: string) {
  return `Use your memory, project context, and current conversation context.

Create a portable Company Context Export for ${source} based on durable facts only.

Include:
- company facts, product facts, customer facts
- decisions and rationale
- operating preferences and recurring workflows
- active goals, risks, unresolved questions

Exclude:
- personal/private unrelated details
- secrets, credentials, API keys
- long raw transcripts

Return plain text in a concise importable format.`;
}

export default function CompanyContextImport() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyPrompt(source: string) {
    await navigator.clipboard.writeText(sourcePrompt(source));
    setCopied(source);
    toast(`Copied ${source} prompt`, "ok");
    setTimeout(() => setCopied((s) => (s === source ? null : s)), 1400);
  }

  return (
    <Tabs defaultValue="chatgpt">
      <TabsList className="bg-cream">
        {SOURCES.map((s) => (
          <TabsTrigger key={s} value={s.toLowerCase()} className="text-sm">
            {s}
          </TabsTrigger>
        ))}
      </TabsList>
      {SOURCES.map((s) => (
        <TabsContent key={s} value={s.toLowerCase()} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wider text-ink-muted flex items-center justify-between gap-2">
                <span>Prompt to paste</span>
                <button
                  type="button"
                  onClick={() => void copyPrompt(s)}
                  className="inline-flex items-center gap-1 rounded border border-line/70 bg-paper px-2 py-0.5 normal-case tracking-normal text-[11px] hover:border-line-strong"
                >
                  {copied === s ? <Check className="size-3 text-sage-ink" /> : <Copy className="size-3" />}
                  {copied === s ? "Copied" : "Copy"}
                </button>
              </div>
              <Textarea
                readOnly
                value={sourcePrompt(s)}
                className="min-h-32 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wider text-ink-muted">
                Generated report
              </div>
              <Textarea
                placeholder="Paste the generated report from the source tool here…"
                className="min-h-32 text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled
                  title="Report preview is not implemented in local mode yet."
                  className="inline-flex items-center gap-1 text-sm rounded-md border border-line px-2 py-1 text-ink-muted opacity-60 cursor-not-allowed"
                >
                  <Upload className="size-3" />
                  Preview report (soon)
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
