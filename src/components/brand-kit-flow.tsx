"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

type Vibe = {
  id: string;
  name: string;
  description: string;
  mood: string;
  palette: string[];
};

const ROADMAP = [
  { key: "brand-kit", label: "Brand kit" },
  { key: "design-logo", label: "Design logo" },
  { key: "create-pitch", label: "Create pitch deck" },
  { key: "build-comp", label: "Build components" },
  { key: "refine", label: "Refine" },
];

export default function BrandKitFlow({
  orgSlug,
  vibes,
}: {
  orgSlug: string;
  vibes: Vibe[];
}) {
  const [phase, setPhase] = useState<"intro" | "vibes" | "generating" | "done">("intro");
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#f5f4f0]">
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {phase === "intro" && (
          <div className="rounded-2xl bg-paper border border-line/80 p-12 text-center space-y-4">
            <div className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Sparkles className="size-3" /> Design agent ready
            </div>
            <h1 className="text-2xl tracking-tight">
              Let&apos;s build{" "}
              <span className="text-ink">your visual identity</span> from
              the ground up.
            </h1>
            <p className="text-base text-ink-muted max-w-md mx-auto">
              First we&apos;ll create a brand kit for {orgSlug}. Then Design can
              move into logos, decks, components, and the rest of the
              workspace.
            </p>
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPhase("vibes")}
                className="rounded-md bg-ink text-paper px-4 py-2 text-base"
              >
                Choose vibe →
              </button>
              <button
                onClick={() => setPhase("done")}
                className="rounded-md border border-line px-4 py-2 text-base hover:border-line-strong"
              >
                Skip setup
              </button>
            </div>
            <div className="flex justify-center gap-1.5 pt-4 text-2xs uppercase tracking-wider text-ink-soft">
              {ROADMAP.map((r, i) => (
                <span
                  key={r.key}
                  className={`rounded-md border px-2 py-1 ${i === 0 ? "border-line-strong text-ink-muted bg-cream" : "border-line/60"}`}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {phase === "vibes" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl tracking-tight">Pick a vibe</h2>
              <p className="text-base text-ink-muted">
                Each one comes with a curated palette, type, and personality.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {vibes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVibe(v);
                    setPhase("generating");
                    setTimeout(() => setPhase("done"), 2400);
                  }}
                  className="rounded-lg border border-line/80 bg-paper p-4 text-left hover:border-line-strong transition-colors"
                >
                  <div className="flex gap-1 mb-2">
                    {v.palette.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="size-5 rounded-sm border border-black/5"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="text-base font-medium leading-tight">
                    {v.name}
                  </div>
                  <p className="text-xs text-ink-muted leading-snug mt-1 line-clamp-3">
                    {v.mood || v.description}
                  </p>
                </button>
              ))}
            </div>
            {vibes.length === 0 && (
              <div className="rounded-md border border-line/80 bg-paper p-6 text-center text-sm text-ink-muted">
                No vibes loaded. Drop annotation templates into{" "}
                <code className="text-2xs">/skills/web-design-guidelines/annotation-templates/</code>
                .
              </div>
            )}
          </div>
        )}

        {phase === "generating" && selectedVibe && (
          <div className="rounded-2xl bg-paper border border-line/80 p-12 text-center space-y-4">
            <div className="size-12 mx-auto rounded-full  bg-mustard/40 animate-pulse" />
            <h1 className="text-xl tracking-tight">
              Painting your <span className="text-ink">brand kit</span>…
            </h1>
            <p className="text-sm text-ink-muted">
              The agent is mixing colors, choosing type, and laying out a single
              board you can react to. About 2 minutes.
            </p>
            <div className="flex justify-center gap-2 text-2xs uppercase tracking-wider text-ink-soft pt-2">
              <span className="rounded-md border border-line/60 px-2 py-1">
                Composing board
              </span>
              <span className="rounded-md border border-line/60 px-2 py-1">
                Balancing palette
              </span>
              <span className="rounded-md border border-line/60 px-2 py-1 bg-cream text-ink-muted">
                Setting type
              </span>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="rounded-2xl bg-paper border border-line/80 overflow-hidden">
            <div className="grid grid-cols-3 gap-px bg-cream">
              <div className="bg-paper p-6">
                <div className="size-8 rounded-md bg-ink" />
                <h2 className="text-2xl tracking-tight mt-4 leading-tight">
                  {orgSlug}
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  {selectedVibe?.mood ?? "Brand kit ready."}
                </p>
              </div>
              <div className="bg-paper p-6 space-y-1">
                <div className="text-2xs uppercase tracking-wider text-ink-soft">
                  Palette
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(selectedVibe?.palette ?? ["#1c1c1e", "#e4e3e0", "#ff9500", "#ffffff"]).map(
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
              <div className="bg-paper p-6">
                <div className="text-2xs uppercase tracking-wider text-ink-soft">
                  Typography
                </div>
                <div className="text-3xl font-serif mt-1">Playfair Display</div>
                <div className="text-xs text-ink-muted">Inter · 16/24</div>
                <div className="mt-2 text-7xl tracking-tight font-serif leading-none">
                  Ag
                </div>
              </div>
            </div>
            <div className="border-t border-line/80 p-3 flex items-center justify-between">
              <button
                onClick={() => setPhase("vibes")}
                className="text-sm text-ink-muted hover:text-ink"
              >
                ← Pick a different vibe
              </button>
              <button className="text-sm rounded-md bg-ink text-paper px-3 py-1.5">
                Lock brand kit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
