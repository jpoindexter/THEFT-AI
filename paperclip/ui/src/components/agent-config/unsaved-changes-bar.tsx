import { Button } from "@/components/ui/button";

export function UnsavedChangesBar({
  disabled,
  onSave,
}: {
  disabled: boolean;
  onSave: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-end px-4 py-2 bg-background/90 backdrop-blur-sm border-b border-primary/20">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Unsaved changes</span>
        <Button size="sm" onClick={onSave} disabled={disabled}>
          {disabled ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
