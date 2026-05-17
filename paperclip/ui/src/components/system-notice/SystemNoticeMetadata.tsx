import { cn } from "@/lib/utils";
import type { SystemNoticeMetadataRow, ToneTokens } from "@/components/SystemNotice";

export function formatSystemNoticeTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function MetadataRow({ row, tone }: { row: SystemNoticeMetadataRow; tone: ToneTokens }) {
  return (
    <div className="flex flex-col gap-x-3 gap-y-0.5 px-3 py-1.5 text-xs sm:flex-row">
      <div className="theft-label-compact shrink-0 truncate font-medium sm:w-32">
        {row.label}
      </div>
      <div className="min-w-0 break-words text-foreground/90">
        {(() => {
          switch (row.kind) {
            case "text":
              return <span>{row.value}</span>;
            case "code":
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-micro text-foreground/80">
                  {row.value}
                </code>
              );
            case "issue": {
              const issueLabel = (
                <>
                  <span>{row.identifier}</span>
                  {row.title ? (
                    <span className="text-muted-foreground">— {row.title}</span>
                  ) : null}
                </>
              );
              if (row.href) {
                return (
                  <a
                    href={row.href}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm font-medium underline-offset-2 hover:underline",
                      tone.label,
                    )}
                  >
                    {issueLabel}
                  </a>
                );
              }
              return (
                <span className={cn("inline-flex items-center gap-1 font-medium", tone.label)}>
                  {issueLabel}
                </span>
              );
            }
            case "agent":
              if (row.href) {
                return (
                  <a
                    href={row.href}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm font-medium underline-offset-2 hover:underline",
                      tone.label,
                    )}
                  >
                    {row.name}
                  </a>
                );
              }
              return (
                <span className={cn("font-medium", tone.label)}>{row.name}</span>
              );
            case "run": {
              const runShort = row.runId.length > 12 ? `${row.runId.slice(0, 8)}…` : row.runId;
              const inner = (
                <>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-foreground/80">{runShort}</code>
                  {row.status ? (
                    <span className={cn("font-sans", tone.label)}>{row.status}</span>
                  ) : null}
                </>
              );
              if (row.href) {
                return (
                  <a
                    href={row.href}
                    className="inline-flex items-center gap-2 rounded-sm font-mono text-micro underline-offset-2 hover:underline"
                  >
                    {inner}
                  </a>
                );
              }
              return (
                <span className="inline-flex items-center gap-2 font-mono text-micro">
                  {inner}
                </span>
              );
            }
          }
        })()}
      </div>
    </div>
  );
}
