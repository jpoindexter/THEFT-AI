type ShimSpecifier = "react" | "react-dom" | "react-dom/client" | "react/jsx-runtime" | "sdk-ui";

const shimBlobUrls: Record<string, string> = {};

function applyJsxRuntimeKey(
  props: Record<string, unknown> | null | undefined,
  key: string | number | undefined,
): Record<string, unknown> {
  if (key === undefined) return props ?? {};
  return { ...(props ?? {}), key };
}

function getShimBlobUrl(specifier: ShimSpecifier): string {
  if (shimBlobUrls[specifier]) return shimBlobUrls[specifier];

  let source: string;
  switch (specifier) {
    case "react":
      source = `
        const R = globalThis.__paperclipPluginBridge__?.react;
        export default R;
        const { useState, useEffect, useCallback, useMemo, useRef, useContext,
          createContext, createElement, Fragment, Component, forwardRef,
          memo, lazy, Suspense, StrictMode, cloneElement, Children,
          isValidElement, createRef } = R;
        export { useState, useEffect, useCallback, useMemo, useRef, useContext,
          createContext, createElement, Fragment, Component, forwardRef,
          memo, lazy, Suspense, StrictMode, cloneElement, Children,
          isValidElement, createRef };
      `;
      break;
    case "react/jsx-runtime":
      source = `
        const R = globalThis.__paperclipPluginBridge__?.react;
        const withKey = ${applyJsxRuntimeKey.toString()};
        export const jsx = (type, props, key) => R.createElement(type, withKey(props, key));
        export const jsxs = (type, props, key) => R.createElement(type, withKey(props, key));
        export const Fragment = R.Fragment;
      `;
      break;
    case "react-dom":
    case "react-dom/client":
      source = `
        const RD = globalThis.__paperclipPluginBridge__?.reactDom;
        export default RD;
        const { createRoot, hydrateRoot, createPortal, flushSync } = RD ?? {};
        export { createRoot, hydrateRoot, createPortal, flushSync };
      `;
      break;
    case "sdk-ui":
      source = `
        const SDK = globalThis.__paperclipPluginBridge__?.sdkUi ?? {};
        function missing(name) {
          return function MissingPaperclipSdkUiComponent() {
            throw new Error('Paperclip plugin UI runtime is not initialized for "' + name + '". Ensure the host loaded the plugin bridge before rendering this UI module.');
          };
        }
        const { usePluginData, usePluginAction, useHostContext, useHostLocation, useHostNavigation, usePluginStream, usePluginToast } = SDK;
        const MetricCard = SDK.MetricCard ?? missing("MetricCard");
        const StatusBadge = SDK.StatusBadge ?? missing("StatusBadge");
        const DataTable = SDK.DataTable ?? missing("DataTable");
        const TimeseriesChart = SDK.TimeseriesChart ?? missing("TimeseriesChart");
        const MarkdownBlock = SDK.MarkdownBlock ?? missing("MarkdownBlock");
        const MarkdownEditor = SDK.MarkdownEditor ?? missing("MarkdownEditor");
        const KeyValueList = SDK.KeyValueList ?? missing("KeyValueList");
        const ActionBar = SDK.ActionBar ?? missing("ActionBar");
        const LogView = SDK.LogView ?? missing("LogView");
        const JsonTree = SDK.JsonTree ?? missing("JsonTree");
        const Spinner = SDK.Spinner ?? missing("Spinner");
        const ErrorBoundary = SDK.ErrorBoundary ?? missing("ErrorBoundary");
        const FileTree = SDK.FileTree ?? missing("FileTree");
        const IssuesList = SDK.IssuesList ?? missing("IssuesList");
        const AssigneePicker = SDK.AssigneePicker ?? missing("AssigneePicker");
        const ProjectPicker = SDK.ProjectPicker ?? missing("ProjectPicker");
        const ManagedRoutinesList = SDK.ManagedRoutinesList ?? missing("ManagedRoutinesList");
        export { usePluginData, usePluginAction, useHostContext, useHostLocation, useHostNavigation, usePluginStream, usePluginToast, MetricCard, StatusBadge, DataTable, TimeseriesChart, MarkdownBlock, MarkdownEditor, KeyValueList, ActionBar, LogView, JsonTree, Spinner, ErrorBoundary, FileTree, IssuesList, AssigneePicker, ProjectPicker, ManagedRoutinesList };
      `;
      break;
  }

  const blob = new Blob([source], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  shimBlobUrls[specifier] = url;
  return url;
}

/**
 * Rewrite bare specifier imports in an ESM source string to use blob URLs.
 */
function rewriteBareSpecifiers(source: string): string {
  const rewrites: Record<string, string> = {
    '"@paperclipai/plugin-sdk/ui"': `"${getShimBlobUrl("sdk-ui")}"`,
    "'@paperclipai/plugin-sdk/ui'": `'${getShimBlobUrl("sdk-ui")}'`,
    '"@paperclipai/plugin-sdk/ui/hooks"': `"${getShimBlobUrl("sdk-ui")}"`,
    "'@paperclipai/plugin-sdk/ui/hooks'": `'${getShimBlobUrl("sdk-ui")}'`,
    '"react/jsx-runtime"': `"${getShimBlobUrl("react/jsx-runtime")}"`,
    "'react/jsx-runtime'": `'${getShimBlobUrl("react/jsx-runtime")}'`,
    '"react-dom/client"': `"${getShimBlobUrl("react-dom/client")}"`,
    "'react-dom/client'": `'${getShimBlobUrl("react-dom/client")}'`,
    '"react-dom"': `"${getShimBlobUrl("react-dom")}"`,
    "'react-dom'": `'${getShimBlobUrl("react-dom")}'`,
    '"react"': `"${getShimBlobUrl("react")}"`,
    "'react'": `'${getShimBlobUrl("react")}'`,
  };

  let result = source;
  for (const [from, to] of Object.entries(rewrites)) {
    result = result.replaceAll(` from ${from}`, ` from ${to}`);
    result = result.replaceAll(`import ${from}`, `import ${to}`);
  }

  return result;
}

export async function importPluginModule(url: string): Promise<Record<string, unknown>> {
  if (!globalThis.__paperclipPluginBridge__) {
    console.warn("[plugin-loader] Bridge registry not initialized, falling back to direct import");
    return import(/* @vite-ignore */ url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch plugin module: ${response.status} ${response.statusText}`);
  }

  const source = await response.text();
  const rewritten = rewriteBareSpecifiers(source);
  const blob = new Blob([rewritten], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const mod = await import(/* @vite-ignore */ blobUrl);
    return mod;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function resetShimBlobUrls(): void {
  if (typeof URL.revokeObjectURL === "function") {
    for (const url of Object.values(shimBlobUrls)) {
      URL.revokeObjectURL(url);
    }
  }
  for (const key of Object.keys(shimBlobUrls)) {
    delete shimBlobUrls[key];
  }
}

export const _applyJsxRuntimeKeyForTests = applyJsxRuntimeKey;
export const _rewriteBareSpecifiersForTests = rewriteBareSpecifiers;
