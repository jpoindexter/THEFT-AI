import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill } from "@/components/ui/primitives";
import { ArrowLeft, Download, RefreshCcw, Plus } from "lucide-react";

type LogoVariant = {
  id: string;
  name: string;
  type: "wordmark" | "logomark" | "combination" | "icon";
  background: "light" | "dark" | "color";
  status: "approved" | "candidate" | "rejected";
  file: string;
  size: string;
};

const LOGO_VARIANTS: LogoVariant[] = [
  { id: "1", name: "Wordmark — light",       type: "wordmark",    background: "light", status: "approved",  file: "theft-wordmark.svg",       size: "8.2KB" },
  { id: "2", name: "Wordmark — dark",        type: "wordmark",    background: "dark",  status: "approved",  file: "theft-wordmark-dark.svg",  size: "8.2KB" },
  { id: "3", name: "Logomark — light",       type: "logomark",    background: "light", status: "approved",  file: "theft-mark.svg",           size: "3.1KB" },
  { id: "4", name: "Logomark — dark",        type: "logomark",    background: "dark",  status: "approved",  file: "theft-mark-dark.svg",      size: "3.1KB" },
  { id: "5", name: "Combination — light",    type: "combination", background: "light", status: "approved",  file: "theft-combo.svg",          size: "11.4KB" },
  { id: "6", name: "App icon — 1024px",      type: "icon",        background: "color", status: "approved",  file: "icon-1024.png",            size: "42KB" },
  { id: "7", name: "Favicon — 32px",         type: "icon",        background: "light", status: "approved",  file: "favicon-32.png",           size: "1.2KB" },
  { id: "8", name: "OG Image — 1200×630",    type: "combination", background: "color", status: "candidate", file: "og-image.png",             size: "88KB" },
  { id: "9", name: "Monochrome wordmark",    type: "wordmark",    background: "light", status: "candidate", file: "theft-wordmark-mono.svg",  size: "8.2KB" },
];

const USAGE_RULES = [
  { rule: "Minimum clear space",   value: "½× height of the mark on all sides" },
  { rule: "Minimum size",          value: "Wordmark: 80px wide · Icon: 16px" },
  { rule: "On dark backgrounds",   value: "Use dark-variant SVGs only" },
  { rule: "Don't",                 value: "Stretch, rotate, recolor, or add effects" },
  { rule: "Don't",                 value: "Place on busy backgrounds without a padding block" },
];

const BG_CLS: Record<LogoVariant["background"], string> = {
  light: "bg-[#FBF6E8] border-line/60",
  dark:  "bg-[#1F1B16] border-line/20",
  color: "bg-ink border-line/20",
};

const STATUS_TONE: Record<LogoVariant["status"], "sage" | "mustard" | "brick"> = {
  approved:  "sage",
  candidate: "mustard",
  rejected:  "brick",
};

export default async function LogoPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const approved  = LOGO_VARIANTS.filter((v) => v.status === "approved");
  const candidate = LOGO_VARIANTS.filter((v) => v.status === "candidate");

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/design`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Design
            </Link>
            <PageTitle>Logo Set</PageTitle>
            <Hint>
              All approved logo variants for every context — light, dark, icon,
              OG. Download SVG for print; PNG for screen.
            </Hint>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <RefreshCcw className="size-3" /> Regenerate
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              <Download className="size-3.5" /> Download all
            </button>
          </div>
        </header>

        {/* Approved variants */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eyebrow>Approved variants</Eyebrow>
            <Pill tone="sage">{approved.length} files</Pill>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {approved.map((v) => (
              <LogoCard key={v.id} variant={v} />
            ))}
          </div>
        </div>

        {/* Candidates */}
        {candidate.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eyebrow>Candidates — not approved</Eyebrow>
              <Pill tone="mustard">{candidate.length}</Pill>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {candidate.map((v) => (
                <LogoCard key={v.id} variant={v} />
              ))}
            </div>
          </div>
        )}

        {/* Usage rules */}
        <div className="space-y-2">
          <Eyebrow>Usage rules</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {USAGE_RULES.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 px-4 py-2.5 ${i < USAGE_RULES.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <span className="text-xs text-ink-muted w-36 shrink-0">{r.rule}</span>
                <span className="text-xs text-ink">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate new */}
        <div className="rounded-xl border border-dashed border-line/50 p-6 flex flex-col items-center gap-3 text-center">
          <div className="size-9 rounded-lg bg-canvas border border-line/70 flex items-center justify-center">
            <Plus className="size-4 text-ink-muted" />
          </div>
          <div>
            <div className="text-sm font-medium text-ink">Generate new variant</div>
            <div className="text-xs text-ink-muted mt-0.5">
              Describe what you need — the Design Agent will produce an SVG.
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g. horizontal lockup for email footer, white on transparent"
            className="w-full max-w-md text-xs rounded-lg border border-line/70 bg-canvas px-3 py-2 focus:outline-none focus:border-line-strong placeholder:text-ink-soft"
          />
        </div>
      </div>
    </div>
  );
}

function LogoCard({ variant }: { variant: LogoVariant }) {
  const bgCls = BG_CLS[variant.background];
  return (
    <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
      {/* Preview area */}
      <div className={`h-28 flex items-center justify-center rounded-t-xl border-b border-line/40 ${bgCls}`}>
        <span
          className={`text-xl font-semibold tracking-tight ${
            variant.background === "light" ? "text-ink" : "text-white"
          }`}
        >
          {variant.type === "icon" ? "⬛" : "THEFT"}
        </span>
      </div>
      {/* Info */}
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-ink leading-snug">{variant.name}</span>
          <Pill tone={STATUS_TONE[variant.status]}>{variant.status}</Pill>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xs font-mono text-ink-soft truncate">{variant.file}</span>
          <button
            type="button"
            className="size-6 rounded border border-line/70 flex items-center justify-center hover:border-line-strong shrink-0"
          >
            <Download className="size-2.5 text-ink-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}
