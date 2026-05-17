import { useId, useState, type ReactNode } from "react";
import {
  ChevronDown,
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MetadataRow, formatSystemNoticeTimestamp } from "@/components/system-notice/SystemNoticeMetadata";

export type SystemNoticeTone = "neutral" | "info" | "success" | "warning" | "danger";

export type SystemNoticeMetadataRow =
  | { kind: "text"; label: string; value: string }
  | { kind: "code"; label: string; value: string }
  | { kind: "issue"; label: string; identifier: string; href?: string; title?: string }
  | { kind: "agent"; label: string; name: string; href?: string }
  | { kind: "run"; label: string; runId: string; href?: string; status?: string };

export type SystemNoticeMetadataSection = {
  title?: string;
  rows: SystemNoticeMetadataRow[];
};

export type SystemNoticeProps = {
  tone?: SystemNoticeTone;
  /** Short label that names the system actor + tone, e.g. "System warning". Required so tone is not color-only. */
  label?: string;
  /** Short visible body — one or two sentences from the system perspective. */
  body: ReactNode;
  /** Optional small chip for the originating run link. */
  source?: { label: string; href?: string };
  /** Hidden-by-default metadata. Renders the Details affordance only when present. */
  metadata?: SystemNoticeMetadataSection[];
  /** Force the details panel open initially. Defaults to false (collapsed). */
  detailsDefaultOpen?: boolean;
  /** Optional ISO timestamp shown next to the label. */
  timestamp?: string;
  className?: string;
};

export type ToneTokens = {
  container: string;
  iconWrap: string;
  icon: LucideIcon;
  iconClass: string;
  label: string;
  divider: string;
};

const TONE_TOKENS: Record<SystemNoticeTone, ToneTokens> = {
  neutral: {
    container:
      "border-border bg-muted/35 dark:bg-muted/20",
    iconWrap: "bg-muted text-foreground/70",
    icon: Info,
    iconClass: "text-muted-foreground",
    label: "text-muted-foreground",
    divider: "border-border/70",
  },
  info: {
    container:
      "border-sky-300/70 bg-sky-50/70 dark:border-sky-500/30 dark:bg-sky-500/10",
    iconWrap: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    icon: Info,
    iconClass: "text-sky-700 dark:text-sky-300",
    label: "text-sky-800 dark:text-sky-200",
    divider: "border-sky-300/50 dark:border-sky-500/30",
  },
  success: {
    container:
      "border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10",
    iconWrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    icon: CircleCheck,
    iconClass: "text-emerald-700 dark:text-emerald-300",
    label: "text-emerald-800 dark:text-emerald-200",
    divider: "border-emerald-300/50 dark:border-emerald-500/30",
  },
  warning: {
    container:
      "border-amber-300/70 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10",
    iconWrap: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    icon: TriangleAlert,
    iconClass: "text-amber-700 dark:text-amber-300",
    label: "text-amber-900 dark:text-amber-200",
    divider: "border-amber-300/60 dark:border-amber-500/30",
  },
  danger: {
    container:
      "border-red-400/60 bg-red-50/80 dark:border-red-500/35 dark:bg-red-500/10",
    iconWrap: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
    icon: OctagonAlert,
    iconClass: "text-red-700 dark:text-red-300",
    label: "text-red-900 dark:text-red-200",
    divider: "border-red-400/50 dark:border-red-500/30",
  },
};

export function SystemNotice({
  tone = "neutral",
  label,
  body,
  source,
  metadata,
  detailsDefaultOpen = false,
  timestamp,
  className,
}: SystemNoticeProps) {
  const tokens = TONE_TOKENS[tone];
  const ToneIcon = tokens.icon;
  const [open, setOpen] = useState(detailsDefaultOpen);
  const detailsId = useId();
  const hasDetails = Boolean(metadata && metadata.length > 0);
  const resolvedLabel =
    label ??
    {
      neutral: "System notice",
      info: "System notice",
      success: "System notice",
      warning: "System warning",
      danger: "System alert",
    }[tone];

  return (
    <section
      role="status"
      aria-label={resolvedLabel}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border text-sm shadow-xs",
        tokens.container,
        className,
      )}
    >
      <header className="flex items-start gap-3 px-3 py-2.5 sm:px-4">
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            tokens.iconWrap,
          )}
          aria-hidden
        >
          <ToneIcon className={cn("h-4 w-4", tokens.iconClass)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="theft-label-compact flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold">
            <span className={tokens.label}>{resolvedLabel}</span>
            {source ? (
              <>
                <span className="text-muted-foreground/60" aria-hidden>·</span>
                {source.href ? (
                  <a
                    href={source.href}
                    className="rounded-sm font-medium normal-case tracking-normal text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {source.label}
                  </a>
                ) : (
                  <span className="font-medium normal-case tracking-normal text-muted-foreground">
                    {source.label}
                  </span>
                )}
              </>
            ) : null}
            {timestamp ? (
              <>
                <span className="text-muted-foreground/60" aria-hidden>·</span>
                <span className="font-medium normal-case tracking-normal text-muted-foreground">
                  {formatSystemNoticeTimestamp(timestamp)}
                </span>
              </>
            ) : null}
          </div>
          <div className="mt-1 break-words text-sm leading-6 text-foreground">{body}</div>
        </div>
        {hasDetails ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailsId}
            className={cn(
              "theft-label-compact ml-1 h-7 shrink-0 gap-1 border border-transparent px-2 font-medium text-muted-foreground",
              "hover:border-border/70 hover:bg-background/70 hover:text-foreground",
            )}
          >
            <span>{open ? "Hide details" : "Details"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                open && "rotate-180",
              )}
            />
          </Button>
        ) : null}
      </header>
      {hasDetails && open ? (
        <div
          id={detailsId}
          className={cn(
            "border-t bg-background/50 dark:bg-background/30",
            tokens.divider,
          )}
        >
          <div className="divide-y divide-border/50 px-1 py-1">
            {metadata!.map((section, sectionIdx) => (
              <div key={sectionIdx} className="py-1.5 first:pt-2 last:pb-2">
                {section.title ? (
                  <div className="theft-label-compact px-3 pb-1 pt-0.5 text-nano font-semibold">
                    {section.title}
                  </div>
                ) : null}
                <div>
                  {section.rows.map((row, rowIdx) => (
                    <MetadataRow key={rowIdx} row={row} tone={tokens} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default SystemNotice;
