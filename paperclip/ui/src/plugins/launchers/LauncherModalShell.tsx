import {
  Component,
  createElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import {
  PluginBridgeContext,
  type PluginHostContext,
  type PluginRenderEnvironmentContext,
} from "../bridge";
import {
  buildLauncherHostContext,
  focusFirstElement,
  launcherOverlayBaseZIndex,
  launcherPopoverStyle,
  launcherShellBoundsStyle,
  trapFocus,
} from "./utils";
import type { LauncherInstance, LauncherModalShellProps, ResolvedPluginLauncher } from "./types";

function PluginLauncherBridgeScope({
  pluginId,
  hostContext,
  children,
}: {
  pluginId: string;
  hostContext: PluginHostContext;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ pluginId, hostContext }), [pluginId, hostContext]);

  return (
    <PluginBridgeContext.Provider value={value}>
      {children}
    </PluginBridgeContext.Provider>
  );
}

type LauncherErrorBoundaryProps = {
  launcher: ResolvedPluginLauncher;
  children: ReactNode;
};

type LauncherErrorBoundaryState = {
  hasError: boolean;
};

class LauncherErrorBoundary extends Component<LauncherErrorBoundaryProps, LauncherErrorBoundaryState> {
  override state: LauncherErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LauncherErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Plugin launcher render failed", {
      pluginKey: this.props.launcher.pluginKey,
      launcherId: this.props.launcher.id,
      error,
      info: info.componentStack,
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {this.props.launcher.pluginDisplayName}: failed to render
        </div>
      );
    }
    return this.props.children;
  }
}

function LauncherRenderContent({
  instance,
  renderEnvironment,
}: {
  instance: LauncherInstance;
  renderEnvironment: PluginRenderEnvironmentContext;
}) {
  const component = instance.component;
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const userId = session?.user?.id ?? session?.session?.userId ?? null;
  const hostContext = useMemo(
    () => buildLauncherHostContext(instance.hostContext, renderEnvironment, userId),
    [instance.hostContext, renderEnvironment, userId],
  );

  if (!component) {
    if (renderEnvironment.environment === "iframe") {
      return (
        <iframe
          src={`/_plugins/${encodeURIComponent(instance.launcher.pluginId)}/ui/${instance.launcher.action.target}`}
          title={`${instance.launcher.pluginDisplayName} ${instance.launcher.displayName}`}
          className="h-full min-h-96 w-full rounded-md border border-border bg-background"
        />
      );
    }

    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        {instance.launcher.pluginDisplayName}: could not resolve launcher target "{instance.launcher.action.target}".
      </div>
    );
  }

  if (component.kind === "web-component") {
    return createElement(component.tagName, {
      className: "block w-full",
      pluginLauncher: instance.launcher,
      pluginContext: hostContext,
    });
  }

  const node = createElement(component.component as never, {
    launcher: instance.launcher,
    context: hostContext,
  } as never);

  return (
    <LauncherErrorBoundary launcher={instance.launcher}>
      <PluginLauncherBridgeScope pluginId={instance.launcher.pluginId} hostContext={hostContext}>
        {node}
      </PluginLauncherBridgeScope>
    </LauncherErrorBoundary>
  );
}

export function LauncherModalShell({
  instance,
  stackIndex,
  isTopmost,
  requestBounds,
  closeLauncher,
}: LauncherModalShellProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isTopmost) return;
    const frame = requestAnimationFrame(() => {
      focusFirstElement(contentRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [isTopmost]);

  useEffect(() => {
    if (!isTopmost) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!contentRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        void closeLauncher(instance.key, { reason: "escapeKey", nativeEvent: event });
        return;
      }
      trapFocus(contentRef.current, event);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeLauncher, instance.key, isTopmost]);

  const renderEnvironment = useMemo<PluginRenderEnvironmentContext>(() => ({
    environment: instance.launcher.render?.environment ?? "hostOverlay",
    launcherId: instance.launcher.id,
    bounds: instance.bounds,
    requestModalBounds: (request) => requestBounds(instance.key, request),
    closeLifecycle: {
      onBeforeClose: (handler) => {
        instance.beforeCloseHandlers.add(handler);
        return () => instance.beforeCloseHandlers.delete(handler);
      },
      onClose: (handler) => {
        instance.closeHandlers.add(handler);
        return () => instance.closeHandlers.delete(handler);
      },
    },
  }), [instance, requestBounds]);

  const baseZ = launcherOverlayBaseZIndex + stackIndex * 20;
  const shellType = instance.launcher.action.type;
  const containerStyle = shellType === "openPopover"
    ? launcherPopoverStyle(instance)
    : launcherShellBoundsStyle(instance.bounds);

  const panelClassName = shellType === "openDrawer"
    ? "fixed right-0 top-0 flex h-full max-w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl"
    : shellType === "openPopover"
      ? "fixed flex max-h-dvh flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
      : "fixed left-1/2 top-1/2 flex max-h-dvh -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl";

  return (
    <>
      {/* Plugin launchers need runtime geometry: stacked z-indexes, requested bounds,
          and popover anchors are driven by plugin state and DOMRects. */}
      <div
        className="fixed inset-0 bg-black/45"
        style={{ zIndex: baseZ }}
        aria-hidden="true"
        onMouseDown={(event) => {
          if (!isTopmost) return;
          if (event.target !== event.currentTarget) return;
          void closeLauncher(instance.key, { reason: "backdrop", nativeEvent: event });
        }}
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={panelClassName}
        style={{
          zIndex: baseZ + 1,
          ...(shellType === "openDrawer"
            ? { width: containerStyle.width ?? "min(44rem, 100vw)" }
            : containerStyle),
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-semibold">
              {instance.launcher.displayName}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {instance.launcher.pluginDisplayName}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => void closeLauncher(instance.key, { reason: "programmatic" })}
          >
            Close
          </Button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-auto p-4")}>
          <LauncherRenderContent instance={instance} renderEnvironment={renderEnvironment} />
        </div>
      </div>
    </>
  );
}
