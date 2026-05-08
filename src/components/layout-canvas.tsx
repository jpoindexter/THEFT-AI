"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Clock, ClipboardList, Eye, EyeOff, Plus, UserRound, X } from "lucide-react";
import Link from "next/link";

const INBOX_ITEMS = [
  { id: "1", title: "Build app", agent: "Engineer", action: "responded", time: "5h ago", read: false },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [items, setItems] = useState(INBOX_ITEMS);

  // Toggle-state for alerts modal
  const [alertDesktop, setAlertDesktop] = useState(false);
  const [alertAway, setAlertAway] = useState(true);
  const [alertHideDetails, setAlertHideDetails] = useState(false);

  const unreadCount = items.filter((i) => !i.read).length;

  function markRead(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  }

  return (
    <main className="relative overflow-hidden rounded-lg bg-paper border border-line/70">
      {children}

      {/* Bottom-left notification pill */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setInboxOpen((v) => !v)}
        className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-paper border border-line/70 px-3 py-1.5 hover:border-line-strong z-20 shadow-sm"
      >
        <div className="relative shrink-0">
          <Bell className="size-3.5 text-ink-muted" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 border border-paper" />
          )}
        </div>
        <AgentPixelAvatar />
        <span className="text-xs text-ink">
          {unreadCount} agent update{unreadCount !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Inbox panel */}
      {inboxOpen && (
        <div className="absolute bottom-14 left-3 w-80 rounded-2xl bg-paper border border-line/70 shadow-xl z-30 overflow-hidden">
          <div className="flex justify-center py-2 border-b border-line/60">
            <button type="button" onClick={() => setInboxOpen(false)} className="text-ink-muted hover:text-ink">
              <ChevronDown className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-lg font-semibold">Inbox</span>
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              className="text-sm rounded-full border border-line/70 px-3 py-1 hover:border-line-strong"
            >
              Desktop alerts
            </button>
          </div>

          <ul className="divide-y divide-line/50">
            {items.map((item) => (
              <InboxItem
                key={item.id}
                item={item}
                onMarkRead={() => markRead(item.id)}
              />
            ))}
          </ul>

          <div className="border-t border-line/60 px-4 py-3 flex items-center gap-2">
            <div className="relative shrink-0">
              <Bell className="size-3.5 text-ink-muted" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 border border-paper" />
              )}
            </div>
            <AgentPixelAvatar />
            <span className="text-xs text-ink">
              {unreadCount} agent update{unreadCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Desktop alerts modal */}
      {alertsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-[420px] rounded-2xl bg-paper border border-line/70 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-ink-muted" />
                <span className="font-medium">Alerts when agents need you</span>
              </div>
              <button type="button" onClick={() => setAlertsOpen(false)} className="text-ink-muted hover:text-ink">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-ink-muted">
              Get a desktop alert for approvals, questions, and issues that need your attention.
            </p>
            <div className="space-y-4">
              <AlertToggle
                label="Desktop alerts"
                description="This browser has not allowed alerts yet."
                value={alertDesktop}
                onChange={setAlertDesktop}
              />
              <AlertToggle
                label="Only when I'm away"
                description="Skip alerts while you're active in Cofounder."
                value={alertAway}
                onChange={setAlertAway}
              />
              <AlertToggle
                label="Hide task details"
                description="Alerts will say an agent needs you without showing task names."
                value={alertHideDetails}
                onChange={setAlertHideDetails}
              />
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Browser permission is local to this browser. Cofounder keeps its own alert setting separate, so you can turn alerts off here without changing site permissions.
            </p>
            <div className="flex justify-end">
              <button type="button" onClick={() => setAlertsOpen(false)} className="text-sm text-ink-muted hover:text-ink">
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-center toolbar */}
      {hasPlan && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-2 z-10">
          {isOrgRoot && (
            <>
              <RecentCard tint="bg-cream" />
              <RecentCard tint="bg-mustard/30" />
            </>
          )}
          <div className="relative">
            <button
              type="button"
              aria-label="New"
              title="Create agent or task"
              onClick={() => setMenuOpen((v) => !v)}
              className="size-9 rounded-md bg-ink text-paper inline-flex items-center justify-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.25)]"
            >
              <Plus className="size-4" />
            </button>
            {menuOpen && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-44 rounded-lg bg-ink text-paper border border-ink shadow-lg overflow-hidden">
                <MenuItem icon={<UserRound className="size-3.5" />} label="New Agent" sub="Employee you can give tasks to" />
                <MenuItem icon={<ClipboardList className="size-3.5" />} label="New Task" sub="Work to assign your agents" />
              </div>
            )}
          </div>
        </div>
      )}

      {hasPlan && (
        <Link
          href={`/${orgSlug}/review`}
          aria-label="Attention queue"
          title="Items waiting for your review (⌘.)"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper pl-2 pr-3 py-1.5 text-xs hover:opacity-90 z-20 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.35)]"
        >
          <Eye className="size-3.5" />
          <span>Review</span>
        </Link>
      )}
    </main>
  );
}

