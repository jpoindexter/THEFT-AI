import { Button } from "@/components/ui/button";

import type { EnvironmentFormProps } from "./EnvironmentForm";

export function EnvironmentFormActions({
  editingEnvironmentId,
  environmentForm,
  environmentFormValid,
  environmentMutation,
  draftEnvironmentProbeMutation,
  onCancel,
}: Pick<EnvironmentFormProps, "editingEnvironmentId" | "environmentForm" | "environmentFormValid" | "environmentMutation" | "draftEnvironmentProbeMutation" | "onCancel">) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => environmentMutation.mutate(environmentForm)} disabled={environmentMutation.isPending || !environmentFormValid}>
        {environmentMutation.isPending ? editingEnvironmentId ? "Saving..." : "Creating..." : editingEnvironmentId ? "Save environment" : "Create environment"}
      </Button>
      {editingEnvironmentId ? (
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={environmentMutation.isPending}>Cancel</Button>
      ) : null}
      {environmentForm.driver !== "local" ? (
        <Button size="sm" variant="outline" onClick={() => draftEnvironmentProbeMutation.mutate(environmentForm)} disabled={draftEnvironmentProbeMutation.isPending || !environmentFormValid}>
          {draftEnvironmentProbeMutation.isPending ? "Testing..." : "Test draft"}
        </Button>
      ) : null}
      {environmentMutation.isError ? (
        <span className="text-xs text-destructive">{environmentMutation.error instanceof Error ? environmentMutation.error.message : "Failed to save environment"}</span>
      ) : null}
      {draftEnvironmentProbeMutation.data ? (
        <span className="text-xs text-muted-foreground">{draftEnvironmentProbeMutation.data.summary}</span>
      ) : null}
    </div>
  );
}
