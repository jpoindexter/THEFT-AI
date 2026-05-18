import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  PluginBridgeErrorCode,
  PluginLauncherBounds,
  PluginLauncherRenderEnvironment,
} from "@paperclipai/shared";
import type { ToastInput } from "@/context/ToastContext";

export interface PluginBridgeError {
  code: PluginBridgeErrorCode;
  message: string;
  details?: unknown;
}

export interface PluginDataResult<T = unknown> {
  data: T | null;
  loading: boolean;
  error: PluginBridgeError | null;
  refresh(): void;
}

export type PluginToastInput = ToastInput;
export type PluginToastFn = (input: PluginToastInput) => string | null;

export interface HostNavigationOptions {
  replace?: boolean;
  state?: unknown;
}

export interface HostNavigationLinkOptions extends HostNavigationOptions {
  target?: string;
  rel?: string;
}

export interface HostNavigationLinkProps {
  href: string;
  target?: string;
  rel?: string;
  onClick(event: ReactMouseEvent<HTMLAnchorElement>): void;
}

export interface HostNavigation {
  resolveHref(to: string): string;
  navigate(to: string, options?: HostNavigationOptions): void;
  linkProps(to: string, options?: HostNavigationLinkOptions): HostNavigationLinkProps;
}

export interface HostLocation {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
}

export interface PluginHostContext {
  companyId: string | null;
  companyPrefix: string | null;
  projectId: string | null;
  entityId: string | null;
  entityType: string | null;
  parentEntityId?: string | null;
  userId: string | null;
  renderEnvironment?: PluginRenderEnvironmentContext | null;
}

export interface PluginModalBoundsRequest {
  bounds: PluginLauncherBounds;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface PluginRenderCloseEvent {
  reason:
    | "escapeKey"
    | "backdrop"
    | "hostNavigation"
    | "programmatic"
    | "submit"
    | "unknown";
  nativeEvent?: unknown;
}

export type PluginRenderCloseHandler = (
  event: PluginRenderCloseEvent,
) => void | Promise<void>;

export interface PluginRenderCloseLifecycle {
  onBeforeClose?(handler: PluginRenderCloseHandler): () => void;
  onClose?(handler: PluginRenderCloseHandler): () => void;
}

export interface PluginRenderEnvironmentContext {
  environment: PluginLauncherRenderEnvironment | null;
  launcherId: string | null;
  bounds: PluginLauncherBounds | null;
  requestModalBounds?(request: PluginModalBoundsRequest): Promise<void>;
  closeLifecycle?: PluginRenderCloseLifecycle | null;
}

export type PluginBridgeContextValue = {
  pluginId: string;
  hostContext: PluginHostContext;
};

export interface PluginStreamResult<T = unknown> {
  events: T[];
  lastEvent: T | null;
  connecting: boolean;
  connected: boolean;
  error: Error | null;
  close(): void;
}

export type PluginActionFn = (params?: Record<string, unknown>) => Promise<unknown>;
