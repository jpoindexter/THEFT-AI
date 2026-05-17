import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Environment } from "@paperclipai/shared";
import { supportedEnvironmentDriversForAdapter } from "@paperclipai/shared";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { environmentsApi } from "../../api/environments";
import { instanceSettingsApi } from "../../api/instanceSettings";
import { queryKeys } from "../../lib/queryKeys";

type EffectiveIdentityValue = <T>(group: "identity", field: string, original: T) => T;

export function useAgentExecutionOptions({
  adapterType,
  agentDefaultEnvironmentId,
  eff,
  isCreate,
  selectedCompanyId,
  values,
}: {
  adapterType: string;
  agentDefaultEnvironmentId: string;
  eff: EffectiveIdentityValue;
  isCreate: boolean;
  selectedCompanyId: string | null | undefined;
  values: CreateConfigValues | null;
}) {
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const environmentsEnabled = experimentalSettings?.enableEnvironments === true;
  const { data: environments = [] } = useQuery<Environment[]>({
    queryKey: selectedCompanyId ? queryKeys.environments.list(selectedCompanyId) : ["environments", "none"],
    queryFn: () => environmentsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId) && environmentsEnabled,
  });
  const supportedEnvironmentDrivers = useMemo(
    () => new Set(supportedEnvironmentDriversForAdapter(adapterType)),
    [adapterType],
  );
  const currentDefaultEnvironmentId = isCreate
    ? values!.defaultEnvironmentId ?? ""
    : eff("identity", "defaultEnvironmentId", agentDefaultEnvironmentId);
  const currentDefaultEnvironment = useMemo(
    () => environments.find((environment) => environment.id === currentDefaultEnvironmentId) ?? null,
    [currentDefaultEnvironmentId, environments],
  );
  const runnableEnvironments = useMemo(
    () => environments.filter((environment) => {
      if (!supportedEnvironmentDrivers.has(environment.driver)) return false;
      if (environment.driver !== "sandbox") return true;
      const provider = typeof environment.config?.provider === "string" ? environment.config.provider : null;
      return provider !== null && provider !== "fake";
    }),
    [environments, supportedEnvironmentDrivers],
  );

  return {
    currentDefaultEnvironment,
    currentDefaultEnvironmentId,
    environmentsEnabled,
    runnableEnvironments,
  };
}
