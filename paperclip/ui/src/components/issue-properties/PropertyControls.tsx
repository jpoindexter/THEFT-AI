import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function ProjectSwatch({ color }: { color?: string | null }) {
  if (color) {
    return <span className="h-3 w-3 shrink-0 rounded-sm bg-primary/60" />;
  }

  return <span className="shrink-0 h-3 w-3 rounded-sm bg-primary" />;
}

export function TruncatedCopyable({
  value,
  icon: Icon,
}: {
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }, [value]);

  return (
    <div className="flex items-start gap-1.5 min-w-0 flex-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="h-auto min-w-0 flex-1 justify-start whitespace-normal break-all rounded-sm px-0 py-0 text-left font-mono text-sm cursor-pointer transition-colors hover:bg-transparent hover:text-foreground"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Click to copy"}
      >
        {value}
      </Button>
      {copied && <Check className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />}
    </div>
  );
}
