import {
  Inbox,
  Activity,
  Bot,
  CircleDot,
  Target,
  LayoutDashboard,
  Building2,
  Search,
  SquarePen,
  Network,
  Boxes,
  GitBranch,
  Settings,
  Library,
  Cpu,
  Repeat2,
  WalletCards,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SidebarNavItem } from "./SidebarNavItem";
import { useDialogActions } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { heartbeatsApi } from "../api/heartbeats";
import { instanceSettingsApi } from "../api/instanceSettings";
import { queryKeys } from "../lib/queryKeys";
import { useInboxBadge } from "../hooks/useInboxBadge";
import { Button } from "@/components/ui/button";
import { PluginSlotOutlet } from "@/plugins/slots";
import { SidebarCompanyMenu } from "./SidebarCompanyMenu";

export const THEFT_SYSTEM_NAV_ITEMS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "/org", label: "Company Map", icon: Network },
  { to: "/agents/all", label: "Agent Runtime", icon: Bot },
  { to: "/projects", label: "Workstreams", icon: GitBranch },
  { to: "/skills", label: "Skill Library", icon: Boxes },
  { to: "/instance/settings/adapters", label: "Model Adapters", icon: Cpu },
  { to: "/routines", label: "Routines", icon: Repeat2 },
  { to: "/costs", label: "Runtime Usage", icon: WalletCards },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/company/settings", label: "Settings", icon: Settings },
];

export const THEFT_SYSTEM_ENTRY = {
  to: "/agents/all",
  label: "System",
  icon: SlidersHorizontal,
};

export function Sidebar() {
  const { openNewIssue } = useDialogActions();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const inboxBadge = useInboxBadge(selectedCompanyId);
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });
  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 10_000,
  });
  const liveRunCount = liveRuns?.length ?? 0;
  const showWorkspacesLink = experimentalSettings?.enableIsolatedWorkspaces === true;

  function openSearch() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }

  const pluginContext = {
    companyId: selectedCompanyId,
    companyPrefix: selectedCompany?.issuePrefix ?? null,
  };

  return (
    <aside className="w-full h-full min-h-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col items-center">
      <div className="flex h-[4.5rem] shrink-0 flex-col items-center justify-center gap-1.5 border-b border-sidebar-border px-2">
        <SidebarCompanyMenu compact />
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={openSearch}
          title="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col items-center justify-between gap-3 overflow-hidden px-2 py-3">
        <div className="flex flex-col items-center gap-1">
          <SidebarNavItem to="/dashboard" label="Mission Control" icon={LayoutDashboard} liveCount={liveRunCount} />
          <SidebarNavItem to="/issues" label="Tasks" icon={CircleDot} badge={inboxBadge.inbox} badgeTone={inboxBadge.failedRuns > 0 ? "danger" : "default"} alert={inboxBadge.failedRuns > 0} />
          <SidebarNavItem to="/library" label="Library" icon={Library} />
          <SidebarNavItem to="/goals" label="Tech Tree" icon={Target} />
          <SidebarNavItem to="/departments/engineering" label="Departments" icon={Building2} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => openNewIssue()}
            title="New task"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <SquarePen className="h-5 w-5 shrink-0" />
            <span className="sr-only">New task</span>
          </button>
          <SidebarNavItem to="/inbox" label="Attention" icon={Inbox} />
          {showWorkspacesLink ? (
            <SidebarNavItem to="/workspaces" label="Workspaces" icon={GitBranch} />
          ) : null}
          <SidebarNavItem to={THEFT_SYSTEM_ENTRY.to} label={THEFT_SYSTEM_ENTRY.label} icon={THEFT_SYSTEM_ENTRY.icon} />
          <PluginSlotOutlet
            slotTypes={["sidebar"]}
            context={pluginContext}
            className="flex flex-col items-center gap-1"
            itemClassName="text-[13px] font-medium"
            missingBehavior="placeholder"
          />
          <PluginSlotOutlet
            slotTypes={["sidebarPanel"]}
            context={pluginContext}
            className="hidden"
            itemClassName="hidden"
            missingBehavior="placeholder"
          />
        </div>
      </nav>
    </aside>
  );
}
