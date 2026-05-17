import { api } from "./client";
import type {
  PluginLocalFolderSaveInput,
  PluginLocalFolderStatus,
  PluginLocalFoldersResponse,
} from "./plugins-types";

export const pluginLocalFoldersApi = {
  /**
   * List manifest-declared and stored company-scoped local folders for a plugin.
   */
  listLocalFolders: (pluginId: string, companyId: string) =>
    api.get<PluginLocalFoldersResponse>(`/plugins/${pluginId}/companies/${companyId}/local-folders`),

  /**
   * Inspect a configured local folder without changing persisted settings.
   */
  localFolderStatus: (pluginId: string, companyId: string, folderKey: string) =>
    api.get<PluginLocalFolderStatus>(
      `/plugins/${pluginId}/companies/${companyId}/local-folders/${encodeURIComponent(folderKey)}/status`,
    ),

  /**
   * Validate a candidate local folder path without saving it.
   */
  validateLocalFolder: (
    pluginId: string,
    companyId: string,
    folderKey: string,
    input: PluginLocalFolderSaveInput,
  ) =>
    api.post<PluginLocalFolderStatus>(
      `/plugins/${pluginId}/companies/${companyId}/local-folders/${encodeURIComponent(folderKey)}/validate`,
      input,
    ),

  /**
   * Persist a company-scoped local folder path and return its inspected status.
   */
  configureLocalFolder: (
    pluginId: string,
    companyId: string,
    folderKey: string,
    input: PluginLocalFolderSaveInput,
  ) =>
    api.put<PluginLocalFolderStatus>(
      `/plugins/${pluginId}/companies/${companyId}/local-folders/${encodeURIComponent(folderKey)}`,
      input,
    ),
};
