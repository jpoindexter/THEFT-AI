/**
 * Canonical status & priority color definitions.
 *
 * Every component that renders a status indicator (StatusIcon, StatusBadge,
 * agent status dots, etc.) should import from here so colors stay consistent.
 */

// ---------------------------------------------------------------------------
// Issue status colors
// ---------------------------------------------------------------------------

/** StatusIcon circle: text + border classes */
export const issueStatusIcon: Record<string, string> = {
  backlog: "text-muted-foreground border-muted-foreground",
  todo: "text-muted-foreground border-muted-foreground",
  in_progress: "text-foreground border-foreground",
  in_review: "text-foreground border-foreground",
  done: "text-foreground border-foreground",
  cancelled: "text-neutral-500 border-neutral-500",
  blocked: "text-foreground border-foreground",
};

export const issueStatusIconDefault = "text-muted-foreground border-muted-foreground";

/** Text-only color for issue statuses (dropdowns, labels) */
export const issueStatusText: Record<string, string> = {
  backlog: "text-muted-foreground",
  todo: "text-muted-foreground",
  in_progress: "text-foreground",
  in_review: "text-foreground",
  done: "text-foreground",
  cancelled: "text-neutral-500",
  blocked: "text-foreground",
};

export const issueStatusTextDefault = "text-muted-foreground";

// ---------------------------------------------------------------------------
// Badge colors — used by StatusBadge for all entity types
// ---------------------------------------------------------------------------

export const statusBadge: Record<string, string> = {
  // Agent statuses
  active: "bg-foreground text-background",
  running: "bg-foreground text-background",
  scheduled_retry: "bg-muted text-foreground",
  paused: "bg-muted text-foreground",
  idle: "bg-muted text-foreground",
  archived: "bg-muted text-muted-foreground",

  // Goal statuses
  planned: "bg-muted text-muted-foreground",
  achieved: "bg-foreground text-background",
  completed: "bg-foreground text-background",

  // Run statuses
  failed: "bg-foreground text-background",
  timed_out: "bg-muted text-foreground",
  succeeded: "bg-foreground text-background",
  ok: "bg-foreground text-background",
  warning: "bg-muted text-foreground",
  error: "bg-foreground text-background",
  info: "bg-muted text-foreground",
  terminated: "bg-foreground text-background",
  pending: "bg-muted text-foreground",

  // Approval statuses
  pending_approval: "bg-muted text-foreground",
  revision_requested: "bg-muted text-foreground",
  approved: "bg-foreground text-background",
  rejected: "bg-foreground text-background",

  // Issue statuses — consistent hues with issueStatusIcon above
  backlog: "bg-muted text-muted-foreground",
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-foreground text-background",
  in_review: "bg-foreground text-background",
  blocked: "bg-foreground text-background",
  done: "bg-foreground text-background",
  cancelled: "bg-muted text-muted-foreground",
};

export const statusBadgeDefault = "bg-muted text-muted-foreground";

// ---------------------------------------------------------------------------
// Agent status dot — solid background for small indicator dots
// ---------------------------------------------------------------------------

export const agentStatusDot: Record<string, string> = {
  running: "bg-foreground animate-pulse",
  active: "bg-foreground",
  paused: "bg-muted-foreground",
  idle: "bg-muted-foreground",
  pending_approval: "bg-muted-foreground",
  error: "bg-foreground",
  archived: "bg-neutral-400",
};

export const agentStatusDotDefault = "bg-neutral-400";

// ---------------------------------------------------------------------------
// Priority colors
// ---------------------------------------------------------------------------

export const priorityColor: Record<string, string> = {
  critical: "text-foreground",
  high: "text-foreground",
  medium: "text-muted-foreground",
  low: "text-muted-foreground",
};

export const priorityColorDefault = "text-muted-foreground";
