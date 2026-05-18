import type { Company } from "@paperclipai/shared";
import { Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "../../lib/utils";

type DialogCompany = Pick<Company, "id" | "name" | "brandColor" | "status">;

function CompanyInitials({ company }: { company: DialogCompany | null | undefined }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-nano font-semibold leading-none text-muted-foreground">
      {(company?.name ?? "").slice(0, 3).toUpperCase()}
    </span>
  );
}

type NewIssueDialogHeaderProps = {
  companyOpen: boolean;
  companies: DialogCompany[];
  dialogCompany: DialogCompany | null | undefined;
  effectiveCompanyId: string | null | undefined;
  expanded: boolean;
  isSubIssueMode: boolean;
  pending: boolean;
  onClose: () => void;
  onCompanyChange: (companyId: string) => void;
  onCompanyOpenChange: (open: boolean) => void;
  onExpandedChange: (expanded: boolean) => void;
};

export function NewIssueDialogHeader({
  companyOpen,
  companies,
  dialogCompany,
  effectiveCompanyId,
  expanded,
  isSubIssueMode,
  pending,
  onClose,
  onCompanyChange,
  onCompanyOpenChange,
  onExpandedChange,
}: NewIssueDialogHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Popover open={companyOpen} onOpenChange={onCompanyOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-auto px-0.5 py-0 hover:bg-accent/50"
              disabled={isSubIssueMode}
            >
              <CompanyInitials company={dialogCompany} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            {companies.filter((company) => company.status !== "archived").map((company) => (
              <Button
                key={company.id}
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  "w-full justify-start gap-2 font-normal hover:bg-accent/50",
                  company.id === effectiveCompanyId && "bg-accent",
                )}
                onClick={() => {
                  onCompanyChange(company.id);
                  onCompanyOpenChange(false);
                }}
              >
                <CompanyInitials company={company} />
                <span className="truncate">{company.name}</span>
              </Button>
            ))}
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground/60">&rsaquo;</span>
        <span>{isSubIssueMode ? "New sub-issue" : "New issue"}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          onClick={() => onExpandedChange(!expanded)}
          disabled={pending}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          onClick={onClose}
          disabled={pending}
        >
          <span className="text-lg leading-none">&times;</span>
        </Button>
      </div>
    </div>
  );
}
