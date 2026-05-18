import { ExternalLink } from "lucide-react";
import type { WorkspaceRuntimeControlRequest, WorkspaceRuntimeControlSections } from "./types";
import { CommandActionButtons } from "./CommandActionButtons";
import { getRunningRuntimeServiceUrl } from "./workspaceRuntimeModel";

export function WorkspaceRuntimeQuickControls({
  sections,
  isPending = false,
  pendingRequest = null,
  onAction,
  square,
}: {
  sections: WorkspaceRuntimeControlSections;
  isPending?: boolean;
  pendingRequest?: WorkspaceRuntimeControlRequest | null;
  onAction: (request: WorkspaceRuntimeControlRequest) => void;
  square?: boolean;
}) {
  const controlItems = sections.services.length > 0 ? sections.services : sections.otherServices;
  const serviceUrl = getRunningRuntimeServiceUrl(sections);

  if (controlItems.length === 0 && !serviceUrl) return null;

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
      {controlItems.length > 0 ? (
        <div className="flex max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {controlItems.map((item) => (
            <div key={item.key} className="flex min-w-0 flex-col gap-1 sm:items-end">
              {controlItems.length > 1 ? (
                <span className="truncate text-xs text-muted-foreground">{item.title}</span>
              ) : null}
              <CommandActionButtons
                item={item}
                isPending={isPending}
                pendingRequest={pendingRequest}
                onAction={onAction}
                square={square}
              />
            </div>
          ))}
        </div>
      ) : null}
      {serviceUrl ? (
        <a
          href={serviceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 items-center gap-1 self-start break-all text-xs text-muted-foreground hover:text-foreground hover:underline sm:self-end"
        >
          {serviceUrl}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : null}
    </div>
  );
}
