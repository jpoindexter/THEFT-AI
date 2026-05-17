import type { CSSProperties } from "react";
import { Check, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Company } from "@paperclipai/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";

export function WorkspaceIcon({ company }: { company: Company }) {
  return (
    <CompanyPatternIcon
      companyName={company.name}
      logoUrl={company.logoUrl}
      brandColor={company.brandColor}
      className="size-5 shrink-0 rounded-md text-micro"
    />
  );
}

export function SortableCompanyItem({
  company,
  isEditing,
  isSelected,
  onSelect,
}: {
  company: Company;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: (company: Company) => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id, disabled: !isEditing });
  // dnd-kit computes transform/transition at runtime; keeping these inline preserves drag behavior.
  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <DropdownMenuItem
      ref={setNodeRef}
      style={sortableStyle}
      onSelect={(event) => {
        if (isEditing) {
          event.preventDefault();
          return;
        }
        onSelect(company);
      }}
      className={cn(
        "min-w-0 gap-2 py-2",
        isEditing && "cursor-grab",
        isDragging && "opacity-80",
        isSelected && "bg-accent text-accent-foreground",
      )}
    >
      <WorkspaceIcon company={company} />
      <span className="min-w-0 flex-1 truncate">{company.name}</span>
      {isEditing ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          ref={setActivatorNodeRef}
          aria-label={`Reorder ${company.name}`}
          className="size-6 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </Button>
      ) : (
        <>
          <Badge variant="secondary" className="shrink-0 rounded-sm font-mono text-nano text-muted-foreground">
            {company.issuePrefix}
          </Badge>
          {isSelected ? <Check className="size-4 text-muted-foreground" /> : null}
        </>
      )}
    </DropdownMenuItem>
  );
}
