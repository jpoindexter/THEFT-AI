export type ProjectBaseTab =
  | "overview"
  | "list"
  | "plugin-operations"
  | "workspaces"
  | "configuration"
  | "budget";
export type ProjectPluginTab = `plugin:${string}`;
export type ProjectTab = ProjectBaseTab | ProjectPluginTab;

export function isProjectPluginTab(value: string | null): value is ProjectPluginTab {
  return typeof value === "string" && value.startsWith("plugin:");
}

export function resolveProjectTab(pathname: string, projectId: string): ProjectTab | null {
  const segments = pathname.split("/").filter(Boolean);
  const projectsIdx = segments.indexOf("projects");
  if (projectsIdx === -1 || segments[projectsIdx + 1] !== projectId) return null;
  const tab = segments[projectsIdx + 2];
  if (tab === "overview") return "overview";
  if (tab === "configuration") return "configuration";
  if (tab === "budget") return "budget";
  if (tab === "issues") return "list";
  if (tab === "plugin-operations") return "plugin-operations";
  if (tab === "workspaces") return "workspaces";
  return null;
}
