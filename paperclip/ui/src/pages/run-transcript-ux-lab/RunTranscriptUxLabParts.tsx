import { ExternalLink, FlaskConical, MonitorCog, PanelsTopLeft, RadioTower } from "lucide-react";
import type { ComponentType } from "react";

import { Identity } from "@/components/Identity";
import { RunTranscriptView, type TranscriptDensity, type TranscriptMode } from "@/components/transcript/RunTranscriptView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { runTranscriptFixtureEntries, runTranscriptFixtureMeta } from "@/fixtures/runTranscriptFixtures";
import { cn, formatDateTime } from "@/lib/utils";

export type SurfaceId = "detail" | "live" | "dashboard";

export const surfaceOptions: Array<{
  id: SurfaceId;
  label: string;
  eyebrow: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "detail",
    label: "Run Detail",
    eyebrow: "Full transcript",
    description: "The long-form run page with the `Nice | Raw` toggle and the most inspectable transcript view.",
    icon: MonitorCog,
  },
  {
    id: "live",
    label: "Issue Widget",
    eyebrow: "Live stream",
    description: "The issue-detail live run widget, optimized for following an active run without leaving the task page.",
    icon: RadioTower,
  },
  {
    id: "dashboard",
    label: "Dashboard Card",
    eyebrow: "Dense card",
    description: "The active-agents dashboard card, tuned for compact scanning while keeping the same transcript language.",
    icon: PanelsTopLeft,
  },
];

export function SurfacePicker({
  selectedSurface,
  onSelect,
}: {
  selectedSurface: SurfaceId;
  onSelect: (surface: SurfaceId) => void;
}) {
  return (
    <div className="space-y-2">
      {surfaceOptions.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.id}
            type="button"
            variant={selectedSurface === option.id ? "secondary" : "outline"}
            className="h-auto w-full justify-start rounded-lg px-4 py-3 text-left"
            onClick={() => onSelect(option.id)}
          >
            <span className="flex items-start gap-3">
              <span className="rounded-md border border-border p-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="theft-label-compact block text-muted-foreground">
                  {option.eyebrow}
                </span>
                <span className="mt-1 block text-sm font-medium">{option.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export function LabHeading() {
  return (
    <div className="mb-5">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 theft-label-compact text-muted-foreground">
        <FlaskConical className="h-3.5 w-3.5" />
        UX Lab
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Run Transcript Fixtures</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Built from a real Paperclip development run, then sanitized so no secrets, local paths, or environment details survive into the fixture.
      </p>
    </div>
  );
}

export function SurfacePreview({
  selectedSurface,
  mode,
  streaming,
  density,
}: {
  selectedSurface: SurfaceId;
  mode: TranscriptMode;
  streaming: boolean;
  density: TranscriptDensity;
}) {
  if (selectedSurface === "detail") {
    return (
      <div className={cn(density === "compact" && "max-w-5xl")}>
        <RunDetailPreview mode={mode} streaming={streaming} density={density} />
      </div>
    );
  }
  if (selectedSurface === "live") {
    return (
      <div className={cn(density === "compact" && "max-w-4xl")}>
        <LiveWidgetPreview streaming={streaming} mode={mode} density={density} />
      </div>
    );
  }
  return <DashboardPreview streaming={streaming} mode={mode} density={density} />;
}

function RunDetailPreview({
  mode,
  streaming,
  density,
}: {
  mode: TranscriptMode;
  streaming: boolean;
  density: TranscriptDensity;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="border-b border-border bg-background px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="theft-label-compact">
            Run Detail
          </Badge>
          <StatusBadge status={streaming ? "running" : "succeeded"} />
          <span className="text-xs text-muted-foreground">
            {formatDateTime(runTranscriptFixtureMeta.startedAt)}
          </span>
        </div>
        <div className="mt-2 text-sm font-medium">
          Transcript ({runTranscriptFixtureEntries.length})
        </div>
      </div>
      <div className="max-h-screen overflow-y-auto bg-muted/20 p-5">
        <RunTranscriptView
          entries={runTranscriptFixtureEntries}
          mode={mode}
          density={density}
          streaming={streaming}
        />
      </div>
    </div>
  );
}

function LiveWidgetPreview({
  streaming,
  mode,
  density,
}: {
  streaming: boolean;
  mode: TranscriptMode;
  density: TranscriptDensity;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="theft-label-compact text-muted-foreground">
          Live Runs
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Compact live transcript stream for the issue detail page.
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Identity name={runTranscriptFixtureMeta.agentName} size="sm" />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2 py-1 font-mono">
                {runTranscriptFixtureMeta.sourceRunId.slice(0, 8)}
              </span>
              <StatusBadge status={streaming ? "running" : "succeeded"} />
              <span>{formatDateTime(runTranscriptFixtureMeta.startedAt)}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
            Open run
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto pr-1">
          <RunTranscriptView
            entries={previewEntries("live")}
            mode={mode}
            density={density}
            limit={density === "compact" ? 10 : 12}
            streaming={streaming}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardPreview({
  streaming,
  mode,
  density,
}: {
  streaming: boolean;
  mode: TranscriptMode;
  density: TranscriptDensity;
}) {
  return (
    <div className="max-w-md">
      <div className={cn(
        "flex h-80 flex-col overflow-hidden rounded-lg border",
        streaming ? "border-primary/30 bg-primary/5" : "border-border bg-background",
      )}>
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", streaming ? "bg-primary" : "bg-muted-foreground/35")} />
                <Identity name={runTranscriptFixtureMeta.agentName} size="sm" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {streaming ? "Live now" : "Finished 2m ago"}
              </div>
            </div>
            <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
              <ExternalLink className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">
            {runTranscriptFixtureMeta.issueIdentifier} - {runTranscriptFixtureMeta.issueTitle}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <RunTranscriptView
            entries={previewEntries("dashboard")}
            mode={mode}
            density={density}
            limit={density === "compact" ? 6 : 8}
            streaming={streaming}
          />
        </div>
      </div>
    </div>
  );
}

function previewEntries(surface: SurfaceId) {
  if (surface === "dashboard") return runTranscriptFixtureEntries.slice(-9);
  if (surface === "live") return runTranscriptFixtureEntries.slice(-14);
  return runTranscriptFixtureEntries;
}
