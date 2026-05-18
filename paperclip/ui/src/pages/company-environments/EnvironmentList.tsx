import type { Environment, EnvironmentProbeResult } from "@paperclipai/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { summarizeSandboxConfig } from "./environment-model";

type EnvironmentListProps = {
  environments: Environment[] | undefined;
  environmentCapabilities: Awaited<ReturnType<typeof import("@/api/environments").environmentsApi.capabilities>> | undefined;
  editingEnvironmentId: string | null;
  probeResults: Record<string, EnvironmentProbeResult | null>;
  testEnvironmentPending: boolean;
  onEdit: (environment: Environment) => void;
  onTest: (environmentId: string) => void;
};

export function EnvironmentList({
  environments,
  environmentCapabilities,
  editingEnvironmentId,
  probeResults,
  testEnvironmentPending,
  onEdit,
  onTest,
}: EnvironmentListProps) {
  if ((environments ?? []).length === 0) {
    return <div className="text-sm text-muted-foreground">No environments saved for this company yet.</div>;
  }

  return (
    <div className="space-y-3">
      {(environments ?? []).map((environment) => (
        <EnvironmentCard
          key={environment.id}
          environment={environment}
          environmentCapabilities={environmentCapabilities}
          isEditing={editingEnvironmentId === environment.id}
          probe={probeResults[environment.id] ?? null}
          testEnvironmentPending={testEnvironmentPending}
          onEdit={onEdit}
          onTest={onTest}
        />
      ))}
    </div>
  );
}

function EnvironmentCard({
  environment,
  environmentCapabilities,
  isEditing,
  probe,
  testEnvironmentPending,
  onEdit,
  onTest,
}: Omit<EnvironmentListProps, "environments" | "editingEnvironmentId" | "probeResults"> & {
  environment: Environment;
  isEditing: boolean;
  probe: EnvironmentProbeResult | null;
}) {
  return (
    <Card className="gap-0 py-3">
      <CardContent className="space-y-3 px-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {environment.name} <span className="text-muted-foreground">· {environment.driver}</span>
            </div>
            {environment.description ? <div className="text-xs text-muted-foreground">{environment.description}</div> : null}
            <div className="text-xs text-muted-foreground">{environmentSummary(environment, environmentCapabilities)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {environment.driver !== "local" ? (
              <Button size="sm" variant="outline" onClick={() => onTest(environment.id)} disabled={testEnvironmentPending}>
                {testEnvironmentPending ? "Testing..." : environment.driver === "ssh" ? "Test connection" : "Test provider"}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => onEdit(environment)}>
              {isEditing ? "Editing" : "Edit"}
            </Button>
          </div>
        </div>
        {probe ? (
          <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-foreground">
            <Badge variant="outline" className="mb-2">{probe.ok ? "Probe passed" : "Probe failed"}</Badge>
            <div className="font-medium">{probe.summary}</div>
            {probe.details?.error && typeof probe.details.error === "string" ? (
              <div className="mt-1 font-mono text-xs">{probe.details.error}</div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function environmentSummary(
  environment: Environment,
  environmentCapabilities: EnvironmentListProps["environmentCapabilities"],
) {
  if (environment.driver === "ssh") {
    const host = typeof environment.config.host === "string" ? environment.config.host : "SSH host";
    const username = typeof environment.config.username === "string" ? environment.config.username : "user";
    return `${host} · ${username}`;
  }
  if (environment.driver === "sandbox") {
    const provider = typeof environment.config.provider === "string" ? environment.config.provider : "sandbox";
    const displayName = environmentCapabilities?.sandboxProviders?.[provider]?.displayName ?? provider;
    const summary = summarizeSandboxConfig(environment.config as Record<string, unknown>);
    return `${displayName} sandbox provider${summary ? ` · ${summary}` : ""}`;
  }
  return "Runs on this Paperclip host.";
}
