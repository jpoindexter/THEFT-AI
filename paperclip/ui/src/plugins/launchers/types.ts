import type {
  PluginLauncherBounds,
  PluginLauncherDeclaration,
  PluginLauncherPlacementZone,
  PluginUiSlotEntityType,
} from "@paperclipai/shared";
import type { PluginUiContribution } from "@/api/plugins";
import type {
  PluginModalBoundsRequest,
  PluginRenderCloseEvent,
  PluginRenderCloseHandler,
} from "../bridge";
import type { RegisteredPluginComponent } from "../slots";

export type PluginLauncherContext = {
  companyId?: string | null;
  companyPrefix?: string | null;
  projectId?: string | null;
  projectRef?: string | null;
  entityId?: string | null;
  entityType?: PluginUiSlotEntityType | null;
};

export type ResolvedPluginLauncher = PluginLauncherDeclaration & {
  pluginId: string;
  pluginKey: string;
  pluginDisplayName: string;
  pluginVersion: string;
  uiEntryFile: string;
};

export type UsePluginLaunchersFilters = {
  placementZones: PluginLauncherPlacementZone[];
  entityType?: PluginUiSlotEntityType | null;
  companyId?: string | null;
  enabled?: boolean;
};

export type UsePluginLaunchersResult = {
  launchers: ResolvedPluginLauncher[];
  contributionsByPluginId: Map<string, PluginUiContribution>;
  isLoading: boolean;
  errorMessage: string | null;
};

export type PluginLauncherRuntimeContextValue = {
  activateLauncher(
    launcher: ResolvedPluginLauncher,
    hostContext: PluginLauncherContext,
    contribution: PluginUiContribution,
    sourceEl?: HTMLElement | null,
  ): Promise<void>;
};

export type LauncherInstance = {
  key: string;
  launcher: ResolvedPluginLauncher;
  hostContext: PluginLauncherContext;
  contribution: PluginUiContribution;
  component: RegisteredPluginComponent | null;
  sourceElement: HTMLElement | null;
  sourceRect: DOMRect | null;
  bounds: PluginLauncherBounds | null;
  beforeCloseHandlers: Set<PluginRenderCloseHandler>;
  closeHandlers: Set<PluginRenderCloseHandler>;
};

export type LauncherModalShellProps = {
  instance: LauncherInstance;
  stackIndex: number;
  isTopmost: boolean;
  requestBounds: (key: string, request: PluginModalBoundsRequest) => Promise<void>;
  closeLauncher: (key: string, event: PluginRenderCloseEvent) => Promise<void>;
};
