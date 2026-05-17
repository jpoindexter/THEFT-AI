import { lazy, Suspense } from "react";
import { useDialogState } from "../../context/DialogContext";

const NewIssueDialog = lazy(async () => ({ default: (await import("../NewIssueDialog")).NewIssueDialog }));
const NewProjectDialog = lazy(async () => ({ default: (await import("../NewProjectDialog")).NewProjectDialog }));
const NewGoalDialog = lazy(async () => ({ default: (await import("../NewGoalDialog")).NewGoalDialog }));
const NewAgentDialog = lazy(async () => ({ default: (await import("../NewAgentDialog")).NewAgentDialog }));

export function LazyLayoutDialogs() {
  const {
    newIssueOpen,
    newProjectOpen,
    newGoalOpen,
    newAgentOpen,
  } = useDialogState();

  return (
    <Suspense fallback={null}>
      {newIssueOpen ? <NewIssueDialog /> : null}
      {newProjectOpen ? <NewProjectDialog /> : null}
      {newGoalOpen ? <NewGoalDialog /> : null}
      {newAgentOpen ? <NewAgentDialog /> : null}
    </Suspense>
  );
}
