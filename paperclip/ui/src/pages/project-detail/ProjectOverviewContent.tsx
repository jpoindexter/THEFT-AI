import { InlineEditor } from "@/components/InlineEditor";
import { StatusBadge } from "@/components/StatusBadge";

type ProjectOverviewContentProps = {
  project: { description: string | null; status: string; targetDate: string | null };
  onUpdate: (data: Record<string, unknown>) => void;
  imageUploadHandler?: (file: File) => Promise<string>;
};

export function ProjectOverviewContent({
  project,
  onUpdate,
  imageUploadHandler,
}: ProjectOverviewContentProps) {
  return (
    <div className="space-y-6">
      <InlineEditor
        value={project.description ?? ""}
        onSave={(description) => onUpdate({ description })}
        nullable
        as="p"
        className="text-sm text-muted-foreground"
        placeholder="Add a description..."
        multiline
        imageUploadHandler={imageUploadHandler}
      />

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Status</span>
          <div className="mt-1">
            <StatusBadge status={project.status} />
          </div>
        </div>
        {project.targetDate ? (
          <div>
            <span className="text-muted-foreground">Target Date</span>
            <p>{project.targetDate}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
