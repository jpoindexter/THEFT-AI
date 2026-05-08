import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill } from "@/components/ui/primitives";
import { ArrowLeft, Copy } from "lucide-react";

type TokenGroup = {
  name: string;
  tokens: { name: string; value: string; swatch?: string }[];
};

const TOKEN_GROUPS: TokenGroup[] = [
  {
    name: "Color — ink",
    tokens: [
      { name: "ink",        value: "#1F1B16", swatch: "#1F1B16" },
      { name: "ink-muted",  value: "#6B6560", swatch: "#6B6560" },
      { name: "ink-soft",   value: "#9B958F", swatch: "#9B958F" },
    ],
  },
  {
    name: "Color — surface",
    tokens: [
      { name: "canvas",  value: "#F0E8D8", swatch: "#F0E8D8" },
      { name: "paper",   value: "#FBF6E8", swatch: "#FBF6E8" },
      { name: "cream",   value: "#F5EFE0", swatch: "#F5EFE0" },
    ],
  },
  {
    name: "Color — semantic",
    tokens: [
      { name: "sage",     value: "#A8C19A", swatch: "#A8C19A" },
      { name: "sage-ink", value: "#3D6B34", swatch: "#3D6B34" },
      { name: "mustard",  value: "#D9A441", swatch: "#D9A441" },
      { name: "brick",    value: "#9B3F2C", swatch: "#9B3F2C" },
    ],
  },
  {
    name: "Color — line",
    tokens: [
      { name: "line",        value: "#D4C9B8", swatch: "#D4C9B8" },
      { name: "line-strong", value: "#B8A898", swatch: "#B8A898" },
    ],
  },
  {
    name: "Typography",
    tokens: [
      { name: "font-sans",  value: "Inter" },
      { name: "font-mono",  value: "JetBrains Mono" },
      { name: "text-2xs",   value: "0.625rem / 1rem" },
      { name: "text-xs",    value: "0.75rem / 1rem" },
      { name: "text-sm",    value: "0.875rem / 1.25rem" },
      { name: "text-base",  value: "1rem / 1.5rem" },
      { name: "text-xl",    value: "1.25rem / 1.75rem" },
    ],
  },
  {
    name: "Spacing",
    tokens: [
      { name: "p-3",   value: "0.75rem (12px)" },
      { name: "p-4",   value: "1rem (16px)" },
      { name: "p-5",   value: "1.25rem (20px)" },
      { name: "p-6",   value: "1.5rem (24px)" },
      { name: "gap-3", value: "0.75rem" },
      { name: "gap-4", value: "1rem" },
    ],
  },
  {
    name: "Radius",
    tokens: [
      { name: "rounded",    value: "0.25rem" },
      { name: "rounded-lg", value: "0.5rem" },
      { name: "rounded-xl", value: "0.75rem" },
      { name: "rounded-2xl",value: "1rem" },
      { name: "rounded-full","value": "9999px" },
    ],
  },
];

type ComponentEntry = {
  name: string;
  import: string;
  usage: string;
  variants?: string[];
};

const PRIMITIVE_COMPONENTS: ComponentEntry[] = [
  { name: "PageTitle",  import: "@/components/ui/primitives", usage: "<PageTitle>Text</PageTitle>", variants: undefined },
  { name: "Hint",       import: "@/components/ui/primitives", usage: "<Hint>Subtext</Hint>", variants: undefined },
  { name: "Eyebrow",    import: "@/components/ui/primitives", usage: "<Eyebrow>Label</Eyebrow>", variants: undefined },
  { name: "Pill",       import: "@/components/ui/primitives", usage: '<Pill tone="sage">Label</Pill>', variants: ["sage", "mustard", "brick", "neutral"] },
  { name: "StatCard",   import: "@/components/ui/primitives", usage: '<StatCard label="MRR" value="$12.4k" tone="sage" />', variants: ["sage", "mustard", "brick", "neutral"] },
  { name: "Card",       import: "@/components/ui/primitives", usage: "<Card><CardBody>…</CardBody></Card>", variants: undefined },
];

export default async function ComponentsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header>
          <Link
            href={`/${org}/design`}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
          >
            <ArrowLeft className="size-3" /> Design
          </Link>
          <PageTitle>Design System</PageTitle>
          <Hint>
            Tokens, primitives, and component patterns. Every agent reads{" "}
            <code className="font-mono text-2xs bg-canvas border border-line/60 px-1 rounded">
              DESIGN.md
            </code>{" "}
            before touching UI.
          </Hint>
        </header>

        {/* Token tables */}
        <div className="space-y-4">
          <Eyebrow>Design tokens</Eyebrow>
          {TOKEN_GROUPS.map((group) => (
            <div key={group.name} className="rounded-xl border border-line/70 bg-paper overflow-hidden">
              <div className="px-4 py-2 border-b border-line/40 text-2xs uppercase tracking-wider text-ink-soft font-medium">
                {group.name}
              </div>
              {group.tokens.map((token, i) => (
                <div
                  key={token.name}
                  className={`flex items-center gap-3 px-4 py-2 ${i < group.tokens.length - 1 ? "border-b border-line/40" : ""}`}
                >
                  {token.swatch && (
                    <span
                      className="size-4 rounded shrink-0 border border-black/10"
                      style={{ background: token.swatch }}
                    />
                  )}
                  <span className="font-mono text-xs text-ink w-36 shrink-0">{token.name}</span>
                  <span className="text-xs text-ink-muted flex-1">{token.value}</span>
                  <button
                    type="button"
                    className="size-5 rounded border border-line/60 flex items-center justify-center hover:border-line-strong opacity-0 group-hover:opacity-100 shrink-0"
                    title="Copy"
                  >
                    <Copy className="size-2.5 text-ink-soft" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Primitive components */}
        <div className="space-y-2">
          <Eyebrow>Primitive components</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Component</th>
                  <th className="text-left px-4 py-2 font-medium">Import</th>
                  <th className="text-left px-4 py-2 font-medium">Usage</th>
                  <th className="text-left px-4 py-2 font-medium">Variants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {PRIMITIVE_COMPONENTS.map((c) => (
                  <tr key={c.name} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-2.5 text-2xs font-mono text-ink-muted">{c.import}</td>
                    <td className="px-4 py-2.5 text-2xs font-mono text-ink-soft max-w-xs truncate">
                      {c.usage}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.variants ? (
                        <div className="flex flex-wrap gap-1">
                          {c.variants.map((v) => (
                            <Pill key={v} tone="neutral">{v}</Pill>
                          ))}
                        </div>
                      ) : (
                        <span className="text-2xs text-ink-soft">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live token preview */}
        <div className="space-y-2">
          <Eyebrow>Live preview — pill tones</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper p-4 flex flex-wrap gap-2">
            <Pill tone="sage">sage — positive</Pill>
            <Pill tone="mustard">mustard — notice</Pill>
            <Pill tone="brick">brick — caution</Pill>
            <Pill tone="neutral">neutral — default</Pill>
          </div>
          <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft mb-2">StatCard tones</div>
            <div className="grid grid-cols-4 gap-3">
              {(["sage", "mustard", "brick", "neutral"] as const).map((tone) => (
                <div key={tone} className="rounded-lg border border-line/70 bg-canvas p-2.5">
                  <div className="text-2xs uppercase tracking-wider text-ink-soft">{tone}</div>
                  <div className="text-xl font-medium tracking-tight text-ink mt-0.5">42</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
