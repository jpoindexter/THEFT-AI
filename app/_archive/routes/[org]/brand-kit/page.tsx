import { notFound } from "next/navigation";
import Link from "next/link";
import { ImageIcon, Sparkles } from "lucide-react";
import { db } from "@/lib/db/store";

type BrandKit = {
  brand_name?: string;
  tagline?: string;
  mission_line?: string;
  palette?: string[];
  display_font?: string;
  body_font?: string;
  mono_font?: string;
  voice_keywords?: string[];
  industry?: string;
  mockups?: { label: string; description: string }[];
};

export const dynamic = "force-dynamic";

export default async function BrandKitPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();

  const artifacts = await db.listArtifacts(organization.id);
  const kitArtifacts = artifacts
    .filter((a) => a.kind === "brand_kit")
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const latestContent = kitArtifacts[0]?.content;
  const latestKit: BrandKit | null = latestContent ? safeParseKit(latestContent) : null;

  if (!latestKit) return <EmptyState orgSlug={orgSlug} />;

  const palette = (latestKit.palette ?? []).slice(0, 6);
  const displayFont = latestKit.display_font ?? "Inter";
  const bodyFont = latestKit.body_font ?? "Inter";
  const monoFont = latestKit.mono_font ?? "JetBrains Mono";
  const brandName = latestKit.brand_name ?? organization.name;
  const tagline = latestKit.tagline ?? "";
  const mockups = (latestKit.mockups ?? []).slice(0, 3);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl bg-paper border border-line/80 overflow-hidden shadow-sm">
          {/* Board header */}
          <div className="px-4 py-2 border-b border-line/60 flex items-center justify-between">
            <span className="text-2xs uppercase tracking-widest text-ink-soft font-medium">
              Brand Identity Board
            </span>
            <span className="text-2xs text-ink-muted">{orgSlug}</span>
          </div>

          {/* Logo / Palette / Type strip */}
          <div className="grid grid-cols-3 divide-x divide-line/60">
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="size-8 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: palette[0] ?? "#1c1c1a" }}
                >
                  <span className="text-paper text-xs font-bold">
                    {brandName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div
                    className="text-sm font-medium text-ink leading-none truncate"
                    style={{ fontFamily: displayFont }}
                  >
                    {brandName}
                  </div>
                  <div className="text-2xs text-ink-muted mt-0.5 truncate">{tagline}</div>
                </div>
              </div>
              {latestKit.mission_line && (
                <p className="text-xs text-ink-muted leading-relaxed">
                  {latestKit.mission_line}
                </p>
              )}
            </div>

            <div className="p-5 space-y-2">
              <div className="text-2xs uppercase tracking-wider text-ink-soft">Palette</div>
              <div className="flex gap-1">
                {palette.map((c, i) => (
                  <div
                    key={`${c}-${i}`}
                    className="flex-1 h-8 rounded-sm border border-black/5"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
                {palette.map((c, i) => (
                  <div key={`${c}-${i}`} className="text-2xs text-ink-soft font-mono truncate">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-2xs uppercase tracking-wider text-ink-soft">Typography</div>
              <div className="text-sm text-ink truncate" style={{ fontFamily: displayFont }}>
                {displayFont}
              </div>
              <div className="text-2xs text-ink-muted truncate">{bodyFont}</div>
              <div
                className="text-5xl leading-none text-ink mt-1"
                style={{ fontFamily: displayFont }}
              >
                Ag
              </div>
            </div>
          </div>

          {/* Paper / Components strip */}
          <div className="grid grid-cols-2 divide-x divide-line/60 border-t border-line/60">
            <div className="p-4 space-y-2">
              <div className="text-2xs uppercase tracking-wider text-ink-soft">Paper / Canvas</div>
              <div className="flex gap-1.5">
                {palette.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="size-6 rounded-sm border border-black/5"
                    style={{ background: c }}
                  />
                ))}
                <div className="size-6 rounded-sm border border-line/70 bg-cream" />
                <div className="size-6 rounded-sm border border-line/70 bg-canvas" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-2xs uppercase tracking-wider text-ink-soft">Components</div>
              <div className="flex items-center gap-2">
                <div className="h-5 rounded-md border border-line/70 bg-canvas px-2 text-2xs text-ink-muted flex items-center">
                  Button
                </div>
                <div className="h-5 rounded-full border border-line/70 bg-cream px-2 text-2xs text-ink-muted flex items-center">
                  Pill
                </div>
                <div className="size-5 rounded-md border border-line/70 bg-paper flex items-center justify-center">
                  <div className="size-2 rounded-sm bg-ink-soft" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 mockup tiles */}
        {mockups.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {mockups.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="rounded-lg border border-line/70 bg-paper overflow-hidden"
              >
                <div
                  className="h-20 flex flex-col justify-end p-2 gap-1"
                  style={{ background: palette[i % palette.length] ?? "#1c1c1a" }}
                >
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
        )}

        {/* Voice keywords */}
        {latestKit.voice_keywords && latestKit.voice_keywords.length > 0 && (
          <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">Voice</div>
            <div className="flex flex-wrap gap-1.5">
              {latestKit.voice_keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs rounded-full border border-line/70 bg-canvas px-2.5 py-0.5 text-ink"
                >
                  {kw}
                </span>
              ))}
            </div>
            <div className="text-2xs text-ink-soft pt-1">
              Mono · <span className="font-mono">{monoFont}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Link
            href={`/${orgSlug}/library?kind=brand_kit`}
            className="text-2xs text-ink-muted hover:text-ink"
          >
            Open in library →
          </Link>
          <Link
            href={`/${orgSlug}/design`}
            className="text-2xs text-ink-muted hover:text-ink"
          >
            Refine in Design →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ orgSlug }: { orgSlug: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <div className="inline-flex size-10 rounded-md bg-canvas border border-line/70 items-center justify-center">
          <Sparkles className="size-5 text-ink-muted" />
        </div>
        <h2 className="text-lg font-medium text-ink">No brand kit yet</h2>
        <p className="text-sm text-ink-muted">
          Run the brand kit flow from the Design department to generate one.
        </p>
        <Link
          href={`/${orgSlug}/design`}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink text-paper px-3 py-1.5 text-sm hover:opacity-90"
        >
          <ImageIcon className="size-3.5" />
          Open Design
        </Link>
      </div>
    </div>
  );
}

function safeParseKit(content: string): BrandKit | null {
  try {
    return JSON.parse(content) as BrandKit;
  } catch {
    return null;
  }
}
