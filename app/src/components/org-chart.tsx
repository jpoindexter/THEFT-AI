"use client";

import Link from "next/link";
import {
  Briefcase,
  Code2,
  LifeBuoy,
  Megaphone,
  Palette,
  Scale,
  Sparkles,
  Wallet,
  ClipboardList,
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

type Department = { id: string; slug: string; name: string };

const RING_R = 30;
const LABEL_R = 30;

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
          return (
            <DeptNode
              key={d.id}
              dept={d}
              orgSlug={orgSlug}
              labelPos={{ x: lx, y: ly }}
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
        cx="50" cy="50" r={RING_R}
        fill="none" stroke="currentColor"
        className="text-line-strong"
        strokeWidth="0.15"
      />
    </svg>
  );
}

function Center({ orgName }: { orgName: string }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" data-canvas-pan-block>
      <div className="rounded-full bg-paper border border-line/70 px-3 py-1 inline-flex items-center gap-1.5 shadow-sm">
        <SeedlingIcon />
        <span className="text-sm tracking-tight text-ink">{orgName}</span>
      </div>
    </div>
  );
}

function SeedlingIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden className="shrink-0">
      <line x1="7" y1="15" x2="7" y2="6" stroke="#6b7d44" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 10 Q3 8 4 5 Q6 7 7 8" fill="none" stroke="#9aaa5d" strokeWidth="1" strokeLinecap="round" />
      <path d="M7 9 Q11 7 10 4 Q8 6 7 7" fill="none" stroke="#9aaa5d" strokeWidth="1" strokeLinecap="round" />
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
}: {
  dept: Department;
  orgSlug: string;
  labelPos: { x: number; y: number };
}) {
  const Icon = DEPT_ICON[dept.slug] ?? Sparkles;
  const color = DEPT_COLOR[dept.slug] ?? "bg-ink text-paper";

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute pointer-events-auto flex flex-col items-center"
        style={{ left: `${labelPos.x}%`, top: `${labelPos.y}%`, transform: "translate(-50%, -50%)" }}
        data-canvas-pan-block
      >
        <Link
          href={`/${orgSlug}/${dept.slug}`}
          className="rounded-full bg-paper border border-line/70 pl-1 pr-2.5 py-0.5 text-xs tracking-tight inline-flex items-center gap-1.5 hover:border-line-strong hover:shadow-sm transition-shadow"
        >
          <span className={`size-4 rounded-full inline-flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="size-2.5" />
          </span>
          {dept.name}
        </Link>
      </div>
    </div>
  );
}
