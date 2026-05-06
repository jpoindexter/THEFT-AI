"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Plus, BookOpen, Eye } from "lucide-react";
import Link from "next/link";

export default function LayoutCanvas({
  children,
  hasPlan,
}: {
  children: React.ReactNode;
  hasPlan: boolean;
}) {
  const pathname = usePathname();
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const isOrgRoot = segments.length === 1;
  const orgSlug = segments[0];
  const attentionCount = 4;
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

  return (
    <main className="relative overflow-hidden rounded-lg bg-paper border border-line/70">
      {children}

      {/* Bottom-left bell + recent cards on the org-root canvas */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setInboxOpen((v) => !v)}
        className="absolute bottom-3 left-3 size-8 rounded-full bg-paper border border-line/70 inline-flex items-center justify-center hover:border-line-strong z-20"
      >
        <Bell className="size-3.5 text-ink-muted" />
      </button>

      {inboxOpen && (
        <div className="absolute bottom-14 left-3 w-64 rounded-lg bg-paper border border-line/70 shadow-md z-30">
          <div className="flex items-center justify-between px-3 py-2 border-b border-line/70">
            <div className="text-[13px] font-medium">Inbox</div>
            <button
              type="button"
              className="text-[11px] text-ink-muted hover:text-ink"
              onClick={() => setInboxOpen(false)}
            >
              Desktop alerts
            </button>
          </div>
          <div className="p-6 text-center text-[12px] text-ink-muted">
            All caught up!
          </div>
        </div>
      )}

      {/* Bottom-center toolbar with two recent cards + plus button on org root */}
      {hasPlan && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-2 z-10">
          {isOrgRoot && (
            <>
              <RecentCard tint="from-rose-100 to-rose-200" />
              <RecentCard tint="from-amber-100 to-amber-200" />
            </>
          )}
          <div className="relative">
            <button
              type="button"
              aria-label="New"
              onClick={() => setMenuOpen((v) => !v)}
              className="size-9 rounded-md bg-ink text-white inline-flex items-center justify-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.25)]"
            >
              <Plus className="size-4" />
            </button>
            {menuOpen && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-44 rounded-lg bg-paper text-white border border-line shadow-lg overflow-hidden">
                <MenuItem icon={<BookOpen className="size-3.5" />} label="New Agent" sub="Employee you can give tasks to" />
                <MenuItem icon={<BookOpen className="size-3.5" />} label="New Task" sub="Work to assign your agents" />
              </div>
            )}
          </div>
        </div>
      )}

      {hasPlan && (
        <Link
          href={`/${orgSlug}/review`}
          aria-label="Attention queue"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink text-white pl-2 pr-3 py-1.5 text-[11px] hover:opacity-90 z-20 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.35)]"
        >
          <Eye className="size-3.5" />
          <span>Review</span>
          {attentionCount > 0 && (
            <span className="size-4 rounded-full bg-amber-300 text-ink text-[10px] font-semibold inline-flex items-center justify-center">
              {attentionCount}
            </span>
          )}
        </Link>
      )}
    </main>
  );
}

function RecentCard({ tint }: { tint: string }) {
  return (
    <div className="w-12 h-9 rounded-md bg-paper border border-line/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className={`h-1.5 bg-gradient-to-r ${tint}`} />
      <div className="p-1 space-y-0.5">
        <div className="h-0.5 rounded bg-line" />
        <div className="h-0.5 w-2/3 rounded bg-line" />
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className="w-full text-left flex items-start gap-2 px-3 py-2 hover:bg-cream transition-colors"
    >
      <span className="mt-0.5 text-line-strong">{icon}</span>
      <span className="leading-tight">
        <span className="block text-[12px]">{label}</span>
        <span className="block text-[10px] text-ink-soft">{sub}</span>
      </span>
    </button>
  );
}
