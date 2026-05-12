"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Plus, ChevronDown } from "lucide-react";

type Vibe = {
  id: string;
  name: string;
  description: string;
  mood: string;
  palette: string[];
};

const BUILTIN_VIBES: Vibe[] = [
  {
    id: "editorial-calm",
    name: "Editorial calm",
    description: "Soft prose · warm medium · lots of white space",
    mood: "Soft prose · warm medium · lots of white space",
    palette: ["#1c1c1a", "#f5f4f0", "#e8c87a", "#ffffff"],
  },
  {
    id: "saturated-tech",
    name: "Saturated tech",
    description: "Mono · neon accent · dark mode native",
    mood: "Mono · neon accent · dark mode native",
    palette: ["#0d0d0d", "#1a1a2e", "#00ff88", "#4a9eff"],
  },
  {
    id: "soft-pop",
    name: "Soft pop",
    description: "Soft gradients · friendly type · rounded everything",
    mood: "Soft gradients · friendly type · rounded everything",
    palette: ["#ff6b9d", "#ffb3c6", "#ff8cc8", "#ffd6e8"],
  },
  {
    id: "brutalist-grid",
    name: "Brutalist grid",
    description: "Heavy serif · thick edges · grid-anchored layouts",
    mood: "Heavy serif · thick edges · grid-anchored layouts",
    palette: ["#000000", "#ffffff", "#ff0000", "#f0f0f0"],
  },
  {
    id: "pastel-utility",
    name: "Pastel utility",
    description: "Soft pastels · clean sans · approachable + modern",
    mood: "Soft pastels · clean sans · approachable + modern",
    palette: ["#c4b5fd", "#e9d5ff", "#f3e8ff", "#1a1a2e"],
  },
];

const ROADMAP_ITEMS = [
  { key: "brand-kit",   label: "Brand kit",        sub: "Choose vibe, set brand",    href: "brand-kit"          },
  { key: "design-logo", label: "Design logo",       sub: "Generate logo set",         href: "design/logo"        },
  { key: "pitch-deck",  label: "Create pitch deck", sub: "Business context sketch",   href: "design/pitch-deck"  },
  { key: "components",  label: "Build components",  sub: "Gathering up styles",       href: "design/components"  },
  { key: "refine",      label: "Refine brand",      sub: "Keep refining",             href: "brand-kit"          },
];

type Phase = "intro" | "vibes" | "generating" | "complete" | "locked";
type GenStep = "composing" | "palette" | "type";

