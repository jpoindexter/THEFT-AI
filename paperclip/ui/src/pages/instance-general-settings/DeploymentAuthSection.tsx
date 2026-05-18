import { ModeBadge } from "@/components/access/ModeBadge";

type DeploymentAuthSectionProps = {
  health:
    | {
        deploymentMode?: "local_trusted" | "authenticated";
        deploymentExposure?: "private" | "public";
        authReady?: boolean;
        bootstrapStatus?: string | null;
        bootstrapInviteActive?: boolean;
      }
    | undefined;
};

export function DeploymentAuthSection({ health }: DeploymentAuthSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Deployment and auth</h2>
          <ModeBadge
            deploymentMode={health?.deploymentMode}
            deploymentExposure={health?.deploymentExposure}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {health?.deploymentMode === "local_trusted"
            ? "Local trusted mode is optimized for a local operator. Browser requests run as local board context and no sign-in is required."
            : health?.deploymentExposure === "public"
              ? "Authenticated public mode requires sign-in for board access and is intended for public URLs."
              : "Authenticated private mode requires sign-in and is intended for LAN, VPN, or other private-network deployments."}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <StatusBox label="Auth readiness" value={health?.authReady ? "Ready" : "Not ready"} />
          <StatusBox
            label="Bootstrap status"
            value={health?.bootstrapStatus === "bootstrap_pending" ? "Setup required" : "Ready"}
          />
          <StatusBox label="Bootstrap invite" value={health?.bootstrapInviteActive ? "Active" : "None"} />
        </div>
      </div>
    </section>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-3">
      <div className="theft-label-compact font-medium">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
