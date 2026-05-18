import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  catchUpPolicies,
  catchUpPolicyDescriptions,
  concurrencyPolicies,
  concurrencyPolicyDescriptions,
  type RoutineEditDraft,
} from "./routineDetailModel";

export function AdvancedDeliverySettings({
  open,
  editDraft,
  onOpenChange,
  onDraftChange,
}: {
  open: boolean;
  editDraft: RoutineEditDraft;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (patch: Partial<RoutineEditDraft>) => void;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-medium">Advanced delivery settings</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="theft-label-compact text-muted-foreground">Concurrency</p>
            <Select
              value={editDraft.concurrencyPolicy}
              onValueChange={(concurrencyPolicy) => onDraftChange({ concurrencyPolicy })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {concurrencyPolicies.map((value) => (
                  <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{concurrencyPolicyDescriptions[editDraft.concurrencyPolicy]}</p>
          </div>
          <div className="space-y-2">
            <p className="theft-label-compact text-muted-foreground">Catch-up</p>
            <Select
              value={editDraft.catchUpPolicy}
              onValueChange={(catchUpPolicy) => onDraftChange({ catchUpPolicy })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {catchUpPolicies.map((value) => (
                  <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{catchUpPolicyDescriptions[editDraft.catchUpPolicy]}</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
