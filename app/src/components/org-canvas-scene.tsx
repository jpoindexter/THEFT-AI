"use client";

import { useState } from "react";
import Canvas from "@/components/canvas";
import OrgChart from "@/components/org-chart";
import DeploymentChartWidget from "@/components/deployment-chart-widget";

type Department = { id: string; slug: string; name: string };
type DeployTarget = "production" | "preview";

type ChartWidget = {
  id: string;
  target: DeployTarget;
  title: string;
  x: number;
  y: number;
};

const CHART_OPTIONS: { target: DeployTarget; title: string }[] = [
  { target: "preview", title: "Preview Deployments" },
  { target: "production", title: "Production Deployments" },
];

export default function OrgCanvasScene({
  orgSlug,
  orgName,
  departments,
  children,
}: {
  orgSlug: string;
  orgName: string;
  departments: Department[];
  children?: React.ReactNode;
}) {
  const [charts, setCharts] = useState<ChartWidget[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function addChart(target: DeployTarget, title: string) {
    const idx = charts.length;
    setCharts((prev) => [
      ...prev,
      {
        id: `${target}-${Date.now()}`,
        target,
        title,
        x: 40 + idx * 390,
        y: 40,
      },
    ]);
    setPickerOpen(false);
    setToast(`${title} added to canvas`);
    setTimeout(() => setToast(null), 2500);
  }

  function removeChart(id: string) {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <>
      <Canvas
        className="absolute inset-0"
        overlay={
          <>
            {charts.map((c) => (
              <DeploymentChartWidget
                key={c.id}
                id={c.id}
                orgSlug={orgSlug}
                target={c.target}
                title={c.title}
                initialX={c.x}
                initialY={c.y}
                onClose={() => removeChart(c.id)}
              />
            ))}
          </>
        }
      >
        <OrgChart orgSlug={orgSlug} orgName={orgName} departments={departments} />
        {children}
      </Canvas>

      {toast && (
        <div
          className="fixed z-[60] flex items-center gap-2 bg-ink text-paper rounded-full px-3 py-1.5 text-xs shadow-md pointer-events-none whitespace-nowrap"
          style={{ bottom: 60, left: "calc(50% - 180px)", transform: "translateX(-50%)" }}
        >
          <span className="size-3.5 rounded-full bg-paper/20 flex items-center justify-center leading-none">✓</span>
          {toast}
        </div>
      )}
    </>
  );
}
