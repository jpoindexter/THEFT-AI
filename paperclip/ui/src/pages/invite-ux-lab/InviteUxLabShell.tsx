import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FlaskConical } from "lucide-react";
import { labHighlights, type StatusFixture } from "./inviteUxLabData";

export function InviteUxLabHero() {
  return (
    <Card>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Invite UX Lab
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Invite and signup UX review surface</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            This page collects the current invite landing, signup, approval-result, and company invite-management states in one place so styling changes can be reviewed without recreating each backend condition by hand.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="outline">/tests/ux/invites</Badge>
            <Badge variant="outline">signup + invite states</Badge>
            <Badge variant="outline">fixture-backed preview</Badge>
          </div>
        </div>

        <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="theft-label text-muted-foreground">Covered states</div>
          <div className="mt-4 space-y-3">
            {labHighlights.map((highlight) => (
              <div key={highlight} className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {highlight}
              </div>
            ))}
          </div>
        </aside>
      </CardContent>
    </Card>
  );
}

export function LabSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-background p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="theft-label text-muted-foreground">{eyebrow}</div>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function StatusCard({ fixture }: { fixture: StatusFixture }) {
  const Icon = fixture.icon;
  const toneClassName = {
    default: "border-border bg-card",
    warn: "border-border bg-muted/50",
    success: "border-border bg-muted/50",
    error: "border-destructive/40 bg-card",
  }[fixture.tone ?? "default"];

  return (
    <Card className={cn("shadow-none", toneClassName)}>
      <CardHeader className="space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          <Icon className={cn("h-4 w-4", fixture.spin && "animate-spin")} />
        </div>
        <div>
          <CardTitle className="text-base">{fixture.title}</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">{fixture.body}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
