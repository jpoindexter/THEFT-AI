import type { LucideIcon } from "lucide-react";
import { FileArchive, FileText, Folder, Pin, PinOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TheftChip } from "@/components/theft";
import type { LibraryItem } from "@/lib/library-items";
import { itemKindLabel } from "@/lib/libraryPage";
import { cn } from "@/lib/utils";

export function LibraryShelf({
  groups,
  pinnedItems,
  selectedItemId,
  pinnedIds,
  onSelect,
  onTogglePin,
}: {
  groups: Array<{ department: string; departmentKey: string; items: LibraryItem[] }>;
  pinnedItems: LibraryItem[];
  selectedItemId: string | null;
  pinnedIds: Set<string>;
  onSelect: (item: LibraryItem) => void;
  onTogglePin: (item: LibraryItem) => void;
}) {
  return (
    <section className="min-h-0 overflow-y-auto border-r border-border bg-card/50 p-4">
      {pinnedItems.length > 0 ? (
        <div className="mb-5">
          <LibraryShelfHeader icon={Pin} label="Pinned company memory" />
          <div className="space-y-2">
            {pinnedItems.slice(0, 6).map((item) => (
              <LibraryRow
                key={item.id}
                item={item}
                selected={selectedItemId === item.id}
                pinned={pinnedIds.has(item.id)}
                onSelect={() => onSelect(item)}
                onTogglePin={() => onTogglePin(item)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No Library items match this filter.</div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.departmentKey}>
              <LibraryShelfHeader icon={Folder} label={group.department} count={group.items.length} />
              <div className="space-y-2">
                {group.items.map((item) => (
                  <LibraryRow
                    key={item.id}
                    item={item}
                    selected={selectedItemId === item.id}
                    pinned={pinnedIds.has(item.id)}
                    onSelect={() => onSelect(item)}
                    onTogglePin={() => onTogglePin(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LibraryShelfHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
      {typeof count === "number" ? (
        <TheftChip tone="muted" density="compact">
          {count}
        </TheftChip>
      ) : null}
    </div>
  );
}

function LibraryRow({
  item,
  selected,
  pinned,
  onSelect,
  onTogglePin,
}: {
  item: LibraryItem;
  selected: boolean;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const Icon = itemIcon(item);
  return (
    <div
      className={cn(
        "theft-surface-plain group flex w-full items-start gap-3 px-3 py-2 text-left transition-colors",
        selected ? "theft-selected-surface" : "hover:bg-accent/40",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        className="h-auto min-w-0 flex-1 justify-start gap-3 p-0 text-left font-normal hover:bg-transparent"
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{item.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {itemKindLabel(item)} · {item.sourceTaskLabel}
          </span>
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={pinned ? "Unpin item" : "Pin item"}
        onClick={onTogglePin}
        className="text-muted-foreground opacity-70 hover:bg-background hover:text-foreground group-hover:opacity-100"
      >
        {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function itemIcon(item: LibraryItem) {
  if (item.kind === "attachment") return FileArchive;
  if (item.kind === "work_product") return Star;
  return FileText;
}
