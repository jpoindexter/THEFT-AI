import { useState } from "react";
import type { TranscriptDensity, TranscriptMode } from "../components/transcript/RunTranscriptView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runTranscriptFixtureMeta } from "../fixtures/runTranscriptFixtures";
import {
  LabHeading,
  SurfacePicker,
  SurfacePreview,
  surfaceOptions,
  type SurfaceId,
} from "./run-transcript-ux-lab/RunTranscriptUxLabParts";

export function RunTranscriptUxLab() {
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("detail");
  const [detailMode, setDetailMode] = useState<TranscriptMode>("nice");
  const [streaming, setStreaming] = useState(true);
  const [density, setDensity] = useState<TranscriptDensity>("comfortable");

  const selected = surfaceOptions.find((option) => option.id === selectedSurface) ?? surfaceOptions[0];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="border-b border-border bg-muted/20 p-5 lg:border-b-0 lg:border-r">
            <LabHeading />
            <SurfacePicker selectedSurface={selectedSurface} onSelect={setSelectedSurface} />
          </aside>

          <main className="min-w-0 p-5 lg:col-span-3">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="theft-label-compact text-muted-foreground">
                  {selected.eyebrow}
                </div>
                <h2 className="mt-1 text-2xl font-semibold">{selected.label}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {selected.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-compact">
                  Source run {runTranscriptFixtureMeta.sourceRunId.slice(0, 8)}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-compact">
                  {runTranscriptFixtureMeta.issueIdentifier}
                </Badge>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="theft-label-compact text-muted-foreground">
                Controls
              </span>
              <SegmentedControl
                value={detailMode}
                options={["nice", "raw"]}
                onChange={(mode) => setDetailMode(mode as TranscriptMode)}
              />
              <SegmentedControl
                value={density}
                options={["comfortable", "compact"]}
                onChange={(nextDensity) => setDensity(nextDensity as TranscriptDensity)}
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setStreaming((value) => !value)}
              >
                {streaming ? "Show settled state" : "Show streaming state"}
              </Button>
            </div>

            <SurfacePreview
              selectedSurface={selectedSurface}
              mode={detailMode}
              streaming={streaming}
              density={density}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-background p-1">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          variant={value === option ? "secondary" : "ghost"}
          size="sm"
          className="h-7 rounded-full px-3 text-xs font-medium capitalize"
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
