import { createElement, lazy, Suspense } from "react";

import { FileTree } from "@/components/FileTree";
import { MarkdownBody } from "@/components/MarkdownBody";

import type {
  PluginFileTreePathCollection,
  PluginFileTreeProps,
  PluginMarkdownBlockProps,
  PluginMarkdownEditorProps,
} from "./bridge-sdk-types";

const LazyMarkdownEditor = lazy(() =>
  import("@/components/MarkdownEditor").then((module) => ({ default: module.MarkdownEditor })),
);

function toPathSet(paths?: PluginFileTreePathCollection | null): Set<string> {
  return new Set(paths ?? []);
}

export function PluginSdkFileTree({
  expandedPaths,
  checkedPaths,
  selectedFile = null,
  showCheckboxes = false,
  onToggleDir,
  onSelectFile,
  ...props
}: PluginFileTreeProps) {
  return createElement(FileTree, {
    ...props,
    selectedFile,
    expandedDirs: toPathSet(expandedPaths),
    checkedFiles: checkedPaths ? toPathSet(checkedPaths) : undefined,
    showCheckboxes,
    onToggleDir: onToggleDir ?? (() => undefined),
    onSelectFile: onSelectFile ?? (() => undefined),
  });
}

export function PluginSdkMarkdownBlock({
  content,
  className,
  enableWikiLinks,
  wikiLinkRoot,
  resolveWikiLinkHref,
}: PluginMarkdownBlockProps) {
  return createElement(MarkdownBody, {
    className,
    softBreaks: false,
    enableWikiLinks,
    wikiLinkRoot,
    resolveWikiLinkHref,
    children: content,
  });
}

export function PluginSdkMarkdownEditor(props: PluginMarkdownEditorProps) {
  return createElement(
    Suspense,
    { fallback: createElement("div", { className: "text-sm text-muted-foreground" }, "Loading markdown editor...") },
    createElement(LazyMarkdownEditor, props),
  );
}
