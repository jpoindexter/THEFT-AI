import type { Issue } from "@paperclipai/shared";
import { Link } from "@/lib/router";

export function ApprovalLinkedIssues({ issues }: { issues: Issue[] }) {
  return (
    <div className="border-t border-border/60 pt-2">
      <p className="mb-1.5 text-xs text-muted-foreground">Linked Issues</p>
      <div className="space-y-1.5">
        {issues.map((issue) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.identifier ?? issue.id}`}
            className="block rounded border border-border/70 px-2 py-1.5 text-xs hover:bg-accent/20"
          >
            <span className="mr-2 font-mono text-muted-foreground">
              {issue.identifier ?? issue.id.slice(0, 8)}
            </span>
            <span>{issue.title}</span>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-micro text-muted-foreground">
        Linked issues remain open until the requesting agent follows up and closes them.
      </p>
    </div>
  );
}
