import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CircleDot,
  Code2,
  Database,
  DollarSign,
  Flag,
  Headphones,
  Megaphone,
  Monitor,
  Package,
  Palette,
  Plus,
  Scale,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STAGE_LABELS,
  type OnboardingStage,
} from "@/lib/onboarding-context";
import type { OnboardingStep } from "./types";

export function OnboardingCanvasPreview({
  companyName,
  companyStage,
  step,
  agentName,
}: {
  companyName: string;
  companyStage: OnboardingStage;
  step: OnboardingStep;
  agentName: string;
}) {
  const displayName = companyName.trim() || "New company";
  const reviewMode = step === 4;

  return (
    <section className="hidden min-h-0 overflow-hidden bg-background lg:block">
      <div className="theft-onboarding-canvas-frame relative h-full">
        <div className="theft-grid-bg absolute inset-0" />
        <CanvasToolbar reviewMode={reviewMode} />
        <CompanyMap
          displayName={displayName}
          companyStage={companyStage}
          reviewMode={reviewMode}
        />
        <div className="theft-surface-plain absolute bottom-4 left-4 z-10 w-56 px-4 py-2">
          <RuntimeLine label="Local runtime ready" />
          <RuntimeLine label="Embedded Postgres" />
          <RuntimeLine label="No cloud required" />
        </div>
        <div className="theft-surface-plain absolute bottom-4 right-4 z-10 px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {agentName || "Operator"}
          </span>
          <span className="mx-2 text-border">/</span>
          {reviewMode ? "Plan review ready" : `Step ${step} active`}
        </div>
      </div>
    </section>
  );
}

function CanvasToolbar({ reviewMode }: { reviewMode: boolean }) {
  return (
    <div className="relative z-10 flex items-center justify-between">
      <div className="theft-surface-plain px-4 py-2">
        <div className="theft-label flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-signal" />
          {reviewMode ? "Workspace assembling" : "Canvas initializing"}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {reviewMode ? "Department graph preparing..." : "Company map forming..."}
        </p>
      </div>
      <div className="theft-surface-plain flex overflow-hidden">
        {[Monitor, CircleDot, Plus].map((Icon, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="icon-sm"
            className="flex size-9 items-center justify-center border-l border-border text-muted-foreground first:border-l-0 hover:bg-secondary hover:text-foreground"
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}

function CompanyMap({
  displayName,
  companyStage,
  reviewMode,
}: {
  displayName: string;
  companyStage: OnboardingStage;
  reviewMode: boolean;
}) {
  return (
    <div className="theft-onboarding-map absolute top-1/2 -translate-y-1/2">
      <div className="theft-map-ring-outer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/80" />
      <div className="theft-map-ring-middle absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border" />
      <div className="theft-map-ring-inner absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/80" />

      <div className="theft-surface theft-map-center-card absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 p-4 text-center outline outline-1 outline-foreground/70">
        <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-secondary">
          <Building2 className="size-5" />
        </div>
        <h3 className="mt-3 truncate text-base font-medium">{displayName}</h3>
        <p className="theft-label-compact mt-1">
          {ONBOARDING_STAGE_LABELS[companyStage]}
        </p>
      </div>

      {mapNodes(reviewMode).map((node) => (
        <MapNode key={node.label} {...node} active={reviewMode} />
      ))}
    </div>
  );
}

function mapNodes(reviewMode: boolean) {
  return reviewMode
    ? [
        node("theft-map-node-top", <Code2 className="size-4" />, "Engineering"),
        node("theft-map-node-left-upper", <Palette className="size-4" />, "Design"),
        node("theft-map-node-right-upper", <Megaphone className="size-4" />, "Marketing"),
        node("theft-map-node-right-middle", <BarChart3 className="size-4" />, "Sales"),
        node("theft-map-node-right-lower", <DollarSign className="size-4" />, "Finance"),
        node("theft-map-node-bottom", <Scale className="size-4" />, "Legal"),
        node("theft-map-node-left-lower", <Headphones className="size-4" />, "Support"),
        node("theft-map-node-left-middle", <Settings2 className="size-4" />, "Operations"),
      ]
    : [
        node("theft-map-node-top", <Flag className="size-4" />, "Brand"),
        node("theft-map-node-default-left", <Package className="size-4" />, "Product"),
        node("theft-map-node-default-right", <BarChart3 className="size-4" />, "Revenue"),
        node("theft-map-node-default-left-lower", <Settings2 className="size-4" />, "Operations"),
        node("theft-map-node-default-right-lower", <Database className="size-4" />, "Library"),
      ];
}

function node(className: string, icon: ReactNode, label: string) {
  return { className, icon, label };
}

function MapNode({
  className,
  icon,
  label,
  active = false,
}: {
  className: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "theft-surface-plain theft-map-node absolute z-10 flex flex-col items-center justify-center text-center",
        active && "outline outline-1 outline-foreground/30",
        className,
      )}
    >
      <div className="mb-1.5 text-muted-foreground">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
      {active ? <span className="mt-2 size-1.5 rounded-full bg-signal" /> : null}
    </div>
  );
}

function RuntimeLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-signal" />
      {label}
    </div>
  );
}
