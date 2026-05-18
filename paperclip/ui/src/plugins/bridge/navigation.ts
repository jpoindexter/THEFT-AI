import { useCallback, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import { useLocation as useRouterLocation, useNavigate as useRouterNavigate, type NavigateOptions } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import { isGlobalPath, normalizeCompanyPrefix } from "@/lib/company-routes";
import { usePluginBridgeContext } from "./context";
import type {
  HostLocation,
  HostNavigation,
  HostNavigationLinkOptions,
  HostNavigationLinkProps,
  HostNavigationOptions,
} from "./types";

function splitPath(path: string): { pathname: string; search: string; hash: string } {
  const match = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    pathname: match?.[1] ?? path,
    search: match?.[2] ?? "",
    hash: match?.[3] ?? "",
  };
}

function sameOriginPathFromHref(href: string): string | null {
  if (!/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith("//")) {
    return href;
  }
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function hasCompanyPrefix(pathname: string, companyPrefix: string): boolean {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  return firstSegment?.toUpperCase() === normalizeCompanyPrefix(companyPrefix);
}

export function resolveHostNavigationHref(
  to: string,
  companyPrefix: string | null | undefined,
): string {
  const sameOriginPath = sameOriginPathFromHref(to);
  if (sameOriginPath === null) return to;

  const { pathname, search, hash } = splitPath(sameOriginPath);
  if (!pathname.startsWith("/") || isGlobalPath(pathname) || !companyPrefix) {
    return sameOriginPath;
  }

  if (hasCompanyPrefix(pathname, companyPrefix)) {
    return sameOriginPath;
  }

  return `/${normalizeCompanyPrefix(companyPrefix)}${pathname}${search}${hash}`;
}

function isPlainLeftClick(event: ReactMouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

export function shouldHandleHostNavigationClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string,
  target?: string,
): boolean {
  if (!isPlainLeftClick(event)) return false;
  if (target && target !== "_self") return false;
  if (event.currentTarget.hasAttribute("download")) return false;
  return sameOriginPathFromHref(href) !== null;
}

export function useHostNavigation(): HostNavigation {
  const { hostContext } = usePluginBridgeContext();
  const routerNavigate = useRouterNavigate();
  const { isMobile, setSidebarOpen } = useSidebar();
  const companyPrefix = hostContext.companyPrefix;

  const resolveHref = useCallback(
    (to: string) => resolveHostNavigationHref(to, companyPrefix),
    [companyPrefix],
  );

  const navigate = useCallback(
    (to: string, options?: HostNavigationOptions) => {
      const href = resolveHref(to);
      const sameOriginPath = sameOriginPathFromHref(href);
      if (sameOriginPath === null) {
        window.location.assign(href);
        return;
      }
      routerNavigate(sameOriginPath, options as NavigateOptions | undefined);
      if (isMobile) setSidebarOpen(false);
    },
    [isMobile, resolveHref, routerNavigate, setSidebarOpen],
  );

  const linkProps = useCallback(
    (to: string, options?: HostNavigationLinkOptions): HostNavigationLinkProps => {
      const href = resolveHref(to);
      return {
        href,
        target: options?.target,
        rel: options?.rel,
        onClick: (event) => {
          if (!shouldHandleHostNavigationClick(event, href, options?.target)) return;
          event.preventDefault();
          navigate(href, options);
        },
      };
    },
    [navigate, resolveHref],
  );

  return useMemo(
    () => ({
      resolveHref,
      navigate,
      linkProps,
    }),
    [linkProps, navigate, resolveHref],
  );
}

export function useHostLocation(): HostLocation {
  const location = useRouterLocation();
  return useMemo(
    () => ({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
    }),
    [location.hash, location.pathname, location.search, location.state],
  );
}
