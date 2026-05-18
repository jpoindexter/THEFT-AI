import { IssueDetailContent } from "../components/issue-detail/IssueDetailContent";
import { IssueDetailLoadingState } from "../components/issue-detail/IssueDetailLoadingState";
import { useIssueDetailActionState } from "../components/issue-detail/useIssueDetailActionState";
import { useIssueDetailPrimaryState } from "../components/issue-detail/useIssueDetailPrimaryState";

export function IssueDetail() {
  const primary = useIssueDetailPrimaryState();
  const actions = useIssueDetailActionState(primary);

  if (primary.isLoading) return <IssueDetailLoadingState headerSeed={primary.issueHeaderSeed} />;
  if (primary.error) return <p className="text-sm text-destructive">{primary.error.message}</p>;
  if (!primary.issue) return null;

  return <IssueDetailContent primary={primary} actions={actions} />;
}
