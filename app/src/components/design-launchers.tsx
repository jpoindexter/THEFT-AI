"use client";

import { PenLine, Layers, Presentation, Mail, Home, BarChart2, Copy, Settings } from "lucide-react";
import type { GeneratedKit } from "./brand-kit-flow";

type LauncherStatus = "locked" | "not_started" | "in_progress";

function StatusBadge({ status }: { status: LauncherStatus }) {
  if (status === "locked")
    return (
      <span className="inline-flex items-center rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-paper">
        LOCKED
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-canvas px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-ink-soft">
      NOT STARTED
    </span>
  );
}

function DesignMdCard({ kit }: { kit: GeneratedKit | null }) {
  const palette = kit?.palette ?? ["#1c1c1a", "#3a3a38", "#9a9a98", "#d4d4d2", "#e8c87a", "#ffffff"];
  const displayFont = kit?.display_font ?? "serif";
  const brandName = kit?.brand_name ?? "Brand";
  const tagline = kit?.tagline ?? "";

  return (
    <div className="rounded-lg border border-line bg-paper overflow-hidden flex flex-col">
      <div className="flex items-start justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded bg-ink/5 flex items-center justify-center">
            <PenLine className="size-3 text-ink-muted" />
          </div>
          <div>
            <div className="text-xs font-medium text-ink">DESIGN.md</div>
            <div className="text-[10px] text-ink-soft">Imported source · tokens · components</div>
          </div>
        </div>
        <StatusBadge status="locked" />
      </div>

      <div className="mx-3 rounded-md overflow-hidden" style={{ background: palette[0] }}>
        <div className="px-3 py-3">
          <div
            className="text-sm font-black text-white leading-tight"
            style={{ fontFamily: displayFont }}
          >
            {brandName}
          </div>
          {tagline && (
            <div
              className="text-[10px] text-white/50 mt-0.5 leading-tight italic"
              style={{ fontFamily: displayFont }}
            >
              {tagline}
            </div>
          )}
          <div className="flex gap-1 mt-2.5">
            {palette.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="size-3.5 rounded-sm border border-white/10"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 pt-2 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-ink-muted leading-relaxed">
          Your imported design system is the source of truth.
        </p>
        <div className="flex gap-1.5 mt-auto">
          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-ink text-paper text-[10px] px-2.5 py-1.5 hover:opacity-90 transition-opacity">
            Review →
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-line text-ink-muted text-[10px] px-2.5 py-1.5 hover:border-line-strong transition-colors">
            Open
          </button>
        </div>
        <div className="text-[9px] text-ink-soft border-t border-line/40 pt-1.5">
          Imported · saved as DESIGN.md
        </div>
      </div>
    </div>
  );
}

function LogoCard() {
  return (
    <div className="rounded-lg border border-line bg-paper overflow-hidden flex flex-col">
      <div className="flex items-start justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded bg-ink/5 flex items-center justify-center">
            <Layers className="size-3 text-ink-muted" />
          </div>
          <div>
            <div className="text-xs font-medium text-ink">Logo</div>
            <div className="text-[10px] text-ink-soft">Wordmark or symbol · optional</div>
          </div>
        </div>
        <StatusBadge status="not_started" />
      </div>

      <div className="mx-3 rounded-md border border-line/60 bg-canvas h-16 flex items-center justify-center">
        <div className="size-8 rounded-full bg-gradient-to-br from-ink/10 to-ink/5 flex items-center justify-center border border-line/60">
          <div className="size-1.5 rounded-full bg-ink/30" />
        </div>
      </div>

      <div className="p-3 pt-2 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-ink-muted leading-relaxed">
          Generate a grid of logo options using the locked brand kit, or upload an existing logo.
        </p>
        <div className="flex gap-1.5 mt-auto">
          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-ink text-paper text-[10px] px-2.5 py-1.5 hover:opacity-90 transition-opacity">
            Generate logos →
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-line text-ink-muted text-[10px] px-2.5 py-1.5 hover:border-line-strong transition-colors">
            Upload existing
          </button>
        </div>
        <div className="text-[9px] text-ink-soft border-t border-line/40 pt-1.5">
          ~3 min · GPT-image · ~$0.05
        </div>
      </div>
    </div>
  );
}

function PitchDeckCard() {
  return (
    <div className="rounded-lg border border-line bg-paper overflow-hidden flex flex-col">
      <div className="flex items-start justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded bg-ink/5 flex items-center justify-center">
            <Presentation className="size-3 text-ink-muted" />
          </div>
          <div>
            <div className="text-xs font-medium text-ink">Pitch deck</div>
            <div className="text-[10px] text-ink-soft">12 slides · business plan + brand kit</div>
          </div>
        </div>
        <StatusBadge status="not_started" />
      </div>

      <div className="mx-3 rounded-md border border-line/60 bg-canvas h-16 flex items-center justify-center gap-1.5 px-3">
        {[0.9, 0.6, 0.75].map((opacity, i) => (
          <div
            key={i}
            className="flex-1 h-10 rounded border border-line/60 bg-paper flex flex-col gap-1 p-1.5"
            style={{ opacity }}
          >
            <div className="h-1 w-3/4 rounded-full bg-ink/20" />
            <div className="h-1 w-full rounded-full bg-ink/10" />
            <div className="h-1 w-2/3 rounded-full bg-ink/10" />
          </div>
        ))}
      </div>

      <div className="p-3 pt-2 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-ink-muted leading-relaxed">
          A 12-slide deck generated as images so it actually looks like a real deck.
        </p>
        <div className="flex gap-1.5 mt-auto">
          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-ink text-paper text-[10px] px-2.5 py-1.5 hover:opacity-90 transition-opacity">
            Build deck →
          </button>
        </div>
        <div className="text-[9px] text-ink-soft border-t border-line/40 pt-1.5">
          ~5 min · Claude + Gamma · ~$0.10
        </div>
      </div>
    </div>
  );
}

function EmailTemplatesCard() {
  return (
    <div className="rounded-lg border border-line bg-paper overflow-hidden flex flex-col">
      <div className="flex items-start justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded bg-ink/5 flex items-center justify-center">
            <Mail className="size-3 text-ink-muted" />
          </div>
          <div>
            <div className="text-xs font-medium text-ink">Email templates</div>
            <div className="text-[10px] text-ink-soft">Marketing · lifecycle · product</div>
          </div>
        </div>
        <StatusBadge status="not_started" />
      </div>

      <div className="mx-3 rounded-md border border-line/60 bg-canvas h-16 flex flex-col gap-1 p-2">
        <div className="h-2 w-1/3 rounded-full bg-ink/20" />
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <div className="h-1 w-full rounded-full bg-ink/10" />
          <div className="h-1 w-4/5 rounded-full bg-ink/10" />
          <div className="h-1 w-full rounded-full bg-ink/10" />
        </div>
        <div className="h-2.5 w-14 rounded bg-ink/15" />
      </div>

      <div className="p-3 pt-2 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-ink-muted leading-relaxed">
          Reusable branded email templates for the first campaigns.
        </p>
        <div className="flex gap-1.5 mt-auto">
          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-ink text-paper text-[10px] px-2.5 py-1.5 hover:opacity-90 transition-opacity">
            Create templates →
          </button>
        </div>
        <div className="text-[9px] text-ink-soft border-t border-line/40 pt-1.5">
          ~4 min · Claude · ~$0.03
        </div>
      </div>
    </div>
  );
}

export function DesignLaunchers({ kit }: { orgSlug: string; kit: GeneratedKit | null }) {
  return (
    <div className="rounded-xl border border-line bg-paper overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line/60">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-sm bg-ink/5 flex items-center justify-center">
            <PenLine className="size-2.5 text-ink-muted" />
          </div>
          <span className="text-sm font-medium text-ink">Design Department</span>
        </div>
        <div className="flex items-center gap-1">
          {[Home, BarChart2, Copy, Settings].map((Icon, i) => (
            <button
              key={i}
              className="size-6 rounded flex items-center justify-center text-ink-soft hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <Icon className="size-3" />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-line/60 flex items-center gap-2">
        <span className="text-xs text-ink-muted">Design launchers</span>
        <span className="inline-flex items-center rounded-full bg-ink/5 border border-line px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-ink-muted">
          DESIGN.MD LOCKED
        </span>
      </div>

      <div className="p-3 grid grid-cols-2 gap-3">
        <DesignMdCard kit={kit} />
        <LogoCard />
        <PitchDeckCard />
        <EmailTemplatesCard />
      </div>
    </div>
  );
}
