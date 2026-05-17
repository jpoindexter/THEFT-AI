import type { ReactNode } from "react";
import { ExternalLink, Github } from "lucide-react";

export function isGitHubUrl(href: string | null | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && (url.hostname === "github.com" || url.hostname === "www.github.com");
  } catch {
    return false;
  }
}

export function isExternalHttpUrl(href: string | null | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (typeof window === "undefined") return true;
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function getLinkIcons(href: string | null | undefined) {
  const isGitHubLink = isGitHubUrl(href);
  const isExternal = isExternalHttpUrl(href);
  return {
    leadingIcon: isGitHubLink ? (
      <Github aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 align-middle" />
    ) : null,
    trailingIcon: isExternal && !isGitHubLink ? (
      <ExternalLink aria-hidden="true" className="ml-1 inline h-3 w-3 align-middle" />
    ) : null,
    isExternal,
  };
}

export function renderLinkBody(
  children: ReactNode,
  leadingIcon: ReactNode,
  trailingIcon: ReactNode,
): ReactNode {
  if (!leadingIcon && !trailingIcon) return children;

  if (typeof children === "string" && children.length > 0) {
    if (children.length === 1) {
      return (
        <span className="whitespace-nowrap">
          {leadingIcon}
          {children}
          {trailingIcon}
        </span>
      );
    }
    const first = children[0];
    const last = children[children.length - 1];
    const middle = children.slice(1, -1);
    return (
      <>
        {leadingIcon ? (
          <span className="whitespace-nowrap">
            {leadingIcon}
            {first}
          </span>
        ) : first}
        {middle}
        {trailingIcon ? (
          <span className="whitespace-nowrap">
            {last}
            {trailingIcon}
          </span>
        ) : last}
      </>
    );
  }

  return (
    <>
      {leadingIcon}
      {children}
      {trailingIcon}
    </>
  );
}
