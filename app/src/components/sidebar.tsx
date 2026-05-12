"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";

// Dept icons — SVG paths from prototype
const DeptIcons: Record<string, (p: { size?: number }) => React.ReactElement> = {
  engineering: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M2 19h20"/><path d="M9 12h6"/>
    </svg>
  ),
  design: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h4l11-11-4-4L3 17v4Z"/><path d="m13 6 4 4"/>
    </svg>
  ),
  marketing: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 14-6v14L3 13Z"/><path d="M7 13v5a2 2 0 0 0 4 0v-3"/><path d="M17 9v6"/>
    </svg>
  ),
  sales: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 12 4-4 3 3 4-4 2 2"/><path d="M12 19V8"/><path d="M5 19h14"/>
    </svg>
  ),
  operations: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 0 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.3 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>
    </svg>
  ),
  finance: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  legal: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18"/><path d="M5 21h14"/><path d="m4 9 4-4 4 4"/><path d="m12 9 4-4 4 4"/><path d="M4 9c0 2 2 4 4 4s4-2 4-4"/><path d="M12 9c0 2 2 4 4 4s4-2 4-4"/>
    </svg>
  ),
  support: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"/><path d="M3 19a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2Z"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  {
    id: "roadmap",
    label: "Roadmap",
    href: (org: string) => `/${org}`,
    icon: ({ size = 15 }: { size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14"/><path d="M15 6v14"/>
      </svg>
    ),
    badge: null,
    exact: true,
  },
  {
    id: "tasks",
    label: "Tasks",
    href: (org: string) => `/${org}/tasks`,
    icon: ({ size = 15 }: { size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>
      </svg>
    ),
    badge: null,
    exact: false,
  },
  {
    id: "approvals",
    label: "Approvals",
    href: (org: string) => `/${org}/approvals`,
    icon: ({ size = 15 }: { size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    ),
    badge: null,
    exact: false,
  },
  {
    id: "library",
    label: "Library",
    href: (org: string) => `/${org}/library`,
    icon: ({ size = 15 }: { size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"/><path d="M4 19.5V21h14"/>
      </svg>
    ),
    badge: null,
    exact: false,
  },
];

const DEPARTMENTS = [
  { slug: "engineering", name: "Engineering" },
  { slug: "design", name: "Design" },
  { slug: "marketing", name: "Marketing" },
  { slug: "sales", name: "Sales" },
  { slug: "operations", name: "Operations" },
  { slug: "finance", name: "Finance" },
  { slug: "legal", name: "Legal" },
  { slug: "support", name: "Support" },
];

export default function Sidebar({
  orgSlug,
  founderInitial,
  orgName,
}: {
  orgSlug: string;
  founderInitial: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const [deptsOpen, setDeptsOpen] = useState(true);

  function isNavActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.exact) return pathname === `/${orgSlug}` || pathname === `/${orgSlug}/`;
    return pathname.startsWith(item.href(orgSlug));
  }

  const activeDeptSlug = DEPARTMENTS.find((d) =>
    pathname === `/${orgSlug}/${d.slug}` || pathname.startsWith(`/${orgSlug}/${d.slug}/`)
  )?.slug;

  return (
    <aside
      className="flex flex-col border-r border-line bg-canvas overflow-hidden"
      style={{ padding: "10px 10px 16px" }}
    >
      {/* Workspace label */}
      <div
        style={{
          padding: "8px 10px 4px",
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--t-ink-muted)",
          marginBottom: 2,
        }}
      >
        Workspace
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          if (item.id === "approvals") {
            // Insert dept section before approvals
            return (
              <div key="dept-section">
                <DeptSection
                  orgSlug={orgSlug}
                  open={deptsOpen}
                  onToggle={() => setDeptsOpen((o) => !o)}
                  activeDeptSlug={activeDeptSlug}
                />
                <NavItem
                  item={item}
                  active={isNavActive(item)}
                  href={item.href(orgSlug)}
                />
              </div>
            );
          }
          return (
            <NavItem
              key={item.id}
              item={item}
              active={isNavActive(item)}
              href={item.href(orgSlug)}
            />
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Credits */}
      <div
        style={{
          borderTop: "1px solid var(--t-line)",
          paddingTop: 12,
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            padding: "0 10px",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--t-ink-muted)",
          }}
        >
          Credits this month
        </div>
        <div style={{ padding: "0 10px" }}>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "var(--t-line)",
              border: "1px solid var(--t-line)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "20%",
                height: "100%",
                background: "var(--t-ink-muted)",
              }}
            />
          </div>
          <div
            className="flex items-center justify-between"
            style={{ marginTop: 6, fontSize: 11, color: "var(--t-ink-soft)" }}
          >
            <span>— / —</span>
            <span>∞</span>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "0 6px" }}>
          <button
            className="flex items-center gap-2 w-full rounded-lg hover:bg-canvas transition-colors"
            style={{ padding: "8px 8px", background: "transparent" }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--t-ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--t-paper)",
                flexShrink: 0,
              }}
            >
              {founderInitial}
            </span>
            <span className="flex flex-col items-start gap-0 flex-1 min-w-0">
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--t-ink)",
                }}
                className="truncate w-full"
              >
                {orgName}
              </span>
              <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>
                Founder
              </span>
            </span>
            <MoreHorizontal
              size={14}
              style={{ color: "var(--t-ink-soft)", flexShrink: 0 }}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  item,
  active,
  href,
}: {
  item: { label: string; icon: (p: { size?: number }) => React.ReactElement; badge: string | null };
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 w-full rounded-lg transition-colors"
      style={{
        height: 32,
        padding: "0 10px",
        borderRadius: 7,
        color: active ? "var(--t-ink)" : "var(--t-ink-muted)",
        background: active ? "var(--t-paper)" : "transparent",
        border: active ? "1px solid var(--t-line)" : "1px solid transparent",
        fontWeight: active ? 600 : 400,
        fontSize: 13,
        textDecoration: "none",
      }}
    >
      <item.icon size={15} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 5,
            background: active ? "var(--t-ink)" : "var(--t-paper)",
            color: active ? "var(--t-paper)" : "var(--t-ink-muted)",
            border: "1px solid var(--t-line)",
            fontSize: 10,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function DeptSection({
  orgSlug,
  open,
  onToggle,
  activeDeptSlug,
}: {
  orgSlug: string;
  open: boolean;
  onToggle: () => void;
  activeDeptSlug: string | undefined;
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 w-full rounded-lg transition-colors"
        style={{
          height: 32,
          padding: "0 10px",
          borderRadius: 7,
          color: "var(--t-ink-muted)",
          fontWeight: 400,
          fontSize: 13,
          background: "transparent",
        }}
      >
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
          <path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
        </svg>
        <span className="flex-1 text-left">Departments</span>
        <ChevronDown
          size={14}
          style={{
            color: "var(--t-ink-soft)",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform 150ms",
          }}
        />
      </button>

      {open && (
        <div style={{ paddingLeft: 14, display: "flex", flexDirection: "column", gap: 1 }}>
          {DEPARTMENTS.map((d) => {
            const Icon = DeptIcons[d.slug];
            const isActive = activeDeptSlug === d.slug;
            return (
              <Link
                key={d.slug}
                href={`/${orgSlug}/${d.slug}`}
                className="flex items-center gap-2 w-full rounded-md transition-colors"
                style={{
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 6,
                  color: isActive ? "var(--t-ink)" : "var(--t-ink-muted)",
                  background: isActive ? "var(--t-paper)" : "transparent",
                  border: isActive ? "1px solid var(--t-line)" : "1px solid transparent",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 12.5,
                  textDecoration: "none",
                }}
              >
                {Icon && (
                  <Icon size={13} />
                )}
                <span className="flex-1 text-left">{d.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
