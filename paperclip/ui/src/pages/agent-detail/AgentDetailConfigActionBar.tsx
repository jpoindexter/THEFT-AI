import { Button } from "@/components/ui/button";

export function AgentDetailConfigActionBar({
  isMobile,
  onCancel,
  onSave,
  saving,
  visible,
}: {
  isMobile: boolean;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  visible: boolean;
}) {
  if (!visible) return null;
  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="theft-mobile-action-bar-inner flex items-center justify-end gap-2 px-3 py-2">
          <ConfigActionButtons onCancel={onCancel} onSave={onSave} saving={saving} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 shadow-lg">
        <ConfigActionButtons onCancel={onCancel} onSave={onSave} saving={saving} />
      </div>
    </div>
  );
}

function ConfigActionButtons({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </>
  );
}
