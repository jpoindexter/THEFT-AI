"use client";

export type Vibe = {
  id: string;
  name: string;
  description: string;
  mood: string;
  palette: string[];
};

const VIBE_META: Record<string, { label: string; previewBg: string; textColor: string; preview: string; swatchShape: "square" | "circle" }> = {
  "editorial-calm":  { label: "EDITORIAL", previewBg: "#ffffff", textColor: "#1c1c1a", preview: "Aa",  swatchShape: "circle"  },
  "saturated-tech":  { label: "TECHNICAL", previewBg: "#0d0d0d", textColor: "#00ff88", preview: "{ }", swatchShape: "square"  },
  "soft-pop":        { label: "PLAYFUL",   previewBg: "linear-gradient(135deg,#ff6b9d,#ffb3c6)", textColor: "#ff1a6e", preview: "Aa", swatchShape: "circle" },
  "brutalist-grid":  { label: "UTILITY",   previewBg: "#ffffff", textColor: "#000000", preview: "AA",  swatchShape: "square"  },
  "pastel-utility":  { label: "FRIENDLY",  previewBg: "#e9d5ff", textColor: "#6d28d9", preview: "Aa",  swatchShape: "circle"  },
};

export const BUILTIN_VIBES: Vibe[] = [
  { id: "editorial-calm",  name: "Editorial calm",  description: "Serif heads · warm neutrals · lots of white space",  mood: "Serif heads · warm neutrals · lots of white space",  palette: ["#1c1c1a","#9a9a9a","#d4d4d0","#ffffff"] },
  { id: "saturated-tech",  name: "Saturated tech",  description: "Mono · neon accents · dark mode native",             mood: "Mono · neon accents · dark mode native",             palette: ["#00ff88","#4a9eff","#ffffff","#0d0d0d"] },
  { id: "soft-pop",        name: "Soft pop",         description: "Warm gradients · friendly sans · rounded everything", mood: "Warm gradients · friendly sans · rounded everything", palette: ["#ff6b9d","#ffb347","#ffffff","#ff8cc8"] },
  { id: "brutalist-grid",  name: "Brutalist grid",   description: "Heavy sans · sharp edges · grid-anchored layouts",   mood: "Heavy sans · sharp edges · grid-anchored layouts",   palette: ["#ff0000","#cccccc","#000000","#ffffff"] },
  { id: "pastel-utility",  name: "Pastel utility",   description: "Soft purples · clean sans · approachable + modern",  mood: "Soft purples · clean sans · approachable + modern",  palette: ["#818cf8","#f472b6","#34d399","#fb923c"] },
];

export function VibePickerPhase({ vibes, selected, onPick }: {
  vibes: Vibe[];
  selected: string | null;
  onPick: (v: Vibe) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl tracking-tight font-medium">
          Pick a <span className="text-[#5b8af5]">vibe</span> to start with.
        </h2>
        <p className="text-sm text-ink-muted mt-1.5 max-w-md mx-auto leading-relaxed">
          The design agent uses this as a starting point. You can iterate from there, and nothing is locked in.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {vibes.slice(0, 5).map((v) => (
          <VibeCard key={v.id} vibe={v} selected={selected === v.id} onPick={() => onPick(v)} />
        ))}
        <NoneCard onPick={() => onPick({ id: "custom", name: "Custom", description: "", mood: "", palette: [] })} />
      </div>
    </div>
  );
}

function VibeCard({ vibe, selected, onPick }: { vibe: Vibe; selected: boolean; onPick: () => void }) {
  const meta = VIBE_META[vibe.id];
  const isMono = vibe.id === "saturated-tech";
  const isBold = vibe.id === "brutalist-grid";

  return (
    <button onClick={onPick}
      className={`rounded-lg border text-left overflow-hidden transition-all ${
        selected ? "border-ink shadow-md ring-2 ring-ink/10" : "border-line/80 hover:border-line-strong hover:shadow-sm"
      }`}
    >
      <div className="relative p-4 h-24 flex items-end" style={{ background: meta?.previewBg ?? "#ffffff" }}>
        {meta?.label && (
          <span className="absolute top-2 right-2 text-[8px] uppercase tracking-widest opacity-40"
            style={{ color: meta.previewBg === "#0d0d0d" ? "#ffffff" : "#000000" }}>
            {meta.label}
          </span>
        )}
        <div className="flex items-end justify-between w-full">
          <span className={`text-2xl leading-none font-medium ${isMono ? "font-mono" : ""} ${isBold ? "font-black text-3xl" : ""}`}
            style={{ color: meta?.textColor ?? "#1c1c1a" }}>
            {meta?.preview ?? "Aa"}
          </span>
          <div className="flex gap-1 items-center">
            {vibe.palette.slice(0, 3).map((c, i) => (
              <span key={i}
                className={meta?.swatchShape === "circle" ? "size-2.5 rounded-full border border-black/10" : "size-2.5 rounded-sm border border-black/10"}
                style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 bg-paper">
        <div className="text-xs font-medium text-ink">{vibe.name}</div>
        <p className="text-[10px] text-ink-muted leading-snug mt-0.5">{vibe.mood || vibe.description}</p>
      </div>
    </button>
  );
}

function NoneCard({ onPick }: { onPick: () => void }) {
  return (
    <button onClick={onPick}
      className="rounded-lg border border-dashed border-line/80 bg-paper text-left overflow-hidden hover:border-line-strong transition-colors flex flex-col items-center justify-center gap-2 py-6">
      <div className="size-9 rounded-full border border-line/70 flex items-center justify-center">
        <span className="text-ink-muted text-lg leading-none">+</span>
      </div>
      <div className="text-xs font-medium text-ink">None of these</div>
      <p className="text-[10px] text-ink-muted text-center leading-snug px-3">
        Upload references and describe your own vibe
      </p>
    </button>
  );
}
