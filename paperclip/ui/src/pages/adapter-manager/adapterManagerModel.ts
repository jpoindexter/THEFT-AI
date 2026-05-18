import type { AdapterInfo } from "@/api/adapters";
import { getAdapterLabel } from "@/adapters/adapter-display-registry";

export type VirtualBuiltinAdapter = {
  type: string;
  label: string;
  overriddenBy: string;
  overridePaused: boolean;
  menuDisabled: boolean;
};

export function toVirtualAdapterInfo(adapter: VirtualBuiltinAdapter): AdapterInfo {
  return {
    type: adapter.type,
    label: adapter.label,
    source: "builtin",
    modelsCount: 0,
    loaded: true,
    disabled: adapter.menuDisabled,
    capabilities: {
      supportsInstructionsBundle: false,
      supportsSkills: false,
      supportsLocalAgentJwt: false,
      requiresMaterializedRuntimeSkills: false,
      supportsModelProfiles: false,
    },
  };
}

export function getAdapterGroups(adapters: AdapterInfo[] | undefined) {
  const allAdapters = adapters ?? [];
  const builtinAdapters = allAdapters.filter((adapter) => adapter.source === "builtin");
  const externalAdapters = allAdapters.filter((adapter) => adapter.source === "external");

  const overriddenBuiltins = allAdapters
    .filter((adapter) => adapter.source === "external" && adapter.overriddenBuiltin)
    .filter((adapter) => !builtinAdapters.some((builtin) => builtin.type === adapter.type))
    .map((adapter) => ({
      type: adapter.type,
      label: getAdapterLabel(adapter.type),
      overriddenBy: [
        adapter.packageName,
        adapter.version ? `v${adapter.version}` : undefined,
      ].filter(Boolean).join(" "),
      overridePaused: !!adapter.overridePaused,
      menuDisabled: !!adapter.disabled,
    }));

  return { builtinAdapters, externalAdapters, overriddenBuiltins };
}
