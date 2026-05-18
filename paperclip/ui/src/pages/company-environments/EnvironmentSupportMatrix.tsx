import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { adapterLabels } from "@/components/agent-config-primitives";

import { ENVIRONMENT_SUPPORT_ROWS } from "./environment-model";

type EnvironmentSupportMatrixProps = {
  environmentCapabilities: Awaited<ReturnType<typeof import("@/api/environments").environmentsApi.capabilities>> | undefined;
  sandboxSupportVisible: boolean;
  sandboxProviders: Array<{ provider: string }>;
};

function SupportMark({ supported }: { supported: boolean }) {
  return supported ? (
    <span className="inline-flex items-center gap-1 text-foreground">
      <Check className="size-3" />
      Yes
    </span>
  ) : (
    <span className="text-muted-foreground">No</span>
  );
}

export function EnvironmentSupportMatrix({
  environmentCapabilities,
  sandboxSupportVisible,
  sandboxProviders,
}: EnvironmentSupportMatrixProps) {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="space-y-4 px-4">
        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Environment choices use the same adapter support matrix as agent defaults. SSH is always available for
          remote-managed adapters, and sandbox environments appear only when a run-capable sandbox provider plugin is
          installed.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full text-left text-xs">
            <caption className="sr-only">Environment support by adapter</caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Adapter</th>
                <th className="px-3 py-2 font-medium">Local</th>
                <th className="px-3 py-2 font-medium">SSH</th>
                {sandboxSupportVisible ? <th className="px-3 py-2 font-medium">Sandbox</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(environmentCapabilities?.adapters.map((support) => ({ adapterType: support.adapterType, support })) ?? ENVIRONMENT_SUPPORT_ROWS).map(({ adapterType, support }) => (
                <tr key={adapterType}>
                  <td className="py-2 pr-3 font-medium">{adapterLabels[adapterType] ?? adapterType}</td>
                  <td className="px-3 py-2"><SupportMark supported={support.drivers.local === "supported"} /></td>
                  <td className="px-3 py-2"><SupportMark supported={support.drivers.ssh === "supported"} /></td>
                  {sandboxSupportVisible ? (
                    <td className="px-3 py-2">
                      <SupportMark supported={sandboxProviders.some((provider) => support.sandboxProviders[provider.provider] === "supported")} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
