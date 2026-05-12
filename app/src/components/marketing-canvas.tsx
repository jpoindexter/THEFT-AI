"use client";

import { useState } from "react";
import {
  Play,
  FileText,
  Clock,
  BarChart2,
  CalendarDays,
  LayoutGrid,
  Share2,
  Megaphone,
  X,
  Upload,
} from "lucide-react";
import MarketingStudio, { type ContentSlot } from "./marketing-studio-modal";

type ViewKey = "content" | "channels" | "calendar";
type ContentTab = "all" | "videos" | "images" | "tweets";

const SLOTS: ContentSlot[] = [
  { id: "ugc-video",      name: "UGC video",     kind: "video"      },
  { id: "image-draft",    name: "Image draft",   kind: "image"      },
  { id: "hyperframe",     name: "Hyperframe",    kind: "hyperframe" },
  { id: "tweet-draft",    name: "Tweet draft",   kind: "tweet"      },
  { id: "ugc-variant",    name: "UGC variant",   kind: "video"      },
  { id: "short-form-cut", name: "Short-form cut", kind: "video"     },
];

const CHANNEL_LIST = [
  "X / Twitter",
  "Instagram",
  "LinkedIn",
  "Facebook",
  "Threads",
];

function SlotIcon({ kind }: { kind: ContentSlot["kind"] }) {
  const cls = "size-6 text-ink-soft/40";
  if (kind === "video") return <Play className={cls} />;
  if (kind === "image") return <FileText className={cls} />;
  return <Clock className={cls} />;
}

function ContentView({
  tab,
  setTab,
  onOpenStudio,
  onScore,
}: {
  tab: ContentTab;
  setTab: (t: ContentTab) => void;
  onOpenStudio: (slot: ContentSlot) => void;
  onScore: () => void;
}) {
  const visible =
    tab === "videos" ? SLOTS.filter((s) => s.kind === "video") :
    tab === "images" ? SLOTS.filter((s) => s.kind === "image") :
    tab === "tweets" ? SLOTS.filter((s) => s.kind === "tweet") :
    SLOTS;

  const TABS: { key: ContentTab; label: string }[] = [
    { key: "all",    label: `ALL ${SLOTS.length}` },
    { key: "videos", label: "VIDEOS 0"  },
    { key: "images", label: "IMAGES 0"  },
    { key: "tweets", label: "TWEETS 0"  },
  ];

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-ink">Marketing</h2>
        <button
          type="button"
          onClick={onScore}
          className="flex items-center gap-1.5 text-xs rounded-lg border border-rose-200 bg-rose-50 text-rose-600 px-3 py-1.5 hover:bg-rose-100 transition-colors"
        >
          <BarChart2 className="size-3" />
          Score content
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        <span className="text-[10px] uppercase tracking-wider font-medium text-ink mr-2">
          Content
        </span>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              tab === t.key
                ? "bg-canvas border-line/70 text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto text-xs text-ink-muted hover:text-ink transition-colors"
        >
          + New
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {visible.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => onOpenStudio(slot)}
            className="group rounded-lg border border-dashed border-line/50 bg-canvas/40 p-4 flex flex-col items-center gap-2 hover:border-rose-300 hover:bg-rose-50/40 transition-colors"
          >
            <SlotIcon kind={slot.kind} />
            <div className="text-center">
              <div className="text-xs text-ink leading-snug">{slot.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-ink-soft mt-0.5">
                Open Studio
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-ink-muted">
        Click any draft or empty slot to brief the agent in the studio.
      </p>
    </div>
  );
}

