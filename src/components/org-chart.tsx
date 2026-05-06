"use client";

import Link from "next/link";

type Department = {
  id: string;
  slug: string;
  name: string;
};

const TINT: Record<string, string> = {
  engineering: "from-amber-100 to-amber-200",
  design: "from-stone-200 to-stone-300",
  marketing: "from-orange-100 to-orange-200",
  sales: "from-lime-100 to-lime-200",
  operations: "from-emerald-100 to-emerald-200",
  finance: "from-sky-100 to-sky-200",
  legal: "from-slate-200 to-slate-300",
  support: "from-violet-100 to-violet-200",
};

// proportions tuned to match cofounder.co reference
const RING_R = 30; // dotted ring radius (% of viewBox half)
const LABEL_R = 30; // labels sit ON the ring
const MOCKUP_R = 42; // mockups sit OUTSIDE the ring with breathing room

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
            stroke="#d6d3d1"
            strokeWidth="0.18"
            strokeDasharray="0.4 1.2"
          />
        </svg>

        {/* center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5">
          <div className="size-4 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400" />
          <div className="text-[12px] tracking-tight text-stone-700">
            {orgName}
          </div>
        </div>

        {ordered.map((d, i) => {
          const angle = (i / ordered.length) * 2 * Math.PI - Math.PI / 2;
          const lx = 50 + Math.cos(angle) * LABEL_R;
          const ly = 50 + Math.sin(angle) * LABEL_R;
          const mx = 50 + Math.cos(angle) * MOCKUP_R;
          const my = 50 + Math.sin(angle) * MOCKUP_R;

          return (
            <div key={d.id} className="absolute inset-0 pointer-events-none">
              <div
                className="absolute pointer-events-auto flex gap-1"
                style={{
                  left: `${mx}%`,
                  top: `${my}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {[0, 1].map((k) => (
                  <Mockup
                    key={k}
                    tint={TINT[d.slug] ?? "from-stone-100 to-stone-200"}
                  />
                ))}
              </div>

              <Link
                href={`/${orgSlug}/${d.slug}`}
                className="absolute pointer-events-auto group"
                style={{
                  left: `${lx}%`,
                  top: `${ly}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="rounded-full bg-white border border-stone-200/70 px-2.5 py-0.5 text-[11px] tracking-tight inline-flex items-center gap-1 hover:border-stone-400">
                  <span className="size-1.5 rounded-full bg-stone-300 group-hover:bg-stone-500" />
                  {d.name}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mockup({ tint }: { tint: string }) {
  return (
    <div className="w-[64px] h-[40px] rounded-md bg-white border border-stone-200/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className={`h-2 bg-gradient-to-r ${tint}`} />
      <div className="p-1 space-y-0.5">
        <div className="h-1 rounded bg-stone-100" />
        <div className="h-1 w-2/3 rounded bg-stone-100" />
        <div className="h-2.5 mt-0.5 rounded bg-stone-50" />
      </div>
    </div>
  );
}
