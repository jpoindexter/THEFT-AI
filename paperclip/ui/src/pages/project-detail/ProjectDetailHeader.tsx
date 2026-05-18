import { PROJECT_COLORS } from "@paperclipai/shared";

import { InlineEditor } from "@/components/InlineEditor";
import { Badge } from "@/components/ui/badge";
import { PluginLauncherOutlet } from "@/plugins/launchers";
import { PluginSlotOutlet } from "@/plugins/slots";

import { ProjectColorPicker } from "./ProjectColorPicker";

type ProjectDetailHeaderProps = {
  project: {
    id: string;
    name: string;
    color: string | null;
    pauseReason?: string | null;
    managedByPlugin?: { pluginDisplayName: string } | null;
  };
  companyPrefix: string | null;
  projectRef: string;
  companyId: string | null | undefined;
  onUpdate: (data: Record<string, unknown>) => void;
};

function ProjectColorDot({ color }: { color: string }) {
  return (
    <svg className="size-2" viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  );
}

export function ProjectDetailHeader({
  project,
  companyPrefix,
  projectRef,
  companyId,
  onUpdate,
}: ProjectDetailHeaderProps) {
  const context = {
    companyId: companyId ?? null,
    companyPrefix,
    projectId: project.id,
    projectRef,
    entityId: project.id,
    entityType: "project" as const,
  };

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="flex h-7 items-center">
          <ProjectColorPicker
            currentColor={project.color ?? PROJECT_COLORS[0]}
            onSelect={(color) => onUpdate({ color })}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <InlineEditor
            value={project.name}
            onSave={(name) => onUpdate({ name })}
            as="h2"
            className="text-xl font-bold"
          />
          {project.pauseReason === "budget" ? (
            <Badge variant="outline" className="theft-label-compact gap-2">
              <span className="size-2 rounded-full bg-destructive" />
              Paused by budget hard stop
            </Badge>
          ) : null}
          {project.managedByPlugin ? (
            <Badge variant="outline" className="gap-2 text-muted-foreground">
              <ProjectColorDot color={project.color ?? PROJECT_COLORS[0]} />
              Managed by {project.managedByPlugin.pluginDisplayName}
            </Badge>
          ) : null}
        </div>
      </div>

      <PluginSlotOutlet
        slotTypes={["toolbarButton", "contextMenuItem"]}
        entityType="project"
        context={context}
        className="flex flex-wrap gap-2"
        itemClassName="inline-flex"
        missingBehavior="placeholder"
      />

      <PluginLauncherOutlet
        placementZones={["toolbarButton"]}
        entityType="project"
        context={context}
        className="flex flex-wrap gap-2"
        itemClassName="inline-flex"
      />
    </>
  );
}
