import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { getWorktreeUiBranding } from "../lib/worktree-branding";

export function WorktreeBanner() {
  const branding = getWorktreeUiBranding();
  const [copied, setCopied] = useState(false);

  const handleCopyName = useCallback(() => {
    if (!branding) return;
    navigator.clipboard.writeText(branding.name).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [branding]);

  if (!branding) return null;

  return (
    <div
      className="theft-label-compact relative overflow-hidden border-b px-3 py-1.5 font-medium"
      style={{
        backgroundColor: branding.color,
        color: branding.textColor,
        borderColor: `${branding.textColor}22`,
        boxShadow: `inset 0 -0.0625rem 0 ${branding.textColor}18`,
        backgroundImage: `linear-gradient(90deg, ${branding.textColor}14, transparent 28%, transparent 72%, ${branding.textColor}12), repeating-linear-gradient(135deg, transparent 0 0.625rem, ${branding.textColor}08 0.625rem 1.25rem)`,
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
        <span className="shrink-0 opacity-70">Worktree</span>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleCopyName}
          title="Click to copy worktree name"
          className="h-auto min-w-0 shrink cursor-pointer truncate rounded-sm bg-transparent p-0 font-semibold uppercase tracking-wider text-current hover:bg-transparent hover:text-current hover:opacity-80"
        >
          {copied ? "Copied!" : branding.name}
        </Button>
      </div>
    </div>
  );
}
