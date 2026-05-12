"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, Bell, PanelRight } from "lucide-react";
import CommandPalette from "@/components/command-palette";

export default function OrgTopBar({
  orgName,
  orgSlug,
  founderInitial,
  breadcrumb,
  orgs,
  chatOpen,
  onToggleChat,
}: {
  orgName: string;
  orgSlug: string;
  founderInitial: string;
  breadcrumb: string;
  orgs: { slug: string; name: string }[];
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  return (
    <header
      className="flex items-center gap-4 shrink-0 bg-canvas border-b border-line-strong"
      style={{ height: 52, padding: "0 20px", position: "sticky", top: 0, zIndex: 30 }}
    >
      {/* Wordmark + org switcher */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOrgMenuOpen((o) => !o)}
          className="flex items-center gap-2"
          style={{ gap: 8 }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--t-ink)",
            }}
          >
            THEFT<span style={{ color: "var(--t-mustard)" }}> &amp;</span>
          </span>

          <span
            style={{
              width: 1,
              height: 18,
              background: "var(--t-line-strong)",
              margin: "0 4px",
            }}
          />

          <span className="flex items-center gap-1.5" style={{ fontWeight: 500 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: "var(--t-ink)",
                color: "var(--t-paper)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {founderInitial}
            </span>
            <span style={{ fontSize: 13 }}>{orgName}</span>
            <ChevronDown size={14} style={{ color: "var(--t-ink-soft)" }} />
          </span>
        </button>

        {orgMenuOpen && (
          <div
            className="absolute top-full left-0 mt-2 rounded-md border border-line-strong bg-paper shadow-md"
            style={{ minWidth: 200, zIndex: 50, padding: 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {orgs.map((o) => (
              <button
                key={o.slug}
                onClick={() => {
                  router.push(`/${o.slug}`);
                  setOrgMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full rounded px-3 py-2 hover:bg-canvas transition-colors"
                style={{ fontSize: 13 }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: o.slug === orgSlug ? "var(--t-ink)" : "var(--t-line)",
                    flexShrink: 0,
                  }}
                />
                {o.name}
              </button>
            ))}
            <div style={{ height: 1, background: "var(--t-line)", margin: "4px 0" }} />
            <button
              onClick={() => { router.push("/onboarding"); setOrgMenuOpen(false); }}
              className="flex items-center gap-2 w-full rounded px-3 py-2 hover:bg-canvas transition-colors"
              style={{ fontSize: 13, color: "var(--t-ink-muted)" }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, color: "var(--t-ink-muted)" }}>+</span>
              New workspace
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <span style={{ color: "var(--t-ink-soft)", fontSize: 13 }}>/</span>
      <span style={{ color: "var(--t-ink-muted)", fontWeight: 500, fontSize: 13 }}>
        {breadcrumb}
      </span>

      <div className="flex-1" />

      {/* Search */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex items-center gap-2"
        style={{
          height: 30,
          padding: "0 10px",
          border: "1px solid var(--t-line)",
          borderRadius: 8,
          gap: 8,
          color: "var(--t-ink-soft)",
          minWidth: 220,
          background: "var(--t-paper)",
          fontSize: 12,
        }}
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search company, agents, artifacts…</span>
        <span style={{ fontSize: 11, color: "var(--t-ink-soft)", fontFamily: "inherit" }}>
          ⌘K
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleChat}
        aria-label={chatOpen ? "Hide chat tray" : "Show chat tray"}
        aria-pressed={chatOpen}
        title={chatOpen ? "Hide chat tray" : "Show chat tray"}
        className="flex items-center justify-center rounded transition-colors"
        style={{
          width: 30,
          height: 30,
          color: chatOpen ? "var(--t-ink)" : "var(--t-ink-muted)",
          background: chatOpen ? "var(--t-paper)" : "transparent",
          border: chatOpen ? "1px solid var(--t-line)" : "1px solid transparent",
        }}
      >
        <PanelRight size={17} />
      </button>

      {/* Bell */}
      <button
        className="flex items-center justify-center rounded hover:bg-canvas transition-colors"
        style={{ width: 30, height: 30, color: "var(--t-ink-muted)" }}
        aria-label="Notifications"
      >
        <Bell size={16} />
      </button>

      {/* Avatar */}
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--t-ink)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--t-paper)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {founderInitial}
      </span>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Overlay to close org menu */}
      {orgMenuOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 40 }}
          onClick={() => setOrgMenuOpen(false)}
        />
      )}
    </header>
  );
}
