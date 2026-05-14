"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { VibePickerPhase, BUILTIN_VIBES, type Vibe } from "./brand-kit-vibes";
import { GeneratingPhase, type GenStep } from "./brand-kit-generating";
import { CompletePhase, LockedScreen, ROADMAP_ITEMS } from "./brand-kit-complete";

export type BrandKitPhase = "intro" | "vibes" | "generating" | "complete" | "locked";

export type GeneratedKit = {
  brand_name: string;
  tagline: string;
  mission_line: string;
  palette: string[];
  display_font: string;
  body_font: string;
  mono_font?: string;
  voice_keywords: string[];
  industry: string;
  mockups: { label: string; description: string }[];
};

export default function BrandKitFlow({
  orgSlug,
  vibes: loadedVibes,
  initialPhase = "intro",
  onPhaseChange,
  onSkipAll,
}: {
  orgSlug: string;
  vibes: Vibe[];
  initialPhase?: BrandKitPhase;
  onPhaseChange?: (p: BrandKitPhase) => void;
  onSkipAll?: () => void;
}) {
  const vibes = loadedVibes.length > 0 ? loadedVibes : BUILTIN_VIBES;
  const [phase, setPhase] = useState<BrandKitPhase>(initialPhase);
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [genStep, setGenStep] = useState<GenStep>("composing");
  const [feedback, setFeedback] = useState("");
  const [generatedKit, setGeneratedKit] = useState<GeneratedKit | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  function changePhase(p: BrandKitPhase) {
    setPhase(p);
    onPhaseChange?.(p);
  }

  async function pickVibe(v: Vibe) {
    setSelectedVibe(v);
    setGeneratedKit(null);
    setGenError(null);
    changePhase("generating");

    setGenStep("composing");
    const t1 = setTimeout(() => setGenStep("palette"), 25_000);
    const t2 = setTimeout(() => setGenStep("type"), 60_000);

    try {
      const res = await fetch(`/api/${orgSlug}/brand-kit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe_id: v.id,
          vibe_name: v.name,
          vibe_description: v.description || v.mood,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Generation failed: ${res.status} ${errText.slice(0, 120)}`);
      }
      const { kit } = (await res.json()) as { kit: GeneratedKit };
      setGeneratedKit(kit);
      changePhase("complete");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Brand kit generation failed");
      changePhase("vibes");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
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
              onChooseVibe={() => changePhase("vibes")}
              onSkip={() => {
                if (onSkipAll) onSkipAll();
                else changePhase("complete");
              }}
            />
          )}
          {phase === "vibes" && (
            <>
              {genError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  Couldn&apos;t generate kit: {genError}. Pick a vibe to retry.
                </div>
              )}
              <VibePickerPhase vibes={vibes} selected={selectedVibe?.id ?? null} onPick={pickVibe} />
            </>
          )}
          {phase === "generating" && selectedVibe && (
            <GeneratingPhase vibe={selectedVibe} step={genStep} kit={generatedKit} />
          )}
          {phase === "complete" && (
            <CompletePhase orgSlug={orgSlug} vibe={selectedVibe} kit={generatedKit} feedback={feedback}
              onFeedbackChange={setFeedback} onLock={() => changePhase("locked")} onRevibe={() => changePhase("vibes")} />
          )}
        </div>
      )}
    </div>
  );
}

function IntroPhase({ orgSlug, onChooseVibe, onSkip }: { orgSlug: string; onChooseVibe: () => void; onSkip: () => void }) {
  return (
    <div className="rounded-2xl bg-paper border border-line/80 p-12 flex flex-col items-center text-center gap-5">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-paper px-3 py-1 text-xs text-ink">
        <Sparkles className="size-3 text-mustard-ink" />
        Design agent ready
      </div>
      <h1 className="text-3xl tracking-tight max-w-2xl font-medium leading-tight">
        Let&apos;s build <span className="text-mustard-ink">your visual identity</span> from the ground up.
      </h1>
      <p className="text-base text-ink-muted max-w-md">
        First we&apos;ll create a brand kit for {orgSlug}. Then Design can move into logos, decks, components, and the rest of the workspace.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <button onClick={onChooseVibe} className="inline-flex items-center gap-1.5 rounded-md bg-ink text-paper px-4 py-2 text-base hover:opacity-90">
          Choose vibe <ChevronDown className="size-3.5" />
        </button>
        <button onClick={onSkip} className="rounded-md border border-line px-4 py-2 text-base hover:border-line-strong">
          Skip setup
        </button>
      </div>
      <div className="flex gap-2 pt-2">
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