export default function BrandKitFlow({
  orgSlug,
  vibes: loadedVibes,
}: {
  orgSlug: string;
  vibes: Vibe[];
}) {
  const vibes = loadedVibes.length > 0 ? loadedVibes : BUILTIN_VIBES;
  const [phase, setPhase] = useState<Phase>("intro");
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [genStep, setGenStep] = useState<GenStep>("composing");
  const [feedback, setFeedback] = useState("");

  function pickVibe(v: Vibe) {
    setSelectedVibe(v);
    setPhase("generating");
    setGenStep("composing");
    setTimeout(() => setGenStep("palette"), 900);
    setTimeout(() => setGenStep("type"), 1800);
    setTimeout(() => setPhase("complete"), 2800);
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#f5f4f0]">
      {phase === "locked" ? (
        <LockedScreen orgSlug={orgSlug} />
      ) : (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
          {phase === "intro" && (
            <IntroPhase
              orgSlug={orgSlug}
              onChooseVibe={() => setPhase("vibes")}
              onSkip={() => setPhase("complete")}
            />
          )}
          {phase === "vibes" && (
            <VibePickerPhase vibes={vibes} onPick={pickVibe} />
          )}
          {phase === "generating" && selectedVibe && (
            <GeneratingPhase vibe={selectedVibe} step={genStep} />
          )}
          {phase === "complete" && (
            <CompletePhase
              orgSlug={orgSlug}
              vibe={selectedVibe}
              feedback={feedback}
              onFeedbackChange={setFeedback}
              onLock={() => setPhase("locked")}
              onRevibe={() => setPhase("vibes")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function IntroPhase({
  orgSlug,
  onChooseVibe,
  onSkip,
}: {
  orgSlug: string;
  onChooseVibe: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-2xl bg-paper border border-line/80 p-12 flex flex-col items-center text-center gap-5">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-paper px-3 py-1 text-xs text-ink">
        <Sparkles className="size-3 text-mustard-ink" />
        Design agent ready
      </div>
      <h1 className="text-3xl tracking-tight max-w-2xl font-medium leading-tight">
        Let&apos;s build{" "}
        <span className="text-mustard-ink">your visual identity</span> from the
        ground up.
      </h1>
      <p className="text-base text-ink-muted max-w-md">
        First we&apos;ll create a brand kit for {orgSlug}. Then Design can move
        into logos, decks, components, and the rest of the workspace.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={onChooseVibe}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink text-paper px-4 py-2 text-base hover:opacity-90"
        >
          Choose vibe
          <ChevronDown className="size-3.5" />
        </button>
        <button
          onClick={onSkip}
          className="rounded-md border border-line px-4 py-2 text-base hover:border-line-strong"
        >
          Skip setup
        </button>
      </div>
      <div className="flex gap-2 pt-2">
        {ROADMAP_ITEMS.map((r, i) => (
          <Link
            key={r.key}
            href={i === 0 ? "#" : `/${orgSlug}/${r.href}`}
            className={`rounded-md border px-2 py-1.5 text-left w-28 transition-colors ${
              i === 0
                ? "border-line-strong bg-cream pointer-events-none"
                : "border-line/60 opacity-60 hover:opacity-100 hover:border-line-strong"
            }`}
          >
            <div className="text-2xs font-medium text-ink truncate">
              {r.label}
            </div>
            <div className="text-2xs text-ink-muted mt-0.5 truncate">
              {r.sub}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function VibePickerPhase({
  vibes,
  onPick,
}: {
  vibes: Vibe[];
  onPick: (v: Vibe) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl tracking-tight font-medium">
          Pick a <span className="text-mustard-ink">vibe</span> to start with.
        </h2>
        <p className="text-base text-ink-muted mt-1 max-w-md mx-auto">
          The design agent uses this as a starting point. You can iterate from
          there, and nothing is locked in.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {vibes.slice(0, 5).map((v) => (
          <VibeCard key={v.id} vibe={v} onPick={() => onPick(v)} />
        ))}
        <button
          onClick={() => onPick({ id: "custom", name: "Custom", description: "", mood: "", palette: [] })}
          className="rounded-lg border border-line/80 bg-paper p-4 text-left hover:border-line-strong transition-colors flex flex-col items-center justify-center gap-2 aspect-[4/3]"
        >
          <div className="size-10 rounded-full border border-line/80 inline-flex items-center justify-center">
            <Plus className="size-4 text-ink-muted" />
          </div>
          <div className="text-sm font-medium text-ink">None of these</div>
          <p className="text-xs text-ink-muted text-center leading-snug">
            Upload reference and describe your own vibe
          </p>
        </button>
      </div>
    </div>
  );
}

function VibeCard({ vibe, onPick }: { vibe: Vibe; onPick: () => void }) {
  const isDark = vibe.id === "saturated-tech" || vibe.id === "brutalist-grid";
  const isSerif = vibe.id === "editorial-calm" || vibe.id === "brutalist-grid";
  return (
    <button
      onClick={onPick}
      className="rounded-lg border border-line/80 bg-paper hover:border-line-strong transition-colors text-left overflow-hidden"
    >
      <div
        className={`p-4 flex flex-col gap-2 ${
          isDark ? "bg-[#0d0d0d]" : "bg-paper"
        }`}
      >
        <div className="flex items-end justify-between">
          <span
            className={`text-3xl font-medium leading-none ${
              isDark ? "text-white" : "text-ink"
            } ${isSerif ? "font-serif" : ""}`}
          >
            Aa
          </span>
          <div className="flex gap-1">
            {vibe.palette.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="size-3 rounded-sm border border-black/10"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="text-sm font-medium text-ink">{vibe.name}</div>
        <p className="text-xs text-ink-muted leading-snug mt-0.5">
          {vibe.mood || vibe.description}
        </p>
      </div>
    </button>
  );
}

const GEN_STEPS: { key: GenStep; label: string }[] = [
  { key: "composing", label: "Composing board" },
  { key: "palette",   label: "Balancing palette" },
  { key: "type",      label: "Setting type" },
];

function GeneratingPhase({
  vibe: _vibe,
  step,
}: {
  vibe: Vibe;
  step: GenStep;
}) {
  const activeIdx = GEN_STEPS.findIndex((s) => s.key === step);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full rounded-2xl border border-line/80 bg-paper overflow-hidden aspect-[16/9] relative">
        <BrandKitMockup />
      </div>
      <div className="text-center space-y-1">
        <h1 className="text-2xl tracking-tight font-medium">
          Painting your{" "}
          <span className="text-mustard-ink">brand kit</span>…
        </h1>
        <p className="text-base text-ink-muted max-w-sm mx-auto">
          The agent is mixing colors, choosing type, and laying out a single
          board you can react to. About 2 minutes.
        </p>
      </div>
      <div className="w-48 h-0.5 bg-line/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-mustard transition-all duration-700 rounded-full"
          style={{ width: `${((activeIdx + 1) / GEN_STEPS.length) * 100}%` }}
        />
      </div>
      <div className="flex gap-2 text-2xs uppercase tracking-[0.12em]">
        {GEN_STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`rounded-md border px-2 py-1 ${
              i === activeIdx
                ? "border-line-strong bg-cream text-ink-muted"
                : i < activeIdx
                ? "border-sage/60 text-sage-ink"
                : "border-line/60 text-ink-soft"
            }`}
          >
            {i < activeIdx && "✓ "}{s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function BrandKitMockup() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 divide-x divide-line/60">
      <div className="p-5 flex flex-col gap-3">
        <div className="size-10 rounded-md bg-ink flex-shrink-0" />
        <div className="space-y-1">
          <div className="h-4 w-24 rounded bg-cream" />
          <div className="h-3 w-32 rounded bg-cream" />
          <div className="h-3 w-20 rounded bg-cream" />
        </div>
        <div className="mt-auto space-y-1">
          <div className="h-2 w-full rounded bg-cream" />
          <div className="h-2 w-4/5 rounded bg-cream" />
          <div className="h-2 w-3/5 rounded bg-cream" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="text-2xs uppercase tracking-wider text-ink-soft">Palette</div>
        <div className="grid grid-cols-2 gap-1.5">
          {["#1c1c1a","#f5f4f0","#e8c87a","#d4c0a0","#8a7a60","#4a3a28"].map((c) => (
            <div key={c} className="aspect-square rounded-sm" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="text-2xs uppercase tracking-wider text-ink-soft">Typography</div>
        <div className="text-lg font-serif">Playfair Display</div>
        <div className="text-6xl font-serif leading-none text-ink">Ag</div>
        <div className="text-2xl font-serif text-ink-muted">Ag</div>
      </div>
    </div>
  );
}

function CompletePhase({
  orgSlug,
  vibe,
  feedback,
  onFeedbackChange,
  onLock,
  onRevibe,
}: {
  orgSlug: string;
  vibe: Vibe | null;
  feedback: string;
  onFeedbackChange: (s: string) => void;
  onLock: () => void;
  onRevibe: () => void;
}) {
  return (
    <div className="rounded-2xl bg-paper border border-line/80 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-line/60">
        <div className="p-6 flex flex-col gap-3">
          <div className="size-10 rounded-md bg-ink" />
          <div>
            <h2 className="text-xl tracking-tight font-medium">{orgSlug}</h2>
            <p className="text-xs text-ink-muted mt-1 leading-snug">
              {vibe?.mood ?? "Brand kit ready."}
            </p>
          </div>
          <div className="mt-auto space-y-1">
            <div className="h-1.5 w-full rounded-full bg-line" />
            <div className="h-1.5 w-4/5 rounded-full bg-line/60" />
            <div className="h-1.5 w-3/5 rounded-full bg-line/40" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Palette
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(vibe?.palette ?? ["#1c1c1a", "#f5f4f0", "#e8c87a", "#ffffff"]).map(
              (c, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm border border-black/5"
                  style={{ background: c }}
                />
              ),
            )}
          </div>
        </div>
        <div className="p-6 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Typography
          </div>
          <div className="text-base font-serif">Playfair Display</div>
          <div className="text-xs text-ink-muted">Inter · 16/24</div>
          <div className="text-6xl font-serif leading-none">Ag</div>
        </div>
      </div>
      <div className="border-t border-line/80 p-3 flex items-center gap-2">
        <input
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="What should change in the next version?"
          className="flex-1 text-sm text-ink placeholder:text-ink-soft bg-transparent focus:outline-none"
        />
        <button
          onClick={onRevibe}
          className="inline-flex items-center gap-1 text-xs rounded-md border border-line px-2.5 py-1.5 hover:border-line-strong text-ink-muted"
        >
          Refine
        </button>
        <button
          onClick={onLock}
          className="text-xs rounded-md bg-sage-ink text-white px-3 py-1.5 hover:opacity-90"
        >
          Live
        </button>
      </div>
    </div>
  );
}

function LockedScreen({ orgSlug: _orgSlug }: { orgSlug: string }) {
  return (
    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center">
      <Confetti />
      <div className="relative z-10 rounded-xl border border-white/10 bg-white px-5 py-4 flex items-center gap-4 shadow-xl">
        <div className="size-10 rounded-md bg-cream border border-line/70 inline-flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 16 16"
            className="size-5 text-ink"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M5 8l2 2 4-4" />
          </svg>
        </div>
        <div>
          <div className="text-base font-medium text-ink">Brand identity</div>
          <div className="text-xs text-ink-muted">Design Agent</div>
        </div>
        <div className="ml-2">
          <svg viewBox="0 0 20 20" className="size-5 text-[#34d399]" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <p className="relative z-10 text-white/40 text-xs mt-8">
        Brand kit locked. DESIGN.md is finalizing in the background.
      </p>
      <p className="relative z-10 text-white/20 text-2xs uppercase tracking-[0.2em] mt-3">
        Press Enter to continue
      </p>
    </div>
  );
}

function Confetti() {
  const pieces = [
    { x: 15, y: 55, color: "#e8c87a", size: 6, rotate: 45 },
    { x: 28, y: 70, color: "#7ab4c8", size: 5, rotate: 20 },
    { x: 40, y: 62, color: "#e0907a", size: 7, rotate: 60 },
    { x: 55, y: 72, color: "#9a7ac8", size: 5, rotate: 10 },
    { x: 65, y: 65, color: "#7ac87a", size: 6, rotate: 35 },
    { x: 78, y: 58, color: "#e8c87a", size: 5, rotate: 80 },
    { x: 20, y: 80, color: "#7ab4c8", size: 4, rotate: 15 },
    { x: 85, y: 75, color: "#e0907a", size: 6, rotate: 55 },
    { x: 10, y: 40, color: "#9a7ac8", size: 5, rotate: 70 },
    { x: 90, y: 42, color: "#7ac87a", size: 4, rotate: 25 },
    { x: 48, y: 82, color: "#e8c87a", size: 7, rotate: 40 },
    { x: 70, y: 85, color: "#7ab4c8", size: 5, rotate: 65 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}
