import { Card, CardBody, Eyebrow, Hint, PageTitle, Pill } from "@/components/ui/primitives";
import { Palette, Type, MessageSquareQuote, Image as ImageIcon, Download } from "lucide-react";
import Link from "next/link";

const PALETTE = [
  { name: "Cream", hex: "#F5EFE0", role: "Background" },
  { name: "Paper", hex: "#FBF6E8", role: "Card" },
  { name: "Ink", hex: "#1F1B16", role: "Text" },
  { name: "Sage", hex: "#A8C19A", role: "Positive" },
  { name: "Mustard", hex: "#D9A441", role: "Notice" },
  { name: "Brick", hex: "#9B3F2C", role: "Caution" },
];

const TYPE = [
  { name: "Inter", role: "UI / body", weight: "400 / 500" },
  { name: "JetBrains Mono", role: "Code / IDs", weight: "400" },
];

const VOICE_DOS = [
  "Specific over abstract — name the metric, the path, the buyer.",
  "Active over passive — `you shipped` not `it was shipped`.",
  "Short over fluffy — cut filler, then cut it again.",
];

const VOICE_DONTS = [
  "No `we built X to help you`. State X.",
  "No `unlock` / `seamless` / `delightful`.",
  "No exclamation marks. They cheapen real news.",
];

const ASSETS = [
  { name: "Wordmark", file: "theft-wordmark.svg", size: "8KB" },
  { name: "Logomark", file: "theft-mark.svg", size: "3KB" },
  { name: "Wordmark · dark", file: "theft-wordmark-dark.svg", size: "8KB" },
  { name: "Favicon · 32px", file: "favicon-32.png", size: "1.2KB" },
];

export default async function BrandKitPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <Palette className="size-5 text-ink-muted" /> Brand Kit
          </PageTitle>
          <Hint>
            What every agent and human should pull from when they touch this
            brand. Edit once, propagate everywhere.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>Palette</Eyebrow>
            <ul className="grid grid-cols-3 gap-2 mt-2">
              {PALETTE.map((p) => (
                <li
                  key={p.name}
                  className="rounded-md border border-line/70 bg-paper p-3 flex items-center gap-3"
                >
                  <span
                    className="size-8 rounded-md border border-line/40 shrink-0"
                    style={{ background: p.hex }}
                  />
                  <span className="min-w-0">
                    <div className="text-sm font-medium tracking-tight truncate">
                      {p.name}
                    </div>
                    <div className="text-2xs font-mono text-ink-muted">
                      {p.hex}
                    </div>
                    <div className="text-2xs text-ink-soft">{p.role}</div>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Type</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {TYPE.map((t) => (
                <li
                  key={t.name}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <Type className="size-3.5 text-ink-muted" />
                    <span className="font-medium">{t.name}</span>
                  </span>
                  <span className="text-xs text-ink-muted">
                    {t.role} · {t.weight}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-md border border-line/70 bg-cream p-3 space-y-1">
              <div className="text-2xs uppercase tracking-wider text-ink-soft">
                Sample
              </div>
              <p className="text-base">
                The quick brown fox jumps over the lazy dog.
              </p>
              <p className="text-xs font-mono text-ink-muted">
                const launch = await ship(brand);
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Voice</Eyebrow>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-md border border-sage/40 bg-sage/15 p-3">
                <div className="text-xs font-medium tracking-tight inline-flex items-center gap-1 text-sage-ink">
                  <MessageSquareQuote className="size-3" /> Do
                </div>
                <ul className="mt-1.5 space-y-1.5 text-xs">
                  {VOICE_DOS.map((d) => (
                    <li key={d} className="text-ink">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-brick/40 bg-brick/10 p-3">
                <div className="text-xs font-medium tracking-tight inline-flex items-center gap-1 text-brick-ink">
                  <MessageSquareQuote className="size-3" /> Don&apos;t
                </div>
                <ul className="mt-1.5 space-y-1.5 text-xs">
                  {VOICE_DONTS.map((d) => (
                    <li key={d} className="text-ink">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <Eyebrow>Assets</Eyebrow>
              <Link
                href={`/${org}/library?kind=asset`}
                className="text-2xs text-ink-muted hover:text-ink"
              >
                Open in library →
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-2 mt-2">
              {ASSETS.map((a) => (
                <li
                  key={a.file}
                  className="rounded-md border border-line/70 bg-paper p-3 flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <ImageIcon className="size-3.5 text-ink-muted shrink-0" />
                    <span className="min-w-0">
                      <div className="text-sm font-medium tracking-tight truncate">
                        {a.name}
                      </div>
                      <div className="text-2xs font-mono text-ink-muted truncate">
                        {a.file}
                      </div>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <Pill tone="neutral">{a.size}</Pill>
                    <button
                      className="size-7 rounded-md border border-line bg-paper inline-flex items-center justify-center hover:border-line-strong"
                      title="Download"
                    >
                      <Download className="size-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>How agents use this</Eyebrow>
            <Hint>
              Marketing pulls voice + palette before drafting. Engineer pulls
              palette + type tokens before writing UI. Edits here propagate to
              every agent on the next turn — no redeploy.
            </Hint>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
