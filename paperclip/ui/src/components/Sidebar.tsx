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
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SidebarSection } from "./SidebarSection";
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
    <aside className="w-full h-full min-h-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Top bar: Company name (bold) + Search — aligned with top sections (no visible border) */}
      <div className="flex items-center gap-1 px-3 h-12 shrink-0">
        <SidebarCompanyMenu />
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={openSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide flex flex-col gap-4 px-3 py-2">
        <div className="flex flex-col gap-0.5">
          {/* New task button aligned with nav items */}
          <button
            onClick={() => openNewIssue()}
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <SquarePen className="h-4 w-4 shrink-0" />
            <span className="truncate">Ask Operator</span>
          </button>
          <SidebarNavItem to="/dashboard" label="Command Center" icon={LayoutDashboard} liveCount={liveRunCount} />
          <SidebarNavItem
            to="/inbox"
            label="Attention"
            icon={Inbox}
            badge={inboxBadge.inbox}
            badgeTone={inboxBadge.failedRuns > 0 ? "danger" : "default"}
            alert={inboxBadge.failedRuns > 0}
          />
          <PluginSlotOutlet
            slotTypes={["sidebar"]}
            context={pluginContext}
            className="flex flex-col gap-0.5"
            itemClassName="text-[13px] font-medium"
            missingBehavior="placeholder"
          />
        </div>

        <SidebarSection label="Work">
          <SidebarNavItem to="/departments/engineering" label="Departments" icon={Building2} />
          <SidebarNavItem to="/issues" label="Task Review" icon={CircleDot} />
          <SidebarNavItem to="/library" label="Company Memory" icon={Library} />
          <SidebarNavItem to="/search" label="Search" icon={Search} />
          <SidebarNavItem to="/goals" label="Tech Tree" icon={Target} />
          {showWorkspacesLink ? (
            <SidebarNavItem to="/workspaces" label="Workspaces" icon={GitBranch} />
          ) : null}
        </SidebarSection>

        <SidebarSection label="System">
          {THEFT_SYSTEM_NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}
        </SidebarSection>

        <PluginSlotOutlet
          slotTypes={["sidebarPanel"]}
          context={pluginContext}
          className="flex flex-col gap-3"
          itemClassName="rounded-lg border border-border p-3"
          missingBehavior="placeholder"
        />
      </nav>
    </aside>
  );
}
