import { PluginSlotOutlet } from "@/plugins/slots";
import { PluginLauncherOutlet } from "@/plugins/launchers";

type IssueDetailPluginOutletsProps = {
  companyId: string;
  projectId: string | null;
  issueId: string;
};

export function IssueDetailPluginOutlets({
  companyId,
  projectId,
  issueId,
}: IssueDetailPluginOutletsProps) {
  const context = {
    companyId,
    projectId,
    entityId: issueId,
    entityType: "issue" as const,
  };

  return (
    <>
      <PluginSlotOutlet
        slotTypes={["toolbarButton", "contextMenuItem"]}
        entityType="issue"
        context={context}
        className="flex flex-wrap gap-2"
        itemClassName="inline-flex"
        missingBehavior="placeholder"
      />

      <PluginLauncherOutlet
        placementZones={["toolbarButton"]}
        entityType="issue"
        context={context}
        className="flex flex-wrap gap-2"
        itemClassName="inline-flex"
      />

      <PluginSlotOutlet
        slotTypes={["taskDetailView"]}
        entityType="issue"
        context={context}
        className="space-y-3"
        itemClassName="rounded-lg border border-border p-3"
        missingBehavior="placeholder"
      />
    </>
  );
}
