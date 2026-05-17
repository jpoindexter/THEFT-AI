import { isValidElement, type ReactNode } from "react";
import { defaultUrlTransform } from "react-markdown";

import { parseMentionChipHref } from "@/lib/mention-chips";

export const MARKDOWN_WRAP_CLASS = "break-words";
export const MARKDOWN_SCROLLABLE_BLOCK_CLASS = "max-w-full overflow-x-auto";

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
  return parseMentionChipHref(url) ? url : defaultUrlTransform(url);
}
