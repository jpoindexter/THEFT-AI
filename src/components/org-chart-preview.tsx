type DeptKey =
  | "engineering"
  | "design"
  | "marketing"
  | "sales"
  | "operations"
  | "finance"
  | "legal"
  | "support";

type Preview = {
  description: string;
  status: "live" | "beta" | "coming_soon";
  scene: SceneKey;
};

type SceneKey =
  | "engineering"
  | "design"
  | "marketing"
  | "sales"
  | "operations"
  | "finance"
  | "legal"
  | "support";

export const DEPT_PREVIEWS: Record<DeptKey, Preview> = {
  engineering: {
    description:
      "Engineer agent ships product features, migrations, and PR previews on the managed Vercel + Supabase stack.",
    status: "live",
    scene: "engineering",
  },
  design: {
    description:
      "Design agent builds the brand kit, decks, email templates, and product UI so creative output stays consistent.",
    status: "live",
    scene: "design",
  },
  marketing: {
    description:
      "Marketing agent runs campaign strategy, copy, and content production from your business plan.",
    status: "live",
    scene: "marketing",
  },
  sales: {
    description:
      "Sales agent does ICP, outbound, customer development, and pipeline work without a CRM headache.",
    status: "beta",
    scene: "sales",
  },
  operations: {
    description:
      "Operations agent owns recurring routines, weekly briefs, and the audit log of who did what.",
    status: "live",
    scene: "operations",
  },
  finance: {
    description:
      "Finance agent reconciles Stripe, AWS bills, invoices, and surfaces variance vs forecast each month.",
    status: "beta",
    scene: "finance",
  },
  legal: {
    description:
      "Legal agent drafts contracts, reviews ToS/privacy, and flags claims before anything ships externally.",
    status: "coming_soon",
    scene: "legal",
  },
  support: {
    description:
      "Support agents handle customer inquiries, resolve issues, and keep satisfaction scores high around the clock.",
    status: "coming_soon",
    scene: "support",
  },
};

export function PreviewScene({ scene }: { scene: SceneKey }) {
  return (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <defs>
        <pattern
          id={`stitch-${scene}`}
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0 L3 3 M3 0 L0 3"
            stroke="currentColor"
            strokeWidth="0.4"
            fill="none"
            opacity="0.45"
          />
        </pattern>
      </defs>
      <SceneInner scene={scene} />
    </svg>
  );
}

function SceneInner({ scene }: { scene: SceneKey }) {
  const fill = `url(#stitch-${scene})`;
  switch (scene) {
    case "engineering":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.65 0.18 25)" opacity="0.18" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-brick-ink" />
          <rect x="20" y="22" width="60" height="22" fill="oklch(0.45 0.05 80)" opacity="0.45" rx="2" />
          <line x1="0" y1="44" x2="100" y2="44" stroke="oklch(0.3 0.05 80)" strokeWidth="0.4" />
        </>
      );
    case "design":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.85 0.12 90)" opacity="0.25" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-mustard-ink" />
          <circle cx="35" cy="30" r="14" fill="oklch(0.85 0.12 90)" opacity="0.6" />
          <rect x="55" y="20" width="30" height="20" fill="oklch(0.6 0.04 80)" opacity="0.5" rx="2" />
        </>
      );
    case "marketing":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.82 0.08 145)" opacity="0.22" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-sage-ink" />
          <rect x="15" y="15" width="70" height="6" fill="oklch(0.4 0.08 145)" opacity="0.55" rx="1" />
          <rect x="15" y="26" width="55" height="4" fill="oklch(0.4 0.08 145)" opacity="0.4" rx="1" />
          <rect x="15" y="34" width="40" height="4" fill="oklch(0.4 0.08 145)" opacity="0.3" rx="1" />
        </>
      );
    case "sales":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.6 0.12 145)" opacity="0.18" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-sage-ink" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={10 + i * 22}
              y={20 + i * 4}
              width="18"
              height={20 - i * 3}
              fill="oklch(0.4 0.08 145)"
              opacity={0.6 - i * 0.1}
            />
          ))}
        </>
      );
    case "operations":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.6 0.05 145)" opacity="0.2" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-sage-ink" />
          <circle cx="50" cy="30" r="18" fill="none" stroke="oklch(0.3 0.05 80)" strokeWidth="0.6" />
          <circle cx="50" cy="30" r="2" fill="oklch(0.3 0.05 80)" />
          <line x1="50" y1="30" x2="62" y2="22" stroke="oklch(0.3 0.05 80)" strokeWidth="0.6" />
        </>
      );
    case "finance":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.6 0.08 100)" opacity="0.18" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-mustard-ink" />
          <polyline
            points="10,45 25,38 40,42 55,28 70,32 90,18"
            fill="none"
            stroke="oklch(0.3 0.05 80)"
            strokeWidth="0.8"
          />
        </>
      );
    case "legal":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.5 0.02 80)" opacity="0.25" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-ink-muted" />
          <rect x="30" y="14" width="40" height="36" fill="oklch(0.7 0.01 80)" opacity="0.6" rx="1" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x="34"
              y={20 + i * 5}
              width="32"
              height="1.5"
              fill="oklch(0.3 0.05 80)"
              opacity="0.4"
            />
          ))}
        </>
      );
    case "support":
      return (
        <>
          <rect x="0" y="0" width="100" height="60" fill="oklch(0.6 0.08 230)" opacity="0.22" />
          <rect x="0" y="0" width="100" height="60" fill={fill} className="text-ink-muted" />
          <ellipse cx="35" cy="35" rx="14" ry="3" fill="oklch(0.5 0.05 230)" opacity="0.45" />
          <rect x="60" y="22" width="20" height="10" fill="oklch(0.7 0.05 230)" opacity="0.5" rx="1" />
        </>
      );
  }
}