function ChannelsView() {
  return (
    <div className="grid grid-cols-2 divide-x divide-line/40">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
            Channels
          </span>
          <button type="button" className="text-xs text-rose-500 hover:text-rose-600">
            Setup
          </button>
        </div>
        <div className="space-y-0 divide-y divide-line/30">
          {CHANNEL_LIST.map((ch) => (
            <div key={ch} className="flex items-center justify-between py-2">
              <span className="text-sm text-ink">{ch}</span>
              <button type="button" className="text-xs text-rose-500 hover:text-rose-600">
                Setup
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-line/30 flex items-center justify-between">
          <span className="text-xs text-ink-muted">Connect Postiz before adding channels</span>
          <button type="button" className="text-xs text-rose-500 hover:text-rose-600">
            Setup
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
            Signal Brief
          </span>
          <span className="text-[9px] border border-sage-ink/30 text-sage-ink rounded-full px-1.5 py-0.5">
            Live
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-soft font-medium mb-2">
            Trending right now
          </p>
          <p className="text-xs text-ink-muted leading-relaxed">
            No signals collected yet. Run a signal collection from the marketing agent.
          </p>
        </div>
      </div>
    </div>
  );
}

function CalendarView() {
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const weeks = [[4,5,6,7,8,9,10],[11,12,13,14,15,16,17]];

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
          Content Calendar
        </span>
        <span className="text-xs text-ink-muted">May 4 – May 17</span>
      </div>
      <div className="border border-line/50 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line/40">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] uppercase tracking-wider text-ink-soft py-2 border-r border-line/30 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className={`grid grid-cols-7 ${wi < weeks.length - 1 ? "border-b border-line/40" : ""}`}
          >
            {week.map((day) => (
              <div
                key={day}
                className={`min-h-[60px] border-r border-line/30 last:border-r-0 p-1.5 ${day === 8 ? "bg-rose-50/50" : ""}`}
              >
                <span className={`text-xs ${day === 8 ? "text-rose-500 font-medium" : "text-ink-muted"}`}>
                  {day}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-muted mt-3">
        Approved Postiz posts will appear on the day they are scheduled.
      </p>
    </div>
  );
}

function ScoreModal({ onClose }: { onClose: () => void }) {
  const [platform, setPlatform] = useState("X / Twitter");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-[420px] rounded-xl border border-line/70 bg-paper shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line/40">
          <span className="text-sm font-medium text-ink">Score content</span>
          <button
            type="button"
            onClick={onClose}
            className="size-6 flex items-center justify-center rounded text-ink-soft hover:text-ink hover:bg-canvas"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            Drop in something you have made, or paste text. The agent will score it for the platform you choose.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 text-sm rounded-lg border border-line/70 bg-canvas py-2.5 text-ink hover:border-line-strong transition-colors"
            >
              <Upload className="size-3.5" />
              Upload file
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 text-sm rounded-lg border border-line/70 bg-canvas py-2.5 text-ink hover:border-line-strong transition-colors"
            >
              Paste text
            </button>
          </div>
          <div className="rounded-lg border border-line/50 bg-canvas p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
              <Share2 className="size-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Attach the file in the task thread</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">
                This panel starts the scorer; file upload still happens through the agent message composer.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-ink-soft font-medium">
              Score for which platform?
            </p>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_LIST.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setPlatform(ch)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    platform === ch
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "bg-paper border-line/70 text-ink hover:border-line-strong"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              Different platforms reward different signals. Pick the one you plan to post to.
            </p>
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 text-sm rounded-lg bg-ink text-paper py-2.5 hover:opacity-90 transition-opacity"
          >
            <BarChart2 className="size-3.5" />
            Score this content
          </button>
          <p className="text-center text-xs text-ink-muted">
            Sends a scoring instruction to the active marketing agent.
          </p>
        </div>
      </div>
    </div>
  );
}

const TOOLBAR: { key: ViewKey | null; icon: React.ReactNode; label: string }[] = [
  { key: "content",  icon: <LayoutGrid className="size-3.5" />,   label: "Content"  },
  { key: "channels", icon: <BarChart2 className="size-3.5" />,    label: "Channels" },
  { key: null,       icon: <Share2 className="size-3.5" />,        label: "Share"    },
  { key: "calendar", icon: <CalendarDays className="size-3.5" />, label: "Calendar" },
];

export default function MarketingCanvas() {
  const [view, setView] = useState<ViewKey>("content");
  const [tab, setTab] = useState<ContentTab>("all");
  const [studio, setStudio] = useState<ContentSlot | null>(null);
  const [scoreOpen, setScoreOpen] = useState(false);

  if (studio) {
    return <MarketingStudio slot={studio} onClose={() => setStudio(null)} />;
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6">
        <div className="rounded-xl border border-rose-200/60 overflow-hidden bg-paper">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line/40">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-rose-50 border border-rose-200/60 flex items-center justify-center">
                <Megaphone className="size-3 text-rose-400" />
              </div>
              <span className="text-sm text-ink">Marketing Department</span>
            </div>
            <div className="flex items-center gap-0.5">
              {TOOLBAR.map((btn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => btn.key && setView(btn.key)}
                  aria-label={btn.label}
                  className={`size-7 rounded flex items-center justify-center transition-colors ${
                    btn.key && view === btn.key
                      ? "bg-canvas border border-line/70 text-ink"
                      : "text-ink-soft hover:text-ink hover:bg-canvas/60"
                  }`}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>

          {view === "content"  && (
            <ContentView
              tab={tab}
              setTab={setTab}
              onOpenStudio={setStudio}
              onScore={() => setScoreOpen(true)}
            />
          )}
          {view === "channels" && <ChannelsView />}
          {view === "calendar" && <CalendarView />}
        </div>
      </div>

      {scoreOpen && <ScoreModal onClose={() => setScoreOpen(false)} />}
    </div>
  );
}
