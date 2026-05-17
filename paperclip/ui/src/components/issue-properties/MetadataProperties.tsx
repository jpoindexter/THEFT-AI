import type { Issue } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { Identity } from "../Identity";
import { timeAgo } from "../../lib/timeAgo";
import { formatDateTime } from "../../lib/utils";
import { PropertyRow } from "./PropertyLayout";

interface MetadataPropertiesProps {
  issue: Issue;
  creatorUserLabel: string | null | undefined;
  agentName: (id: string | null) => string | null;
}

export function MetadataProperties({
  issue,
  creatorUserLabel,
  agentName,
}: MetadataPropertiesProps) {
  return (
    <>
      <Separator />

      <div className="space-y-1">
        {(issue.createdByAgentId || issue.createdByUserId) && (
          <PropertyRow label="Created by">
            {issue.createdByAgentId ? (
              <Link
                to={`/agents/${issue.createdByAgentId}`}
                className="hover:underline"
              >
                <Identity name={agentName(issue.createdByAgentId) ?? issue.createdByAgentId.slice(0, 8)} size="sm" />
              </Link>
            ) : (
              <>
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{creatorUserLabel ?? "User"}</span>
              </>
            )}
          </PropertyRow>
        )}
        {issue.startedAt && (
          <PropertyRow label="Started">
            <span className="text-sm">{formatDateTime(issue.startedAt)}</span>
          </PropertyRow>
        )}
        {issue.completedAt && (
          <PropertyRow label="Completed">
            <span className="text-sm">{formatDateTime(issue.completedAt)}</span>
          </PropertyRow>
        )}
        <PropertyRow label="Created">
          <span className="text-sm">{formatDateTime(issue.createdAt)}</span>
        </PropertyRow>
        <PropertyRow label="Updated">
          <span className="text-sm">{timeAgo(issue.updatedAt)}</span>
        </PropertyRow>
      </div>
    </>
  );
}
