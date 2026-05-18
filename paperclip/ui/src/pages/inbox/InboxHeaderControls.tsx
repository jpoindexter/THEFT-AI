import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { Check, Layers, ListTree, Search } from "lucide-react";
import { IssueColumnPicker } from "../../components/IssueColumns";
import { IssueFiltersPopover } from "../../components/IssueFiltersPopover";
import { PageTabBar } from "../../components/PageTabBar";
import { shouldBlurPageSearchOnEnter, shouldBlurPageSearchOnEscape } from "../../lib/keyboardShortcuts";
import type {
  InboxApprovalFilter,
  InboxCategoryFilter,
  InboxIssueColumn,
  InboxTab,
  InboxWorkItemGroupBy,
} from "../../lib/inbox";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { InboxMarkAllReadDialog } from "./InboxMarkAllReadDialog";

type FilterProps = ComponentProps<typeof IssueFiltersPopover>;

export function InboxHeaderControls({
  activeIssueFilterCount,
  agents,
  allApprovalFilter,
  allCategoryFilter,
  availableIssueColumns,
  canMarkAllRead,
  creators,
  currentUserId,
  enableWorkspaceGrouping,
  groupBy,
  issueFilters,
  labels,
  markAllReadPending,
  nestingEnabled,
  onCategoryFilterChange,
  onApprovalFilterChange,
  onGroupByChange,
  onIssueFiltersChange,
  onMarkAllRead,
  onNavigateTab,
  onResetColumns,
  onToggleColumn,
  onToggleNesting,
  projects,
  searchQuery,
  setSearchQuery,
  setShowMarkAllReadConfirm,
  showApprovalsCategory,
  showMarkAllReadConfirm,
  tab,
  unreadIssueIds,
  visibleIssueColumnSet,
  workspaces,
}: {
  activeIssueFilterCount: number;
  agents: FilterProps["agents"];
  allApprovalFilter: InboxApprovalFilter;
  allCategoryFilter: InboxCategoryFilter;
  availableIssueColumns: InboxIssueColumn[];
  canMarkAllRead: boolean;
  creators: FilterProps["creators"];
  currentUserId: string | null;
  enableWorkspaceGrouping: boolean;
  groupBy: InboxWorkItemGroupBy;
  issueFilters: FilterProps["state"];
  labels: FilterProps["labels"];
  markAllReadPending: boolean;
  nestingEnabled: boolean;
  onCategoryFilterChange: (value: InboxCategoryFilter) => void;
  onApprovalFilterChange: (value: InboxApprovalFilter) => void;
  onGroupByChange: (value: InboxWorkItemGroupBy) => void;
  onIssueFiltersChange: FilterProps["onChange"];
  onMarkAllRead: () => void;
  onNavigateTab: (value: InboxTab) => void;
  onResetColumns: () => void;
  onToggleColumn: (column: InboxIssueColumn, enabled: boolean) => void;
  onToggleNesting: () => void;
  projects: FilterProps["projects"];
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setShowMarkAllReadConfirm: Dispatch<SetStateAction<boolean>>;
  showApprovalsCategory: boolean;
  showMarkAllReadConfirm: boolean;
  tab: InboxTab;
  unreadIssueIds: string[];
  visibleIssueColumnSet: Set<InboxIssueColumn>;
  workspaces: FilterProps["workspaces"];
}) {
  return (
    <div className="space-y-2">
      <div className="relative sm:hidden">
        <InboxSearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} className="h-8 w-full pl-8 text-xs" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(value) => onNavigateTab(value as InboxTab)}>
          <PageTabBar items={[{ value: "mine", label: "Mine" }, { value: "recent", label: "Recent" }, { value: "unread", label: "Unread" }, { value: "all", label: "All" }]} />
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <InboxSearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} className="h-8 w-56 pl-8 text-xs" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("hidden h-8 w-8 shrink-0 sm:inline-flex", nestingEnabled && "bg-accent")}
            onClick={onToggleNesting}
            title={nestingEnabled ? "Disable parent-child nesting" : "Enable parent-child nesting"}
          >
            <ListTree className="h-3.5 w-3.5" />
          </Button>
          <IssueFiltersPopover
            state={issueFilters}
            onChange={onIssueFiltersChange}
            activeFilterCount={activeIssueFilterCount}
            agents={agents}
            creators={creators}
            projects={projects}
            labels={labels}
            currentUserId={currentUserId}
            enableRoutineVisibilityFilter
            buttonVariant="outline"
            iconOnly
            workspaces={workspaces}
          />
          <GroupByPopover
            groupBy={groupBy}
            isolatedWorkspacesEnabled={enableWorkspaceGrouping}
            onChange={onGroupByChange}
          />
          <IssueColumnPicker
            availableColumns={availableIssueColumns}
            visibleColumnSet={visibleIssueColumnSet}
            onToggleColumn={onToggleColumn}
            onResetColumns={onResetColumns}
            title="Choose which inbox columns stay visible"
            iconOnly
          />
          {canMarkAllRead ? (
            <InboxMarkAllReadDialog
              pending={markAllReadPending}
              showConfirm={showMarkAllReadConfirm}
              unreadCount={unreadIssueIds.length}
              setShowConfirm={setShowMarkAllReadConfirm}
              onConfirm={onMarkAllRead}
            />
          ) : null}
        </div>
      </div>
      {tab === "all" ? (
        <InboxAllFilters
          allApprovalFilter={allApprovalFilter}
          allCategoryFilter={allCategoryFilter}
          showApprovalsCategory={showApprovalsCategory}
          onCategoryFilterChange={onCategoryFilterChange}
          onApprovalFilterChange={onApprovalFilterChange}
        />
      ) : null}
    </div>
  );
}

