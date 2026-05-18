import { cn } from "@/lib/utils";

export type MatchSourceChipKind = "title" | "identifier" | "comment" | "document";

const chipStyles: Record<MatchSourceChipKind, string> = {
  title: "match-source-chip-title",
  identifier: "match-source-chip-identifier",
  comment: "match-source-chip-comment",
  document: "match-source-chip-document",
};

const chipLabels: Record<MatchSourceChipKind, string> = {
  title: "Title",
  identifier: "Identifier",
  comment: "Comment",
  document: "Doc",
};

export interface MatchSourceChipProps {
  kind: MatchSourceChipKind;
  count?: number;
  label?: string;
  className?: string;
}

export function MatchSourceChip({ kind, count, label, className }: MatchSourceChipProps) {
  const text = label ?? chipLabels[kind];
  const showCount = typeof count === "number" && count > 1;
  return (
    <span
      className={cn(
        "match-source-chip inline-flex items-center gap-1 rounded-full border px-2 py-px font-medium whitespace-nowrap",
        chipStyles[kind],
        className,
      )}
      data-kind={kind}
    >
      {text}
      {showCount ? <span className="opacity-80">×{count}</span> : null}
    </span>
  );
}
