import type { CSSProperties } from "react";
import { PLUGIN_LAUNCHER_BOUNDS, type PluginLauncherBounds, type PluginLauncherPlacementZone } from "@paperclipai/shared";
import type { PluginHostContext, PluginRenderEnvironmentContext } from "../bridge";
import {
  ensurePluginContributionLoaded,
  resolveRegisteredPluginComponent,
} from "../slots";
import type { PluginUiContribution } from "@/api/plugins";
import type { LauncherInstance, PluginLauncherContext, ResolvedPluginLauncher } from "./types";

export const entityScopedZones = new Set<PluginLauncherPlacementZone>([
  "detailTab",
  "taskDetailView",
  "contextMenuItem",
  "commentAnnotation",
  "commentContextMenuItem",
  "projectSidebarItem",
  "toolbarButton",
]);

const focusableElementSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const supportedLauncherBounds = new Set<PluginLauncherBounds>(
  PLUGIN_LAUNCHER_BOUNDS,
);

export const launcherOverlayBaseZIndex = 1000;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}

export function buildLauncherHostContext(
  context: PluginLauncherContext,
  renderEnvironment: PluginRenderEnvironmentContext | null,
  userId: string | null,
): PluginHostContext {
  return {
    companyId: context.companyId ?? null,
    companyPrefix: context.companyPrefix ?? null,
    projectId: context.projectId ?? (context.entityType === "project" ? context.entityId ?? null : null),
    entityId: context.entityId ?? null,
    entityType: context.entityType ?? null,
    userId,
    renderEnvironment,
  };
}

export function focusFirstElement(container: HTMLElement | null): void {
  if (!container) return;
  const firstFocusable = container.querySelector<HTMLElement>(focusableElementSelector);
  if (firstFocusable) {
    firstFocusable.focus();
    return;
  }
  container.focus();
}

export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(focusableElementSelector),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export function launcherTriggerClassName(placementZone: PluginLauncherPlacementZone): string {
  switch (placementZone) {
    case "projectSidebarItem":
      return "h-auto justify-start px-3 py-1 text-xs font-normal text-muted-foreground hover:text-foreground";
    case "contextMenuItem":
    case "commentContextMenuItem":
      return "justify-start h-7 w-full px-2 text-xs font-normal";
    case "sidebar":
    case "sidebarPanel":
      return "justify-start h-8 w-full";
    case "toolbarButton":
    case "globalToolbarButton":
      return "h-8";
    default:
      return "h-8";
  }
}

export function launcherShellBoundsStyle(bounds: PluginLauncherBounds | null): CSSProperties {
  switch (bounds) {
    case "compact":
      return { width: "min(28rem, calc(100vw - 2rem))" };
    case "wide":
      return { width: "min(64rem, calc(100vw - 2rem))" };
    case "full":
      return { width: "calc(100vw - 2rem)", height: "calc(100vh - 2rem)" };
    case "inline":
      return { width: "min(24rem, calc(100vw - 2rem))" };
    case "default":
    default:
      return { width: "min(40rem, calc(100vw - 2rem))" };
  }
}

export function launcherPopoverStyle(instance: LauncherInstance): CSSProperties {
  const rect = instance.sourceRect;
  const baseWidth = launcherShellBoundsStyle(instance.bounds).width ?? "min(24rem, calc(100vw - 2rem))";
  if (!rect) {
    return {
      width: baseWidth,
      maxHeight: "min(70vh, 36rem)",
      top: "4rem",
      left: "50%",
      transform: "translateX(-50%)",
    };
  }

  const top = Math.min(rect.bottom + 8, window.innerHeight - 32);
  const left = Math.min(
    Math.max(rect.left, 16),
    Math.max(16, window.innerWidth - 360),
  );

  return {
    width: baseWidth,
    maxHeight: "min(70vh, 36rem)",
    top,
    left,
  };
}

export function isPluginLauncherBounds(value: unknown): value is PluginLauncherBounds {
  return typeof value === "string" && supportedLauncherBounds.has(value as PluginLauncherBounds);
}

export async function resolveLauncherComponent(
  contribution: PluginUiContribution,
  launcher: ResolvedPluginLauncher,
) {
  const exportName = launcher.action.target;
  const existing = resolveRegisteredPluginComponent(launcher.pluginKey, exportName);
  if (existing) return existing;
  await ensurePluginContributionLoaded(contribution);
  return resolveRegisteredPluginComponent(launcher.pluginKey, exportName);
}