function InboxItem({
  item,
  onMarkRead,
}: {
  item: { id: string; title: string; agent: string; action: string; time: string; read: boolean };
  onMarkRead: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [remindTooltip, setRemindTooltip] = useState(false);
  const [readTooltip, setReadTooltip] = useState(false);

  return (
    <li
      className="flex items-start gap-3 px-4 py-3 hover:bg-canvas/60 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setRemindTooltip(false); setReadTooltip(false); }}
    >
      <span className={`mt-1.5 size-2 rounded-full shrink-0 ${item.read ? "bg-transparent" : "bg-blue-500"}`} />
      <AgentPixelAvatar />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold truncate">{item.title}</span>
          <span className="text-xs text-ink-muted shrink-0">{item.time}</span>
        </div>
        <div className="text-sm text-ink-muted">{item.agent} {item.action}</div>
      </div>

      {hovered && (
        <div className="absolute right-4 bottom-2.5 flex items-center gap-1">
          <div className="relative">
            {remindTooltip && (
              <div className="absolute bottom-full mb-1 right-0 bg-ink text-paper text-xs rounded-md px-2 py-1 whitespace-nowrap">
                Remind in one hour
              </div>
            )}
            <button
              type="button"
              aria-label="Remind in one hour"
              onMouseEnter={() => setRemindTooltip(true)}
              onMouseLeave={() => setRemindTooltip(false)}
              className="size-6 rounded-md border border-line/70 bg-paper inline-flex items-center justify-center hover:border-line-strong text-ink-muted hover:text-ink"
            >
              <Clock className="size-3" />
            </button>
          </div>
          <div className="relative">
            {readTooltip && (
              <div className="absolute bottom-full mb-1 right-0 bg-ink text-paper text-xs rounded-md px-2 py-1 whitespace-nowrap">
                Mark as read
              </div>
            )}
            <button
              type="button"
              aria-label="Mark as read"
              onMouseEnter={() => setReadTooltip(true)}
              onMouseLeave={() => setReadTooltip(false)}
              onClick={onMarkRead}
              className="size-6 rounded-md border border-line/70 bg-paper inline-flex items-center justify-center hover:border-line-strong text-ink-muted hover:text-ink"
            >
              <EyeOff className="size-3" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function AgentPixelAvatar() {
  const pixels = [
    [0,0,1,1,0,0],
    [0,1,1,1,1,0],
    [1,1,0,0,1,1],
    [1,1,1,1,1,1],
    [0,1,0,0,1,0],
    [0,1,1,1,1,0],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 3px)",
        gridTemplateRows: "repeat(6, 3px)",
        gap: "0.5px",
        width: 20,
        height: 20,
      }}
    >
      {pixels.flat().map((v, i) => (
        <div
          key={i}
          style={{ background: v ? "#4f6ef7" : "transparent", borderRadius: "0.5px" }}
        />
      ))}
    </div>
  );
}

function AlertToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-ink-muted">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors relative ${value ? "bg-ink" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-paper shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

function RecentCard({ tint }: { tint: string }) {
  return (
    <div className="w-12 h-9 rounded-md bg-paper border border-line/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className={`h-1.5 ${tint}`} />
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
      className="w-full text-left flex items-start gap-2 px-3 py-2 hover:bg-ink/80 transition-colors"
    >
      <span className="mt-0.5 text-paper/60">{icon}</span>
      <span className="leading-tight">
        <span className="block text-sm text-paper">{label}</span>
        <span className="block text-2xs text-paper/60">{sub}</span>
      </span>
    </button>
  );
}
