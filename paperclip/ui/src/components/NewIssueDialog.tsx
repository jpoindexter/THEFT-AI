import { NewIssueDialogSurface } from "./new-issue-dialog/NewIssueDialogSurface";
import { useNewIssueDialogController } from "./new-issue-dialog/useNewIssueDialogController";

export function NewIssueDialog() {
  const dialogProps = useNewIssueDialogController();
  return <NewIssueDialogSurface {...dialogProps} />;
}
