import { cn } from "../../lib/utils";

export function InteractionField({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "subtle";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-nano font-medium uppercase tracking-widest",
        tone === "default"
          ? "border-border/70 bg-transparent text-foreground"
          : "border-border/60 bg-transparent text-muted-foreground",
      )}
    >
      {label}: {value}
    </span>
  );
}
