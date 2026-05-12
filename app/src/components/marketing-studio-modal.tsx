"use client";

import { useState } from "react";
import { X, BarChart2 } from "lucide-react";

type ContentSlot = {
  id: string;
  name: string;
  kind: "video" | "image" | "tweet" | "hyperframe";
};

const BRAND_VOICE = ["Direct", "Founder-to-founder", "Playful", "Authoritative", "Witty"];
const CHANNELS = ["X / Twitter", "Instagram", "LinkedIn", "Facebook", "Threads"];

export default function MarketingStudio({
  slot,
  onClose,
}: {
  slot: ContentSlot;
  onClose: () => void;
}) {
  const [brief, setBrief] = useState("");
  const [voice, setVoice] = useState("Founder-to-founder");
  const [activeChannels, setActiveChannels] = useState<string[]>(["X / Twitter", "LinkedIn"]);
  const [schedule, setSchedule] = useState("");

  function toggleChannel(ch: string) {
    setActiveChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-paper overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-line/40 shrink-0">
        <div className="flex items-center gap-2 text-sm text-ink">
          <div className="size-2 rounded-full bg-rose-400" />
          <span className="font-medium">Marketing Studio</span>
          <span className="text-ink-soft">·</span>
          <span className="text-ink-soft">
            Video draft · {slot.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-6 flex items-center justify-center rounded text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
          aria-label="Close"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: preview */}
        <div className="w-2/5 border-r border-line/40 flex flex-col items-center justify-center p-8 gap-4 shrink-0">
          <div className="w-full max-w-[260px] aspect-video rounded-lg border border-line/60 bg-canvas flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="size-8 text-ink-soft/30" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-xs text-ink-soft mb-0.5">Empty slot</div>
            <div className="text-sm font-medium text-ink">{slot.name}</div>
            <div className="text-xs text-ink-muted mt-0.5 leading-snug">
              Preview updates when the artifact lands.
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
              Brief
            </div>
            <p className="text-xs text-ink-muted">
              Tell the agent what story this video should tell.
            </p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="What is this piece doing? Who is it for?"
              rows={4}
              className="w-full rounded-lg border border-line/70 bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 resize-none focus:outline-none focus:border-line-strong"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
              Brand Voice
            </div>
            <div className="flex flex-wrap gap-2">
              {BRAND_VOICE.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVoice(v)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    voice === v
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "bg-paper border-line/70 text-ink hover:border-line-strong"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
              Channels
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeChannels.includes(ch)
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "bg-paper border-line/70 text-ink hover:border-line-strong"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
              Schedule
            </div>
            <input
              type="date"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full rounded-lg border border-line/70 bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:border-line-strong"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-line/40 shrink-0">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <BarChart2 className="size-3" />
          Score this content
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-3 py-1.5 text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm rounded-lg bg-ink text-paper px-4 py-1.5 hover:opacity-90 transition-opacity"
          >
            Send to agent
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6h7M6.5 3l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ContentSlot };
