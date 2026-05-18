import type { ComponentProps } from "react";
import { Inbox as InboxIcon, Search } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { PageSkeleton } from "../../components/PageSkeleton";
import { InboxAlertsSection } from "./InboxAlertsSection";
import { InboxHeaderControls } from "./InboxHeaderControls";
import { InboxWorkItemsSection } from "./InboxWorkItemsSection";
import { ReviewModePanel } from "./ReviewModePanel";
import type { InboxTab } from "../../lib/inbox";

type SectionKey = "work_items" | "alerts";

export function InboxPageContent({
  actionError,
  alerts,
  allLoaded,
  approvalsError,
  headerProps,
  reviewProps,
  searchQuery,
  tab,
  visibleSections,
  workItemsProps,
}: {
  actionError: string | null;
  alerts: Omit<ComponentProps<typeof InboxAlertsSection>, "showSeparator"> & { visible: boolean };
  allLoaded: boolean;
  approvalsError: Error | null;
  headerProps: ComponentProps<typeof InboxHeaderControls>;
  reviewProps: ComponentProps<typeof ReviewModePanel>;
  searchQuery: string;
  tab: InboxTab;
  visibleSections: SectionKey[];
  workItemsProps: ComponentProps<typeof InboxWorkItemsSection> | null;
}) {
  const showSeparatorBefore = (key: SectionKey) => visibleSections.indexOf(key) > 0;

  return (
    <div className="space-y-6">
      <ReviewModePanel {...reviewProps} />
      <InboxHeaderControls {...headerProps} />

      {approvalsError ? <p className="text-sm text-destructive">{approvalsError.message}</p> : null}
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

      {!allLoaded && visibleSections.length === 0 ? <PageSkeleton variant="inbox" /> : null}
      {allLoaded && visibleSections.length === 0 ? (
        <EmptyState icon={searchQuery.trim() ? Search : InboxIcon} message={emptyMessage(searchQuery, tab)} />
      ) : null}

      {workItemsProps ? <InboxWorkItemsSection {...workItemsProps} showSeparator={showSeparatorBefore("work_items")} /> : null}
      {alerts.visible ? <InboxAlertsSection {...alerts} showSeparator={showSeparatorBefore("alerts")} /> : null}
    </div>
  );
}

function emptyMessage(searchQuery: string, tab: InboxTab): string {
  if (searchQuery.trim()) return "No inbox items match your search.";
  if (tab === "mine") return "Inbox zero.";
  if (tab === "unread") return "No new inbox items.";
  if (tab === "recent") return "No recent inbox items.";
  return "No inbox items match these filters.";
}
