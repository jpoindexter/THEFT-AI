import { NavLink } from "@/lib/router";
import { SIDEBAR_SCROLL_RESET_STATE } from "../lib/navigation-scroll";
import { cn } from "../lib/utils";
import { useSidebar } from "../context/SidebarContext";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  className?: string;
  badge?: number;
  badgeTone?: "default" | "danger";
  textBadge?: string;
  textBadgeTone?: "default" | "amber";
  alert?: boolean;
  liveCount?: number;
}

export function SidebarNavItem({
  to,
  label,
  icon: Icon,
  end,
  className,
  badge,
  badgeTone = "default",
  textBadge,
  textBadgeTone = "default",
  alert = false,
  liveCount,
}: SidebarNavItemProps) {
  const { isMobile, setSidebarOpen } = useSidebar();

  return (
    <NavLink
      to={to}
      state={SIDEBAR_SCROLL_RESET_STATE}
      end={end}
      onClick={() => { if (isMobile) setSidebarOpen(false); }}
      title={label}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-2.5 rounded-full text-[13px] font-medium transition-colors",
          isMobile ? "px-3 py-2" : "h-10 w-10 justify-center px-0 py-0",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          className,
        )
      }
    >
      {({ isActive }) => (
        <>
      {isActive && !isMobile ? <span className="absolute -right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden /> : null}
      <span className="relative shrink-0">
        <Icon className="h-5 w-5" />
        {alert && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_2px_hsl(var(--background))]" />
        )}
      </span>
      <span className={cn("flex-1 truncate", !isMobile && "sr-only")}>{label}</span>
      {textBadge && (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
            textBadgeTone === "amber"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {textBadge}
        </span>
      )}
      {liveCount != null && liveCount > 0 && (
        <span className={cn("ml-auto flex items-center gap-1.5", !isMobile && "absolute -right-1 -top-1 ml-0")}>
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className={cn("text-[11px] font-medium text-blue-600 dark:text-blue-400", !isMobile && "sr-only")}>{liveCount} live</span>
        </span>
      )}
      {badge != null && badge > 0 && (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-xs leading-none",
            !isMobile && "absolute -right-1 -top-1 ml-0",
            badgeTone === "danger"
              ? "bg-red-600/90 text-red-50"
              : "bg-primary text-primary-foreground",
          )}
        >
          {badge}
        </span>
      )}
        </>
      )}
    </NavLink>
  );
}