function InboxSearchInput({ searchQuery, setSearchQuery, className }: {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  className: string;
}) {
  return (
    <>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search inbox…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (shouldBlurPageSearchOnEnter({ key: e.key, isComposing: e.nativeEvent.isComposing })) {
            e.currentTarget.blur();
            return;
          }
          if (shouldBlurPageSearchOnEscape({ key: e.key, isComposing: e.nativeEvent.isComposing, currentValue: e.currentTarget.value })) {
            e.currentTarget.blur();
          }
        }}
        className={className}
        data-page-search-target="true"
      />
    </>
  );
}

function GroupByPopover({ groupBy, isolatedWorkspacesEnabled, onChange }: {
  groupBy: InboxWorkItemGroupBy;
  isolatedWorkspacesEnabled: boolean;
  onChange: (value: InboxWorkItemGroupBy) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className={cn("h-8 w-8 shrink-0", groupBy !== "none" && "bg-accent")} title="Group">
          <Layers className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-2">
        <div className="space-y-0.5">
          {([
            ["none", "None"],
            ["type", "Type"],
            ["assignee", "Assignee"],
            ["project", "Project"],
            ...(isolatedWorkspacesEnabled ? ([["workspace", "Workspace"]] as const) : []),
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-auto w-full justify-between rounded-sm px-2 py-1.5 text-sm", groupBy === value ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:bg-accent/50")}
              onClick={() => onChange(value)}
            >
              <span>{label}</span>
              {groupBy === value ? <Check className="h-3.5 w-3.5" /> : null}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function InboxAllFilters({
  allApprovalFilter,
  allCategoryFilter,
  showApprovalsCategory,
  onCategoryFilterChange,
  onApprovalFilterChange,
}: {
  allApprovalFilter: InboxApprovalFilter;
  allCategoryFilter: InboxCategoryFilter;
  showApprovalsCategory: boolean;
  onCategoryFilterChange: (value: InboxCategoryFilter) => void;
  onApprovalFilterChange: (value: InboxApprovalFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={allCategoryFilter} onValueChange={(value) => onCategoryFilterChange(value as InboxCategoryFilter)}>
        <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="everything">All categories</SelectItem>
          <SelectItem value="issues_i_touched">My recent issues</SelectItem>
          <SelectItem value="join_requests">Join requests</SelectItem>
          <SelectItem value="approvals">Approvals</SelectItem>
          <SelectItem value="failed_runs">Failed runs</SelectItem>
          <SelectItem value="alerts">Alerts</SelectItem>
        </SelectContent>
      </Select>
      {showApprovalsCategory ? (
        <Select value={allApprovalFilter} onValueChange={(value) => onApprovalFilterChange(value as InboxApprovalFilter)}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Approval status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All approval statuses</SelectItem>
            <SelectItem value="actionable">Needs action</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
