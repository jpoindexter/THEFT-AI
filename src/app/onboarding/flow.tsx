"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type Step = 0 | 1 | 2 | 3 | 4;
type Experience = "writes_code" | "manages_engineers" | "non_technical";
type Role =
  | "product"
  | "engineering"
  | "design"
  | "marketing"
  | "sales"
  | "operations"
  | "founder"
  | "other";
type Stage =
  | "pre_idea"
  | "idea"
  | "pre_mvp"
  | "mvp"
  | "customers"
  | "revenue"
  | "public";

const EXPERIENCE: { key: Experience; label: string }[] = [
  { key: "writes_code", label: "I write code myself" },
  { key: "manages_engineers", label: "I manage engineers with a dev team" },
  { key: "non_technical", label: "I'm not involved on the technical side" },
];

const ROLES: { key: Role; label: string }[] = [
  { key: "product", label: "Product" },
  { key: "engineering", label: "Engineering" },
  { key: "design", label: "Design" },
  { key: "marketing", label: "Marketing" },
  { key: "sales", label: "Sales" },
  { key: "operations", label: "Operations" },
  { key: "founder", label: "Founder / Executive" },
  { key: "other", label: "Other" },
];

const STAGES: { key: Stage; label: string }[] = [
  { key: "pre_idea", label: "Pre-idea" },
  { key: "idea", label: "Idea" },
  { key: "pre_mvp", label: "Pre-MVP" },
  { key: "mvp", label: "MVP" },
  { key: "customers", label: "Customers" },
  { key: "revenue", label: "Revenue" },
  { key: "public", label: "Public" },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [stage, setStage] = useState<Stage>("pre_idea");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function complete() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          experience,
          primaryRole: role,
          stage,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create organization");
      }
      const { slug } = await res.json();
      router.replace(`/${slug}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setSubmitting(false);
    }
  }

  // ascii art shown for steps 0–2; sunflower for steps 3–4
  const showAscii = step <= 2;

  return (
    <div className="min-h-screen bg-[#f3f1ec] text-ink relative">
      <button
        type="button"
        className="absolute top-4 left-4 text-[12px] text-ink-muted inline-flex items-center gap-1.5 hover:text-ink"
      >
        <LogOut className="size-3" /> Log out
      </button>

      <div className="grid lg:grid-cols-2 min-h-screen">
        <aside className="hidden lg:flex items-center justify-center p-10">
          {showAscii ? <AsciiTagline /> : <Sunflower />}
        </aside>
        <main className="flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-7">
            {step === 0 && (
              <Question
                title="What's your experience building products?"
                options={EXPERIENCE.map((o, i) => ({
                  key: o.key,
                  index: i + 1,
                  label: o.label,
                  selected: experience === o.key,
                  onSelect: () => setExperience(o.key),
                }))}
                onContinue={experience ? () => setStep(1) : undefined}
              />
            )}
            {step === 1 && (
              <Question
                title="Which best describes you?"
                options={ROLES.map((o, i) => ({
                  key: o.key,
                  index: i + 1,
                  label: o.label,
                  selected: role === o.key,
                  onSelect: () => setRole(o.key),
                }))}
                onContinue={role ? () => setStep(2) : undefined}
              />
            )}
            {step === 2 && (
              <StageSlider
                value={stage}
                onChange={setStage}
                onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <div className="space-y-6 text-center">
                <h2 className="text-[15px] tracking-tight">
                  Create your company
                </h2>
                <div className="flex justify-center">
                  <PillButton onClick={() => setStep(4)}>Continue</PillButton>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-5 text-center">
                <h2 className="text-[15px] tracking-tight">
                  Create your company
                </h2>
                <div className="space-y-1.5 text-left">
                  <label
                    className="text-[11px] text-ink-muted"
                    htmlFor="company-name"
                  >
                    Company name
                  </label>
                  <input
                    id="company-name"
                    autoFocus
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-md border border-blue-400 ring-2 ring-blue-100 bg-paper px-3 py-2 text-[13px] focus:outline-none focus:ring-blue-200"
                  />
                </div>
                {err && <p className="text-[12px] text-red-600">{err}</p>}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <PillButton
                    onClick={complete}
                    disabled={!companyName.trim() || submitting}
                  >
                    {submitting ? "Creating…" : "Continue →"}
                  </PillButton>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[12px] text-ink-muted hover:text-ink underline underline-offset-2"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Question({
  title,
  options,
  onContinue,
}: {
  title: string;
  options: {
    key: string;
    index: number;
    label: string;
    selected: boolean;
    onSelect: () => void;
  }[];
  onContinue?: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-[15px] tracking-tight text-center">{title}</h2>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={o.onSelect}
            className={`w-full text-left flex items-center gap-3 rounded-md border bg-paper px-4 py-2.5 text-[13px] transition-colors ${
              o.selected
                ? "border-ink ring-1 ring-stone-900"
                : "border-line hover:border-line-strong"
            }`}
          >
            <span className="text-ink-soft tabular-nums w-6 text-[11px] font-mono">
              {String(o.index).padStart(2, "0")}
            </span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <button
          onClick={onContinue}
          disabled={!onContinue}
          className="text-[13px] text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function StageSlider({
  value,
  onChange,
  onNext,
}: {
  value: Stage;
  onChange: (s: Stage) => void;
  onNext: () => void;
}) {
  const idx = STAGES.findIndex((s) => s.key === value);
  return (
    <div className="space-y-7 text-center">
      <h2 className="text-[15px] tracking-tight">What stage is your idea?</h2>
      <div className="flex items-center justify-between text-[11px]">
        {STAGES.map((s, i) => {
          const active = i === idx;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              className={`px-2.5 py-1 rounded transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="relative h-3 mx-3">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 -translate-y-1/2"
          style={{
            height: 1,
            backgroundImage:
              "repeating-linear-gradient(to right, #cbd5e1 0 3px, transparent 3px 7px)",
          }}
        />
        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          value={idx}
          onChange={(e) => onChange(STAGES[Number(e.target.value)].key)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label="Idea stage"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500 pointer-events-none"
          style={{
            left: `calc(${(idx / (STAGES.length - 1)) * 100}% - 4px)`,
          }}
        />
      </div>
      <div className="flex justify-center pt-1">
        <PillButton onClick={onNext}>Next →</PillButton>
      </div>
    </div>
  );
}

function PillButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-paper border border-line px-5 py-1.5 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:border-line-strong transition-colors shadow-[0_1px_0_rgba(0,0,0,0.02)]"
    >
      {children}
    </button>
  );
}

// Cross-stitch tagline rendered as SVG: three stacked words filled with
// a dot/cross pattern that mimics the textile aesthetic on cofounder.co.
function AsciiTagline() {
  const lines = ["WE ARE", "THINKING", "MACHINES"];
  return (
    <div className="select-none w-full" aria-hidden>
      <svg
        viewBox="0 0 600 540"
        width="100%"
        className="max-w-[480px]"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Cross-stitch pattern: a 6x6 cell with a × glyph */}
          <pattern
            id="stitch"
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="transparent" />
            <path
              d="M1 1 L5 5 M5 1 L1 5"
              stroke="#a8a29e"
              strokeWidth="0.7"
              opacity="0.55"
            />
          </pattern>
        </defs>
        {lines.map((line, i) => (
          <text
            key={line}
            x="50%"
            y={120 + i * 170}
            textAnchor="middle"
            fontFamily="var(--font-sans), Inter, sans-serif"
            fontSize="120"
            fontWeight={800}
            letterSpacing="2"
            fill="url(#stitch)"
            stroke="#d6d3d1"
            strokeWidth="0.4"
          >
            {line}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Pixel-art sunflower in cross-stitch style. Each cell is rendered as a small
// × glyph (not a filled square) to match the textile aesthetic on the
// cofounder.co reference. Colors: mustard petals, dark center, sage stem/leaves.
function Sunflower() {
  // 28 columns × 40 rows. Characters: . = empty, p = petal, c = center,
  // s = stem, l = leaf, L = leaf-light, P = petal-light
  // prettier-ignore
  const grid = [
    "............................",
    "............................",
    ".........pppPp..............",
    "........PpppppPp............",
    ".......PpppppppPp...........",
    "......pppPcccccPpp..........",
    ".....ppPccccccccPpp.........",
    "....pPpcccccccccccPp........",
    "....ppccccccccccccpp........",
    "....pPcccccccccccccp........",
    "....ppcccccccccccccpp.......",
    "....pPccccccccccccPpp.......",
    "....ppccccccccccccPpp.......",
    ".....pPcccccccccPppP........",
    ".....ppPcccccccPpp..........",
    "......pppPpPPpppP...........",
    ".......pPpppppP.............",
    "..........s.................",
    "..........s.................",
    ".........lss................",
    "........llsLL...............",
    ".......lLLs..LL.............",
    "......lLLLs..LLLl...........",
    ".....lLLLls..LLLLll.........",
    "......lLLs....LLLLll........",
    ".......lLs.....LLLLl........",
    "........s.......LLLl........",
    "........s........LLl........",
    "........s.........Ll........",
    "........s..................",
    "........s..................",
    "........s..................",
    "........ss.................",
    ".......lLLLs...............",
    "......lLLLLLs..............",
    ".....lLLLLLLLLs............",
    ".....lLLLLLLLLLLs..........",
    ".......lLLLLLLLLLs.........",
    "..........llLLLLLLs........",
    "..............lllLLs.......",
  ];
  const palette: Record<string, string> = {
    p: "#c89a4d", // mustard petal
    P: "#e0b96a", // light petal
    c: "#5a3618", // dark center
    s: "#6b7d44", // stem
    l: "#7c8d4d", // leaf shadow
    L: "#9aaa5d", // leaf highlight
  };
  const cell = 8; // px per cell — slightly larger so the × glyph reads
  const cols = grid[0].length;
  const rows = grid.length;
  const w = cols * cell;
  const h = rows * cell;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="select-none"
      aria-hidden
    >
      {grid.flatMap((line, y) =>
        line.split("").map((ch, x) => {
          const fill = palette[ch];
          if (!fill) return null;
          const cx = x * cell + cell / 2;
          const cy = y * cell + cell / 2;
          const half = cell * 0.42;
          return (
            <g key={`${x}-${y}`}>
              <line
                x1={cx - half}
                y1={cy - half}
                x2={cx + half}
                y2={cy + half}
                stroke={fill}
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <line
                x1={cx + half}
                y1={cy - half}
                x2={cx - half}
                y2={cy + half}
                stroke={fill}
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>
          );
        }),
      )}
    </svg>
  );
}
