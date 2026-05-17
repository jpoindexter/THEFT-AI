import type { ReactNode } from "react";
import type { DeploymentMode } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { CompanySettingsSidebar } from "../CompanySettingsSidebar";
import { InstanceSidebar } from "../InstanceSidebar";
import { ResizableSidebarPane } from "../ResizableSidebarPane";
import { SidebarAccountMenu } from "../SidebarAccountMenu";
import { cn } from "../../lib/utils";

type SidebarContentProps = {
  companySidebar: ReactNode;
  isCompanySettingsRoute: boolean;
  isInstanceSettingsRoute: boolean;
};

type SidebarShellProps = SidebarContentProps & {
  deploymentMode?: DeploymentMode;
  instanceSettingsTarget: string;
  sidebarOpen: boolean;
  version?: string | null;
};

type MobileSidebarShellProps = SidebarShellProps & {
  setSidebarOpen: (open: boolean) => void;
};

function SidebarContent({
  companySidebar,
  isCompanySettingsRoute,
  isInstanceSettingsRoute,
}: SidebarContentProps) {
  if (isInstanceSettingsRoute) return <InstanceSidebar />;
  if (isCompanySettingsRoute) return <CompanySettingsSidebar />;
  return <>{companySidebar}</>;
}

export function MobileSidebarShell({
  companySidebar,
  deploymentMode,
  instanceSettingsTarget,
  isCompanySettingsRoute,
  isInstanceSettingsRoute,
  setSidebarOpen,
  sidebarOpen,
  version,
}: MobileSidebarShellProps) {
  return (
    <>
      {sidebarOpen && (
        <Button
          type="button"
          variant="ghost"
          className="fixed inset-0 z-40 h-auto w-auto rounded-sm bg-black/50 p-0 hover:bg-black/50"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden pt-[env(safe-area-inset-top)] transition-transform duration-100 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-60 shrink-0 overflow-hidden">
            <SidebarContent
              companySidebar={companySidebar}
              isCompanySettingsRoute={isCompanySettingsRoute}
              isInstanceSettingsRoute={isInstanceSettingsRoute}
            />
          </div>
        </div>
        <SidebarAccountMenu
          deploymentMode={deploymentMode}
          instanceSettingsTarget={instanceSettingsTarget}
          version={version}
        />
      </div>
    </>
  );
}

export function DesktopSidebarShell({
  companySidebar,
  deploymentMode,
  instanceSettingsTarget,
  isCompanySettingsRoute,
  isInstanceSettingsRoute,
  sidebarOpen,
  version,
}: SidebarShellProps) {
  return (
    <div className="flex h-full flex-col shrink-0">
      <div className="flex flex-1 min-h-0">
        <ResizableSidebarPane
          open={sidebarOpen}
          resizable={false}
          storageKey="theft.sana.sidebar.width"
          defaultWidth={56}
          minWidth={56}
          maxWidth={56}
          className="h-full shrink-0"
        >
          <SidebarContent
            companySidebar={companySidebar}
            isCompanySettingsRoute={isCompanySettingsRoute}
            isInstanceSettingsRoute={isInstanceSettingsRoute}
          />
        </ResizableSidebarPane>
      </div>
      <SidebarAccountMenu
        deploymentMode={deploymentMode}
        instanceSettingsTarget={instanceSettingsTarget}
        version={version}
      />
    </div>
  );
}
