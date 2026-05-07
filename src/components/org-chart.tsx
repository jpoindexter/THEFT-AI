"use client";

import Link from "next/link";
import { Pill } from "@/components/ui/primitives";
import {
  DEPT_PREVIEWS,
  PreviewScene,
} from "@/components/org-chart-preview";
import {
  Code2,
  Palette,
  Megaphone,
  Briefcase,
  ClipboardList,
  Wallet,
  Scale,
  LifeBuoy,
  Sparkles,
} from "lucide-react";

const DEPT_COLOR: Record<string, string> = {
  engineering: "bg-[#c8a87a] text-white",
  design:      "bg-[#7ab4c8] text-white",
  marketing:   "bg-[#e0907a] text-white",
  sales:       "bg-[#7ac87a] text-white",
  operations:  "bg-[#7ac8b4] text-white",
  finance:     "bg-[#9a7ac8] text-white",
  legal:       "bg-[#4a5a6a] text-white",
  support:     "bg-[#e0a050] text-white",
};

type Department = { id: string; slug: string; name: string };

const DEPT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  engineering: Code2,
  design: Palette,
  marketing: Megaphone,
  sales: Briefcase,
  operations: ClipboardList,
  finance: Wallet,
  legal: Scale,
  support: LifeBuoy,
};

const RING_R = 30;
const LABEL_R = 30;
const MOCKUP_R = 42;

export default function OrgChart({
  orgSlug,
  orgName,
  departments,
}: {
  orgSlug: string;
  orgName: string;
  departments: Department[];
}) {
  const ordered = departments.slice(0, 8);
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="relative aspect-square w-full max-w-[860px] max-h-full">
        <Ring />
        <Center orgName={orgName} />
        {ordered.map((d, i) => {
          const angle = (i / ordered.length) * 2 * Math.PI - Math.PI / 2;
          const lx = 50 + Math.cos(angle) * LABEL_R;
          const ly = 50 + Math.sin(angle) * LABEL_R;
          const mx = 50 + Math.cos(angle) * MOCKUP_R;
          const my = 50 + Math.sin(angle) * MOCKUP_R;
          return (
            <DeptNode
              key={d.id}
              dept={d}
              orgSlug={orgSlug}
              labelPos={{ x: lx, y: ly }}
              mockPos={{ x: mx, y: my }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Ring() {
  return (
    <svg
      className="absolute inset-0 size-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        cx="50"
        cy="50"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        className="text-line-strong"
        strokeWidth="0.18"
        strokeDasharray="0.4 1.2"
      />
    </svg>
  );
}

function Center({ orgName: _ }: { orgName: string }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="rounded-full bg-paper border border-line/70 px-3 py-1 inline-flex items-center gap-1.5 shadow-sm">
        <SeedlingIcon />
        <span className="text-sm tracking-tight text-ink">Cofounder</span>
      </div>
    </div>
  );
}

function SeedlingIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden className="shrink-0">
      {/* stem */}
      <line x1="7" y1="15" x2="7" y2="6" stroke="#6b7d44" strokeWidth="1.2" strokeLinecap="round" />
      {/* left leaf */}
      <path d="M7 10 Q3 8 4 5 Q6 7 7 8" fill="none" stroke="#9aaa5d" strokeWidth="1" strokeLinecap="round" />
      {/* right leaf */}
      <path d="M7 9 Q11 7 10 4 Q8 6 7 7" fill="none" stroke="#9aaa5d" strokeWidth="1" strokeLinecap="round" />
      {/* bud */}
      <circle cx="7" cy="4.5" r="1.8" fill="none" stroke="#c89a4d" strokeWidth="1" />
      <line x1="5.8" y1="3.3" x2="8.2" y2="5.7" stroke="#c89a4d" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="8.2" y1="3.3" x2="5.8" y2="5.7" stroke="#c89a4d" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

function DeptNode({
  dept,
  orgSlug,
  labelPos,
  mockPos,
}: {
  dept: Department;
  orgSlug: string;
  labelPos: { x: number; y: number };
  mockPos: { x: number; y: number };
}) {
  const preview = DEPT_PREVIEWS[dept.slug as keyof typeof DEPT_PREVIEWS];
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute pointer-events-auto flex gap-1"
        style={{
          left: `${mockPos.x}%`,
          top: `${mockPos.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Mockup scene={dept.slug as keyof typeof DEPT_PREVIEWS} />
        <Mockup scene={dept.slug as keyof typeof DEPT_PREVIEWS} />
      </div>

      <div
        className="absolute pointer-events-auto group"
        style={{
          left: `${labelPos.x}%`,
          top: `${labelPos.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Link
          href={`/${orgSlug}/${dept.slug}`}
          className="rounded-full bg-paper border border-line/70 pl-1 pr-2.5 py-0.5 text-xs tracking-tight inline-flex items-center gap-1.5 hover:border-line-strong"
        >
          {(() => {
            const Icon = DEPT_ICON[dept.slug] ?? Sparkles;
            const color = DEPT_COLOR[dept.slug] ?? "bg-ink text-paper";
            return (
              <span className={`size-4 rounded-full inline-flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="size-2.5" />
              </span>
            );
          })()}
          {dept.name}
        </Link>

        {preview && (
          <HoverCard
            name={dept.name}
            preview={preview}
            href={`/${orgSlug}/${dept.slug}`}
          />
        )}
      </div>
    </div>
  );
}

function HoverCard({
  name,
  preview,
  href,
}: {
  name: string;
  preview: (typeof DEPT_PREVIEWS)[keyof typeof DEPT_PREVIEWS];
  href: string;
}) {
  const tone =
    preview.status === "live"
      ? "sage"
      : preview.status === "beta"
        ? "mustard"
        : "neutral";
  const label =
    preview.status === "coming_soon"
      ? "Coming soon"
      : preview.status === "beta"
        ? "Beta"
        : "Live";
  return (
    <Link
      href={href}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[260px] rounded-md bg-paper border border-line/70 shadow-md overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-30"
    >
      <div className="relative aspect-[5/3] bg-canvas">
        <PreviewScene scene={preview.scene} />
        <span className="absolute top-2 right-2">
          <Pill tone={tone}>{label}</Pill>
        </span>
      </div>
      <div className="p-3">
        <div className="text-base font-medium tracking-tight text-ink">
          {name}
        </div>
        <p className="text-xs text-ink-muted leading-snug mt-1">
          {preview.description}
        </p>
      </div>
    </Link>
  );
}

function Mockup({
  scene,
}: {
  scene: keyof typeof DEPT_PREVIEWS;
}) {
  return (
    <div className="w-[64px] h-[40px] rounded-md bg-paper border border-line/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <PreviewScene scene={scene} />
    </div>
  );
}
