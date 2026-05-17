import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BreakablePath({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const segments = text.split(/(?<=[\/-])/);
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) parts.push(<wbr key={i} />);
    parts.push(segments[i]);
  }
  return <>{parts}</>;
}

export function CopyableInline({ value, label, mono }: { value: string; label?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1 group/copy">
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className={cn("min-w-0 break-words", mono && "font-mono")}>
        <BreakablePath text={value} />
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground opacity-0 transition-opacity hover:bg-accent/50 hover:text-foreground group-hover/copy:opacity-100 focus:opacity-100"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy"}
        aria-label={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}

export function WorkspaceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "border-chart-2/30 bg-chart-2/10 text-chart-2",
    idle: "bg-muted text-muted-foreground",
    in_review: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("border-transparent text-nano", colors[status] ?? colors.idle)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
