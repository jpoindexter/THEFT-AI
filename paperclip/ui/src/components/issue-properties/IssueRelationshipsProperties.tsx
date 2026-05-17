import { useMemo, useState } from "react";
import type { Issue, IssueRelationIssueSummary } from "@paperclipai/shared";
import { useQuery } from "@tanstack/react-query";
import { issuesApi } from "../../api/issues";
import { queryKeys } from "../../lib/queryKeys";
import { IssueBlockedByProperty } from "./IssueBlockedByProperty";
import { IssueParentProperty } from "./IssueParentProperty";
import { IssueReferenceRows } from "./IssueReferenceRows";

interface IssueRelationshipsPropertiesProps {
  issue: Issue;
  childIssues: Issue[];
  companyId: string | null | undefined;
  inline?: boolean;
  onAddSubIssue?: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
}

type RelatedIssueReference = Pick<IssueRelationIssueSummary, "id" | "identifier" | "title"> &
  Partial<Pick<IssueRelationIssueSummary, "status">>;

export function IssueRelationshipsProperties({
  issue,
  childIssues,
  companyId,
  inline,
  onAddSubIssue,
  onUpdate,
}: IssueRelationshipsPropertiesProps) {
  const [blockedByOpen, setBlockedByOpen] = useState(false);
  const [blockedBySearch, setBlockedBySearch] = useState("");
  const [parentOpen, setParentOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const { data: allIssues } = useQuery({
    queryKey: queryKeys.issues.list(companyId!),
    queryFn: () => issuesApi.list(companyId!),
    enabled: !!companyId && (blockedByOpen || parentOpen),
  });

  const relatedTasks = useMemo<RelatedIssueReference[]>(() => {
    const excluded = new Set<string>();
    const addExcluded = (candidate: { id: string; identifier?: string | null }) => {
      excluded.add(candidate.id);
      if (candidate.identifier) excluded.add(candidate.identifier);
    };

    for (const blocker of issue.blockedBy ?? []) addExcluded(blocker);
    for (const blocked of issue.blocks ?? []) addExcluded(blocked);
    for (const child of childIssues) addExcluded(child);

    const referencedIssues = issue.relatedWork?.outbound.map((item) => item.issue) ?? [];
    if (referencedIssues.length > 0) {
      return referencedIssues.filter((referenced) => {
        const label = referenced.identifier ?? referenced.id;
        return !excluded.has(referenced.id) && !excluded.has(label);
      });
    }

    return (issue.referencedIssueIdentifiers ?? [])
      .filter((identifier) => !excluded.has(identifier))
      .map((identifier) => ({ id: identifier, identifier, title: identifier }));
  }, [childIssues, issue.blockedBy, issue.blocks, issue.relatedWork?.outbound, issue.referencedIssueIdentifiers]);

  const descendantIssueIds = useMemo(() => {
    if (!allIssues?.length) return new Set<string>();
    const childrenByParentId = new Map<string, string[]>();
    for (const candidate of allIssues) {
      if (!candidate.parentId) continue;
      const children = childrenByParentId.get(candidate.parentId) ?? [];
      children.push(candidate.id);
      childrenByParentId.set(candidate.parentId, children);
    }

    const descendants = new Set<string>();
    const stack = [...(childrenByParentId.get(issue.id) ?? [])];
    while (stack.length > 0) {
      const candidateId = stack.pop();
      if (!candidateId || descendants.has(candidateId)) continue;
      descendants.add(candidateId);
      stack.push(...(childrenByParentId.get(candidateId) ?? []));
    }
    return descendants;
  }, [allIssues, issue.id]);
  const currentParentIssue = useMemo(() => {
    if (!issue.parentId) return null;
    return allIssues?.find((candidate) => candidate.id === issue.parentId) ?? null;
  }, [allIssues, issue.parentId]);
  const parentIdentifier = issue.ancestors?.[0]?.identifier ?? currentParentIssue?.identifier;
  const parentTitle = issue.ancestors?.[0]?.title ?? currentParentIssue?.title ?? issue.parentId?.slice(0, 8);
  const parentOptions = (allIssues ?? [])
    .filter((candidate) => candidate.id !== issue.id)
    .filter((candidate) => !descendantIssueIds.has(candidate.id))
    .filter((candidate) => {
      if (!parentSearch.trim()) return true;
      const query = parentSearch.toLowerCase();
      return (
        (candidate.identifier ?? "").toLowerCase().includes(query) ||
        candidate.title.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aLabel = `${a.identifier ?? ""} ${a.title}`.trim();
      const bLabel = `${b.identifier ?? ""} ${b.title}`.trim();
      return aLabel.localeCompare(bLabel);
    });
  const blockedByIds = issue.blockedBy?.map((relation) => relation.id) ?? [];
  const blockerOptions = (allIssues ?? [])
    .filter((candidate) => candidate.id !== issue.id)
    .filter((candidate) => {
      if (!blockedBySearch.trim()) return true;
      const query = blockedBySearch.toLowerCase();
      return (
        (candidate.identifier ?? "").toLowerCase().includes(query) ||
        candidate.title.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aLabel = `${a.identifier ?? ""} ${a.title}`.trim();
      const bLabel = `${b.identifier ?? ""} ${b.title}`.trim();
      return aLabel.localeCompare(bLabel);
    });

  return (
    <>
      <IssueParentProperty
        issue={issue}
        parentOpen={parentOpen}
        setParentOpen={setParentOpen}
        parentSearch={parentSearch}
        setParentSearch={setParentSearch}
        parentOptions={parentOptions}
        parentIdentifier={parentIdentifier}
        parentTitle={parentTitle}
        inline={inline}
        onUpdate={onUpdate}
      />

      <IssueBlockedByProperty
        issue={issue}
        blockedByOpen={blockedByOpen}
        setBlockedByOpen={setBlockedByOpen}
        blockedBySearch={blockedBySearch}
        setBlockedBySearch={setBlockedBySearch}
        blockedByIds={blockedByIds}
        blockerOptions={blockerOptions}
        inline={inline}
        onUpdate={onUpdate}
      />

      <IssueReferenceRows
        issue={issue}
        childIssues={childIssues}
        relatedTasks={relatedTasks}
        onAddSubIssue={onAddSubIssue}
      />
    </>
  );
}
