"use client";

import type { Vibe } from "./brand-kit-vibes";
import type { GeneratedKit } from "./brand-kit-flow";

export type GenStep = "composing" | "palette" | "type";

const GEN_STEPS: { key: GenStep; label: string; icon: string }[] = [
  { key: "composing", label: "COMPOSING BOARD",   icon: "●" },
  { key: "palette",   label: "BALANCING PALETTE", icon: "∷" },
  { key: "type",      label: "SETTING TYPE",      icon: "" },
];

export function GeneratingPhase({ vibe, step, kit }: { vibe: Vibe; step: GenStep; kit: GeneratedKit | null }) {
  const activeIdx = GEN_STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full rounded-xl border border-line/60 overflow-hidden shadow-md">
        <BrandKitMockup vibe={vibe} kit={kit} />
      </div>
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl tracking-tight font-medium">
          Painting your{" "}
          <span className="text-[#5b8af5]">brand kit</span>…
        </h1>
        <p className="text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
          The agent is mixing colors, choosing type, and laying out a single board you can react to. About 2 minutes.
        </p>
      </div>
      <div className="w-56 h-1 bg-line/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-700 rounded-full"
          style={{ width: `${((activeIdx + 1) / GEN_STEPS.length) * 100}%` }}
        />
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {GEN_STEPS.map((s, i) => {
          const isPast = i < activeIdx;
          const isCurrent = i === activeIdx;
          return (
            <span key={s.key}
              className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-medium px-3 py-1.5 rounded-full transition-colors ${
                isCurrent ? "bg-[#1a1a2e] text-white" :
                isPast    ? "bg-[#1a1a2e]/70 text-white/60" :
                            "bg-line/30 text-ink-soft"
              }`}
            >
              {s.icon && <span className="text-[8px]">{s.icon}</span>}
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function BrandKitMockup({ vibe, kit }: { vibe: Vibe; kit: GeneratedKit | null }) {
  const isDarkVibe = vibe.id === "saturated-tech" || vibe.id === "brutalist-grid";
  const boardBg = isDarkVibe ? "#0a0a0f" : "#1a1a1a";
  const swatches = kit?.palette ?? (vibe.palette.length > 0 ? vibe.palette : ["#5f5f5f", "#8b5cf6", "#22c55e", "#06b6d4"]);
  const brandName = kit?.brand_name ?? "Loading…";

  return (
    <div className="relative" style={{ background: boardBg }}>
      {/* Board header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-white/40 uppercase tracking-widest">BRAND IDENTITY BOARD</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] text-white/30 uppercase tracking-widest">PALETTE</span>
          <span className="text-[8px] text-white/30">P.1</span>
        </div>
      </div>

      {/* Main board content */}
      <div className="grid grid-cols-3 divide-x divide-white/10 min-h-[140px]">
        {/* Logo / wordmark */}
        <div className="p-4 flex flex-col gap-2">
          <div className="text-white text-xl font-black tracking-tight leading-none mt-1 truncate">
            {brandName}
          </div>
          <div className="space-y-1 mt-2">
            <div className="h-1 w-16 rounded-full bg-white/20" />
            <div className="h-1 w-10 rounded-full bg-white/10" />
          </div>
          <div className="mt-auto space-y-1">
            <div className="h-1 w-full rounded-full bg-white/10" />
            <div className="h-1 w-4/5 rounded-full bg-white/10" />
            <div className="h-1 w-3/5 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Palette swatches */}
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {swatches.slice(0, 4).map((c, i) => (
              <div key={i} className="h-7 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <div className="flex gap-1">
            {swatches.slice(0, 4).map((c, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-sm" style={{ background: c, opacity: 0.5 }} />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="p-4 space-y-1.5">
          <div className="text-white text-xs font-medium tracking-[0.2em] truncate">{kit?.display_font ?? "Display"}</div>
          <div className="text-white/70 text-xs truncate">{kit?.body_font ?? "Body"}</div>
          <div className="text-white/50 text-[10px] font-mono truncate">{kit?.mono_font ?? "Mono"}</div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="grid grid-cols-6 gap-px border-t border-white/10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 flex items-center justify-center">
            <div className="size-4 rounded-sm bg-white/10" />
          </div>
        ))}
      </div>

      {/* ITERATING badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-indigo-600/90 text-white font-medium">
          <span className="size-1.5 rounded-full bg-white/70 animate-pulse" />
          ITERATING
        </span>
      </div>
    </div>
  );
}
