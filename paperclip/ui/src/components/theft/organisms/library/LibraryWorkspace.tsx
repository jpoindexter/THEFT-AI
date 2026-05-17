import type { IssueDocument } from "@paperclipai/shared";
import { Library as LibraryIcon } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { TheftSurface } from "@/components/theft";
import type { LibraryItem } from "@/lib/library-items";
import { LibraryDetail } from "./LibraryDetail";
import { LibraryShelf } from "./LibraryShelf";

export function LibraryWorkspace({
  groups,
  pinnedItems,
  selectedItem,
  selectedItemId,
  pinnedIds,
  onSelect,
  onTogglePin,
  document,
  documentLoading,
  documentDraft,
  onDocumentDraftChange,
  editingDocument,
  onEditDocument,
  onCancelDocumentEdit,
  onSaveDocument,
  saveError,
  saving,
}: {
  groups: Array<{ department: string; departmentKey: string; items: LibraryItem[] }>;
  pinnedItems: LibraryItem[];
  selectedItem: LibraryItem | null;
  selectedItemId: string | null;
  pinnedIds: Set<string>;
  onSelect: (item: LibraryItem) => void;
  onTogglePin: (item: LibraryItem) => void;
  document: IssueDocument | null;
  documentLoading: boolean;
  documentDraft: string;
  onDocumentDraftChange: (value: string) => void;
  editingDocument: boolean;
  onEditDocument: () => void;
  onCancelDocumentEdit: () => void;
  onSaveDocument: () => void;
  saveError: Error | null;
  saving: boolean;
}) {
  return (
    <TheftSurface tone="plain" padding="none" className="theft-library-workspace grid overflow-hidden">
      <LibraryShelf
        groups={groups}
        pinnedItems={pinnedItems}
        selectedItemId={selectedItemId}
        pinnedIds={pinnedIds}
        onSelect={onSelect}
        onTogglePin={onTogglePin}
      />

      <section className="min-h-0 overflow-y-auto bg-card p-5">
        {selectedItem ? (
          <LibraryDetail
            item={selectedItem}
            pinned={pinnedIds.has(selectedItem.id)}
            onTogglePin={() => onTogglePin(selectedItem)}
            document={document}
            documentLoading={documentLoading}
            documentDraft={documentDraft}
            onDocumentDraftChange={onDocumentDraftChange}
            editingDocument={editingDocument}
            onEditDocument={onEditDocument}
            onCancelDocumentEdit={onCancelDocumentEdit}
            onSaveDocument={onSaveDocument}
            saveError={saveError}
            saving={saving}
          />
        ) : (
          <EmptyState icon={LibraryIcon} message="Select a Library item." />
        )}
      </section>
    </TheftSurface>
  );
}
