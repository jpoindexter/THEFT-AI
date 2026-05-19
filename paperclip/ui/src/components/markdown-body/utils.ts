import { isValidElement, type ReactNode } from "react";
import { defaultUrlTransform } from "react-markdown";

import { parseMentionChipHref } from "@/lib/mention-chips";

export const MARKDOWN_WRAP_CLASS = "break-words";
export const MARKDOWN_SCROLLABLE_BLOCK_CLASS = "max-w-full overflow-x-auto";
const PAPERCLIP_PROJECT_ARTIFACT_PATH_RE = /\/\.paperclip\/instances\/[^/]+\/projects\//;

export function flattenText(value: ReactNode): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((item) => flattenText(item)).join("");
  return "";
}

export function extractMermaidSource(children: ReactNode): string | null {
  if (!isValidElement(children)) return null;
  const childProps = children.props as { className?: unknown; children?: ReactNode };
  if (typeof childProps.className !== "string") return null;
  if (!/\blanguage-mermaid\b/i.test(childProps.className)) return null;
  return flattenText(childProps.children).replace(/\n$/, "");
}

export function safeMarkdownUrlTransform(url: string): string {
  const localArtifactHref = paperclipLocalArtifactHrefToApiHref(url);
  if (localArtifactHref) return localArtifactHref;
  return parseMentionChipHref(url) ? url : defaultUrlTransform(url);
}

export function paperclipLocalArtifactHrefToApiHref(url: string): string | null {
  const artifactPath = parsePaperclipLocalArtifactPath(url);
  if (!artifactPath) return null;
  return `/api/local-artifacts/content?path=${encodeURIComponent(artifactPath)}`;
}

function parsePaperclipLocalArtifactPath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("file://")) {
    try {
      const fileUrl = new URL(trimmed);
      return isPaperclipProjectArtifactPath(fileUrl.pathname)
        ? decodeURIComponent(fileUrl.pathname)
        : null;
    } catch {
      return null;
    }
  }

  if (!trimmed.startsWith("/")) return null;
  return isPaperclipProjectArtifactPath(trimmed) ? trimmed : null;
}

function isPaperclipProjectArtifactPath(value: string): boolean {
  return PAPERCLIP_PROJECT_ARTIFACT_PATH_RE.test(value);
}
