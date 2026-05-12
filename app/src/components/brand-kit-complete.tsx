"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import type { Vibe } from "./brand-kit-vibes";
import type { GeneratedKit } from "./brand-kit-flow";

export const ROADMAP_ITEMS = [
  { key: "brand-kit",   label: "Brand kit",        sub: "Choose vibe, set brand",    href: "brand-kit"         },
  { key: "design-logo", label: "Design logo",       sub: "Generate logo set",         href: "design/logo"       },
  { key: "pitch-deck",  label: "Create pitch deck", sub: "Business context sketch",   href: "design/pitch-deck" },
  { key: "components",  label: "Build components",  sub: "Gathering up styles",       href: "design/components" },
  { key: "refine",      label: "Refine brand",      sub: "Keep refining",             href: "brand-kit"         },
];

export function CompletePhase({ orgSlug, vibe, kit, feedback, onFeedbackChange, onLock, onRevibe }: {
  orgSlug: string; vibe: Vibe | null; kit: GeneratedKit | null; feedback: string;
  onFeedbackChange: (s: string) => void; onLock: () => void; onRevibe: () => void;
}) {
  const basePalette = kit?.palette ?? vibe?.palette ?? ["#1c1c1a","#f5f4f0","#e8c87a","#ffffff"];
  const paletteColors = [...basePalette, ...(basePalette.length < 5 ? ["#e8e6e1"] : []), ...(basePalette.length < 6 ? ["#1a1a1a"] : [])].slice(0, 6);
  const paperColors = paletteColors.slice(0, 3);
  const displayFont = kit?.display_font ?? "Playfair Display";
  const bodyFont = kit?.body_font ?? "Inter";
  const brandName = kit?.brand_name ?? orgSlug;
  const tagline = kit?.tagline ?? vibe?.mood ?? "Brand identity";
  const mockups = kit?.mockups ?? [
    { label: "Business card", description: "Card front" },
    { label: "Letterhead", description: "A4 sheet" },
    { label: "Social banner", description: "1200×630" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-paper border border-line/80 overflow-hidden">
        <div className="px-4 py-2 border-b border-line/60 flex items-center justify-between">
          <span className="text-2xs uppercase tracking-widest text-ink-soft font-medium">Brand Identity Board</span>
          <span className="text-2xs text-ink-muted">{orgSlug}</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line/60">
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-ink flex items-center justify-center shrink-0">
                <span className="text-paper text-xs font-bold">{orgSlug.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-ink leading-none truncate" style={{ fontFamily: displayFont }}>{brandName}</div>
                <div className="text-2xs text-ink-muted mt-0.5 truncate">{tagline}</div>
              </div>
            </div>
            <div className="space-y-1 mt-auto">
              <div className="h-1 w-full rounded-full bg-line" />
              <div className="h-1 w-4/5 rounded-full bg-line/60" />
              <div className="h-1 w-3/5 rounded-full bg-line/40" />
            </div>
          </div>
          <div className="p-5 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">Palette</div>
            <div className="flex gap-1">
              {paletteColors.map((c, i) => <div key={i} className="flex-1 h-8 rounded-sm border border-black/5" style={{ background: c }} />)}
            </div>
            <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
              {paletteColors.map((c, i) => <div key={i} className="text-2xs text-ink-soft font-mono truncate">{c}</div>)}
            </div>
          </div>
          <div className="p-5 space-y-1">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">Typography</div>
            <div className="text-sm text-ink truncate" style={{ fontFamily: displayFont }}>{displayFont}</div>
            <div className="text-2xs text-ink-muted truncate">{bodyFont}</div>
            <div className="text-5xl leading-none text-ink mt-1" style={{ fontFamily: displayFont }}>Ag</div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line/60 border-t border-line/60">
          <div className="p-4 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">Paper / Canvas</div>
            <div className="flex gap-1.5">
              {paperColors.map((c, i) => <div key={i} className="size-6 rounded-sm border border-black/5" style={{ background: c }} />)}
              <div className="size-6 rounded-sm border border-line/70 bg-cream" />
              <div className="size-6 rounded-sm border border-line/70 bg-canvas" />
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">Components</div>
            <div className="flex items-center gap-2">
              <div className="h-5 rounded-md border border-line/70 bg-canvas px-2 text-2xs text-ink-muted flex items-center">Button</div>
              <div className="h-5 rounded-full border border-line/70 bg-cream px-2 text-2xs text-ink-muted flex items-center">Pill</div>
              <div className="size-5 rounded-md border border-line/70 bg-paper flex items-center justify-center"><div className="size-2 rounded-sm bg-ink-soft" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {mockups.slice(0, 3).map((m, i) => (
          <div key={`${m.label}-${i}`} className="rounded-lg border border-line/70 bg-paper overflow-hidden">
            <div className="h-20 flex flex-col justify-end p-2 gap-1" style={{ background: paletteColors[i % paletteColors.length] ?? "#1c1c1a" }}>
              <div className="h-1 rounded-full bg-white/30 w-3/5" />
              <div className="h-1 rounded-full bg-white/20 w-2/5" />
              <div className="h-1 rounded-full bg-white/15 w-1/3" />
            </div>
            <div className="px-2.5 py-1.5">
              <div className="text-2xs font-medium text-ink truncate">{m.label}</div>
              <div className="text-2xs text-ink-muted truncate">{m.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line/80 bg-paper p-3 flex items-center gap-2">
        <input value={feedback} onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="What should change in the next version?"
          className="flex-1 text-sm text-ink placeholder:text-ink-soft bg-transparent focus:outline-none" />
        <button onClick={onRevibe} className="inline-flex items-center gap-1 text-xs rounded-md border border-line px-2.5 py-1.5 hover:border-line-strong text-ink-muted">Refine</button>
        <button onClick={onLock} className="text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90">Lock</button>
      </div>

      <div className="flex gap-2 pt-1">
        {ROADMAP_ITEMS.map((r, i) => (
          <div key={r.key}
            className={`rounded-md border px-2 py-1.5 text-left w-28 pointer-events-none ${i === 0 ? "border-line-strong bg-cream" : "border-line/60 opacity-50"}`}>
            <div className="text-2xs font-medium text-ink truncate">{r.label}</div>
            <div className="text-2xs text-ink-muted mt-0.5 truncate">{r.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LockedScreen({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") router.push(`/${orgSlug}/design`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [orgSlug, router]);

  return (
    <div
      className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center cursor-pointer"
      onClick={() => router.push(`/${orgSlug}/design`)}
    >
      <Confetti />
      <div className="relative z-10 rounded-xl border border-white/10 bg-white px-5 py-4 flex items-center gap-4 shadow-xl">
        <div className="size-10 rounded-md bg-cream border border-line/70 inline-flex items-center justify-center shrink-0">
          <PenLine className="size-5 text-paper" />
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
      <p className="relative z-10 text-white/40 text-xs mt-8">Brand kit locked. DESIGN.md is finalizing in the background.</p>
      <p className="relative z-10 text-white/20 text-2xs uppercase tracking-[0.2em] mt-3">Press Enter to continue</p>
    </div>
  );
}

function Confetti() {
  const pieces = [
    { x: 15, y: 55, color: "#e8c87a", size: 6, rotate: 45 }, { x: 28, y: 70, color: "#7ab4c8", size: 5, rotate: 20 },
    { x: 40, y: 62, color: "#e0907a", size: 7, rotate: 60 }, { x: 55, y: 72, color: "#9a7ac8", size: 5, rotate: 10 },
    { x: 65, y: 65, color: "#7ac87a", size: 6, rotate: 35 }, { x: 78, y: 58, color: "#e8c87a", size: 5, rotate: 80 },
    { x: 20, y: 80, color: "#7ab4c8", size: 4, rotate: 15 }, { x: 85, y: 75, color: "#e0907a", size: 6, rotate: 55 },
    { x: 10, y: 40, color: "#9a7ac8", size: 5, rotate: 70 }, { x: 90, y: 42, color: "#7ac87a", size: 4, rotate: 25 },
    { x: 48, y: 82, color: "#e8c87a", size: 7, rotate: 40 }, { x: 70, y: 85, color: "#7ab4c8", size: 5, rotate: 65 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <div key={i} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, transform: `rotate(${p.rotate}deg)`, borderRadius: 1 }} />
      ))}
    </div>
  );
}
