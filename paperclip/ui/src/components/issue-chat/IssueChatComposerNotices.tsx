export function IssueChatComposerDisabledNotice({
  reason,
}: {
  reason: string;
}) {
  return (
    <div className="rounded-md border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      {reason}
    </div>
  );
}

export function IssueChatComposerHint({
  children,
}: {
  children: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-micro text-muted-foreground">
      {children}
    </div>
  );
}
