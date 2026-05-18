import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import type { PluginLauncherPlacementZone, PluginUiSlotEntityType } from "@paperclipai/shared";
import { pluginsApi, type PluginUiContribution } from "@/api/plugins";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import type {
  PluginModalBoundsRequest,
  PluginRenderCloseEvent,
} from "./bridge";
import { LauncherModalShell } from "./launchers/LauncherModalShell";
import type {
  LauncherInstance,
  PluginLauncherContext,
  PluginLauncherRuntimeContextValue,
  ResolvedPluginLauncher,
} from "./launchers/types";
import { isPluginLauncherBounds, launcherTriggerClassName, resolveLauncherComponent } from "./launchers/utils";
import { usePluginLaunchers } from "./launchers/usePluginLaunchers";

export type {
  PluginLauncherContext,
  ResolvedPluginLauncher,
  UsePluginLaunchersFilters,
  UsePluginLaunchersResult,
} from "./launchers/types";
export { usePluginLaunchers } from "./launchers/usePluginLaunchers";

const PluginLauncherRuntimeContext = createContext<PluginLauncherRuntimeContextValue | null>(null);

export function PluginLauncherProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<LauncherInstance[]>([]);
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const location = useLocation();
  const navigate = useNavigate();

  const closeLauncher = useCallback(
    async (key: string, event: PluginRenderCloseEvent) => {
      const instance = stackRef.current.find((entry) => entry.key === key);
      if (!instance) return;

      for (const handler of [...instance.beforeCloseHandlers]) {
        await handler(event);
      }

      setStack((current) => current.filter((entry) => entry.key !== key));

      queueMicrotask(() => {
        for (const handler of [...instance.closeHandlers]) {
          void handler(event);
        }
        if (instance.sourceElement && document.contains(instance.sourceElement)) {
          instance.sourceElement.focus();
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (stack.length === 0) return;
    void Promise.all(
      stack.map((entry) => closeLauncher(entry.key, { reason: "hostNavigation" })),
    );
    // Only react to navigation changes, not stack churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const requestBounds = useCallback(
    async (key: string, request: PluginModalBoundsRequest) => {
      if (!isPluginLauncherBounds(request.bounds)) return;
      setStack((current) =>
        current.map((entry) =>
          entry.key === key
            ? { ...entry, bounds: request.bounds }
            : entry,
        ),
      );
    },
    [],
  );

  const activateLauncher = useCallback(
    async (
      launcher: ResolvedPluginLauncher,
      hostContext: PluginLauncherContext,
      contribution: PluginUiContribution,
      sourceEl?: HTMLElement | null,
    ) => {
      switch (launcher.action.type) {
        case "navigate":
          navigate(launcher.action.target);
          return;
        case "deepLink":
          if (/^https?:\/\//.test(launcher.action.target)) {
            window.open(launcher.action.target, "_blank", "noopener,noreferrer");
          } else {
            navigate(launcher.action.target);
          }
          return;
        case "performAction":
          await pluginsApi.bridgePerformAction(
            launcher.pluginId,
            launcher.action.target,
            launcher.action.params,
            hostContext.companyId ?? null,
          );
          return;
        case "openModal":
        case "openDrawer":
        case "openPopover": {
          const component = await resolveLauncherComponent(contribution, launcher);
          const sourceRect = sourceEl?.getBoundingClientRect() ?? null;
          const nextEntry: LauncherInstance = {
            key: `${launcher.pluginId}:${launcher.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            launcher,
            hostContext,
            contribution,
            component,
            sourceElement: sourceEl ?? null,
            sourceRect,
            bounds: launcher.render?.bounds ?? "default",
            beforeCloseHandlers: new Set(),
            closeHandlers: new Set(),
          };
          setStack((current) => [...current, nextEntry]);
          return;
        }
      }
    },
    [navigate],
  );

  const value = useMemo<PluginLauncherRuntimeContextValue>(
    () => ({ activateLauncher }),
    [activateLauncher],
  );

  return (
    <PluginLauncherRuntimeContext.Provider value={value}>
      {children}
      {stack.map((instance, index) => (
        <LauncherModalShell
          key={instance.key}
          instance={instance}
          stackIndex={index}
          isTopmost={index === stack.length - 1}
          requestBounds={requestBounds}
          closeLauncher={closeLauncher}
        />
      ))}
    </PluginLauncherRuntimeContext.Provider>
  );
}

export function usePluginLauncherRuntime(): PluginLauncherRuntimeContextValue {
  const value = useContext(PluginLauncherRuntimeContext);
  if (!value) {
    throw new Error("usePluginLauncherRuntime must be used within PluginLauncherProvider");
  }
  return value;
}

function DefaultLauncherTrigger({
  launcher,
  placementZone,
  onClick,
}: {
  launcher: ResolvedPluginLauncher;
  placementZone: PluginLauncherPlacementZone;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button
      type="button"
      variant={placementZone === "toolbarButton" || placementZone === "globalToolbarButton" ? "outline" : "ghost"}
      size="sm"
      className={launcherTriggerClassName(placementZone)}
      onClick={onClick}
    >
      {launcher.displayName}
    </Button>
  );
}

type PluginLauncherOutletProps = {
  placementZones: PluginLauncherPlacementZone[];
  context: PluginLauncherContext;
  entityType?: PluginUiSlotEntityType | null;
  className?: string;
  itemClassName?: string;
  errorClassName?: string;
};

export function PluginLauncherOutlet({
  placementZones,
  context,
  entityType,
  className,
  itemClassName,
  errorClassName,
}: PluginLauncherOutletProps) {
  const { activateLauncher } = usePluginLauncherRuntime();
  const { launchers, contributionsByPluginId, errorMessage } = usePluginLaunchers({
    placementZones,
    entityType,
    companyId: context.companyId,
    enabled: !!context.companyId,
  });

  if (errorMessage) {
    return (
      <div className={cn("rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive", errorClassName)}>
        Plugin launchers unavailable: {errorMessage}
      </div>
    );
  }

  if (launchers.length === 0) return null;

  return (
    <div className={className}>
      {launchers.map((launcher) => (
        <div key={`${launcher.pluginKey}:${launcher.id}`} className={itemClassName}>
          <DefaultLauncherTrigger
            launcher={launcher}
            placementZone={launcher.placementZone}
            onClick={(event) => {
              const contribution = contributionsByPluginId.get(launcher.pluginId);
              if (!contribution) return;
              void activateLauncher(launcher, context, contribution, event.currentTarget);
            }}
          />
        </div>
      ))}
    </div>
  );
}

type PluginLauncherButtonProps = {
  launcher: ResolvedPluginLauncher;
  context: PluginLauncherContext;
  contribution: PluginUiContribution;
  className?: string;
  onActivated?: () => void;
};

export function PluginLauncherButton({
  launcher,
  context,
  contribution,
  className,
  onActivated,
}: PluginLauncherButtonProps) {
  const { activateLauncher } = usePluginLauncherRuntime();

  return (
    <div className={className}>
      <DefaultLauncherTrigger
        launcher={launcher}
        placementZone={launcher.placementZone}
        onClick={(event) => {
          event.preventDefault();
          onActivated?.();
          void activateLauncher(launcher, context, contribution, event.currentTarget);
        }}
      />
    </div>
  );
}
