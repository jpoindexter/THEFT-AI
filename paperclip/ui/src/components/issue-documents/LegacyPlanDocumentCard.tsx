import { FileText } from "lucide-react";

import { cn } from "../../lib/utils";
import { renderFoldableBody } from "./IssueDocumentUtils";

interface LegacyPlanDocumentCardProps {
  body: string;
  highlighted: boolean;
  bodyClassName: string;
}

export function LegacyPlanDocumentCard({
  body,
  highlighted,
  bodyClassName,
}: LegacyPlanDocumentCardProps) {
  return (
    <div
      id="document-plan"
      className={cn(
        "rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 transition-colors duration-1000",
        highlighted && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-amber-600" />
        <span className="rounded-full border border-amber-500/30 px-2 py-0.5 font-mono text-nano uppercase tracking-widest text-amber-700 dark:text-amber-300">
          PLAN
        </span>
      </div>
      {renderFoldableBody(body, bodyClassName)}
    </div>
  );
}
