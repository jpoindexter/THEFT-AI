import type { ReactNode } from "react";

export function SettingsSection({
  title,
  tone = "default",
  testId,
  children,
}: {
  title: string;
  tone?: "default" | "destructive";
  testId?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4" data-testid={testId}>
      <div className={tone === "destructive" ? "theft-label-compact text-destructive" : "theft-label-compact"}>
        {title}
      </div>
      {children}
    </div>
  );
}
