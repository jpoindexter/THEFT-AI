import { useMemo, useState } from "react";
import type { Issue, IssueLabel } from "@paperclipai/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Tag } from "lucide-react";
import { issuesApi } from "../../api/issues";
import { queryKeys } from "../../lib/queryKeys";
import { cn } from "../../lib/utils";
import { defaultNewLabelColor } from "./helpers";
import { PropertyPicker } from "./PropertyLayout";

interface LabelsPropertyProps {
  issue: Issue;
  companyId: string | null | undefined;
  inline?: boolean;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function LabelsProperty({ issue, companyId, inline, onUpdate }: LabelsPropertyProps) {
  const queryClient = useQueryClient();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(defaultNewLabelColor);

  const { data: labels } = useQuery({
    queryKey: queryKeys.issues.labels(companyId!),
    queryFn: () => issuesApi.listLabels(companyId!),
    enabled: !!companyId,
  });

  const createLabel = useMutation({
    mutationFn: (data: { name: string; color: string }) => issuesApi.createLabel(companyId!, data),
    onSuccess: async (created) => {
      queryClient.setQueryData<IssueLabel[] | undefined>(
        queryKeys.issues.labels(companyId!),
        (current) => {
          if (!current) return [created];
          if (current.some((label) => label.id === created.id)) return current;
          return [...current, created];
        },
      );
      onUpdate({ labelIds: [...(issue.labelIds ?? []), created.id] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.labels(companyId!) });
      setNewLabelName("");
    },
  });

  const toggleLabel = (labelId: string) => {
    const ids = issue.labelIds ?? [];
    const next = ids.includes(labelId)
      ? ids.filter((id) => id !== labelId)
      : [...ids, labelId];
    onUpdate({ labelIds: next });
  };

  const selectedIssueLabels = useMemo(() => {
    const selectedIds = issue.labelIds ?? [];
    if (selectedIds.length === 0) return issue.labels ?? [];

    const labelById = new Map<string, IssueLabel>();
    for (const label of labels ?? []) labelById.set(label.id, label);
    for (const label of issue.labels ?? []) labelById.set(label.id, label);

    return selectedIds
      .map((id) => labelById.get(id))
      .filter((label): label is IssueLabel => Boolean(label));
  }, [issue.labelIds, issue.labels, labels]);

  const labelsTrigger = selectedIssueLabels.length > 0 ? (
    <div className="flex items-center gap-1 flex-wrap">
      {selectedIssueLabels.slice(0, 3).map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {label.name}
        </span>
      ))}
      {selectedIssueLabels.length > 3 && (
        <span className="text-xs text-muted-foreground">+{selectedIssueLabels.length - 3}</span>
      )}
    </div>
  ) : (
    <>
      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">No labels</span>
    </>
  );
  const labelsExtra = (issue.labelIds ?? []).length > 0 ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
      onClick={() => setLabelsOpen(true)}
      aria-label="Add label"
      title="Add label"
    >
      <Plus className="h-3 w-3" />
    </Button>
  ) : undefined;

  return (
    <PropertyPicker
      inline={inline}
      label="Labels"
      open={labelsOpen}
      onOpenChange={(open) => { setLabelsOpen(open); if (!open) setLabelSearch(""); }}
      triggerContent={labelsTrigger}
      triggerClassName="min-w-0 max-w-full"
      popoverClassName="w-64"
      extra={labelsExtra}
    >
      <Input
        className="mb-1 h-8 px-2 py-1.5 text-xs shadow-none md:text-xs"
        placeholder="Search labels..."
        value={labelSearch}
        onChange={(e) => setLabelSearch(e.target.value)}
        autoFocus={!inline}
      />
      <div className="max-h-44 overflow-y-auto overscroll-contain space-y-0.5">
        {(labels ?? [])
          .filter((label) => {
            if (!labelSearch.trim()) return true;
            return label.name.toLowerCase().includes(labelSearch.toLowerCase());
          })
          .map((label) => {
            const selected = (issue.labelIds ?? []).includes(label.id);
            return (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                key={label.id}
                className={cn(
                  "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-left text-xs",
                  selected && "bg-accent",
                )}
                onClick={() => toggleLabel(label.id)}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/60" />
                <span className="truncate flex-1">{label.name}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />}
              </Button>
            );
          })}
      </div>
      <div className="mt-2 border-t border-border pt-2 space-y-1">
        <div className="flex items-center gap-1">
          <Input
            className="h-7 w-7 p-0 rounded bg-transparent"
            type="color"
            value={newLabelColor}
            onChange={(e) => setNewLabelColor(e.target.value)}
          />
          <Input
            className="h-8 flex-1 px-2 py-1.5 text-xs shadow-none md:text-xs"
            placeholder="New label"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="flex w-full items-center justify-center gap-1.5 px-2 py-1.5 text-xs disabled:opacity-50"
          disabled={!newLabelName.trim() || createLabel.isPending}
          onClick={() =>
            createLabel.mutate({
              name: newLabelName.trim(),
              color: newLabelColor,
            })
          }
        >
          <Plus className="h-3 w-3" />
          {createLabel.isPending ? "Creating…" : "Create label"}
        </Button>
      </div>
    </PropertyPicker>
  );
}
