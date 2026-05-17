import type { ReactNode } from "react";
import {
  BarChart3,
  Check,
  Code2,
  DollarSign,
  Headphones,
  Loader2,
  Megaphone,
  Palette,
  Rocket,
  Scale,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingStage } from "@/lib/onboarding-context";
import { DEPARTMENT_SEED_SPECS } from "@/lib/onboarding-seed";
import { AssemblyStatGroup, InspectorBlock } from "./AssemblyPreviewPrimitives";

const DEPARTMENT_ASSEMBLY_META: Record<
  string,
  { icon: ReactNode; focus: string; outputs: string[]; capabilities: string[] }
> = {
  engineering: {
    icon: <Code2 className="size-4" />,
    focus: "Build robust, scalable products.",
    outputs: ["Architecture doc", "Tech stack decision", "Repo template"],
    capabilities: ["Software engineering", "System architecture", "Quality and testing"],
  },
  design: {
    icon: <Palette className="size-4" />,
    focus: "Create intuitive, memorable experiences.",
    outputs: ["Design system", "UI kit", "Brand guide"],
    capabilities: ["Product design", "Research synthesis", "Interaction design"],
  },
  marketing: {
    icon: <Megaphone className="size-4" />,
    focus: "Build awareness and demand.",
    outputs: ["Messaging guide", "Content calendar", "Campaign brief"],
    capabilities: ["Positioning", "Content engine", "Market research"],
  },
  sales: {
    icon: <BarChart3 className="size-4" />,
    focus: "Convert interest into revenue.",
    outputs: ["Sales playbook", "Pitch deck", "Objection guide"],
    capabilities: ["ICP definition", "Pipeline motion", "Revenue process"],
  },
  operations: {
    icon: <Settings2 className="size-4" />,
    focus: "Build systems that scale.",
    outputs: ["SOP library", "Tooling map", "Ops handbook"],
    capabilities: ["Process design", "Tooling stack", "Execution cadence"],
  },
  finance: {
    icon: <DollarSign className="size-4" />,
    focus: "Manage financial health and growth.",
    outputs: ["Budget model", "P&L template", "KPI dashboard spec"],
    capabilities: ["Unit economics", "Budgeting", "Reporting cadence"],
  },
  legal: {
    icon: <Scale className="size-4" />,
    focus: "Protect the company and reduce risk.",
    outputs: ["Term sheet", "NDA template", "IP assignment"],
    capabilities: ["Risk review", "Contract checklist", "Compliance triage"],
  },
  support: {
    icon: <Headphones className="size-4" />,
    focus: "Deliver value and retain customers.",
    outputs: ["FAQ template", "Ticket workflows", "CS playbook"],
    capabilities: ["Support process", "Knowledge base", "Customer feedback"],
  },
};

export function AssemblyPreviewScreen({
  companyStage,
  objective,
  taskTitle,
  agentName,
  adapterLabel,
  loading,
  onBack,
  onLaunch,
}: {
  companyStage: OnboardingStage;
  objective: string;
  taskTitle: string;
  agentName: string;
  adapterLabel: string;
  loading: boolean;
  onBack: () => void;
  onLaunch: () => void;
}) {
  const selectedDepartment = DEPARTMENT_SEED_SPECS[0];
  const selectedMeta = DEPARTMENT_ASSEMBLY_META[selectedDepartment.key];

  return (
    <div className="theft-assembly-grid grid min-h-0 flex-1 overflow-y-auto">
      <aside className="hidden border-r border-border bg-card px-6 py-6 xl:block">
        <p className="theft-label">THEFT will assemble</p>
        <div className="mt-5 space-y-5 text-sm">
          <AssemblyStatGroup
            title="Structure"
            rows={["1 objective", "3 strategic tracks", `${DEPARTMENT_SEED_SPECS.length} departments`]}
          />
          <AssemblyStatGroup
            title="Work"
            rows={[`${DEPARTMENT_SEED_SPECS.length + 1} starter tasks`, "40+ subtasks"]}
          />
          <AssemblyStatGroup title="Library outputs" rows={["32+ artifacts", "120+ templates"]} />
          <AssemblyStatGroup title="Governance" rows={["Decision rights", "Approval flows", "Risk controls"]} />
        </div>
        <div className="theft-surface-plain mt-10 p-4 text-xs leading-5 text-muted-foreground">
          <Check className="mb-2 size-4 text-foreground" />
          All aligned to your answers and plan.
        </div>
      </aside>

      <main className="min-w-0 px-5 py-6 md:px-8">
        <AssemblyMain
          objective={objective}
          companyStage={companyStage}
          selectedDepartmentKey={selectedDepartment.key}
        />
      </main>

      <aside className="border-t border-border bg-card p-5 xl:border-l xl:border-t-0">
        <p className="theft-label">Inspector</p>
        <div className="mt-5 space-y-4">
          <div className="theft-surface-plain p-4">
            <p className="text-xs text-muted-foreground">Selected</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                {selectedMeta.icon}
              </span>
              <p className="font-medium">{selectedDepartment.title}</p>
            </div>
          </div>
          <InspectorBlock title="Mission" rows={[selectedMeta.focus]} />
          <InspectorBlock
            title="Starter task first"
            rows={[taskTitle || selectedDepartment.taskTitleByStage[companyStage]]}
          />
          <InspectorBlock title="Default capabilities" rows={selectedMeta.capabilities} />
          <InspectorBlock title="Expected outputs" rows={selectedMeta.outputs} />
          <InspectorBlock title="Runtime" rows={[agentName || "Operator", adapterLabel]} />
        </div>

        <div className="mt-5 grid gap-2">
          <Button className="h-12" disabled={loading} onClick={onLaunch}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            {loading ? "Launching..." : "Launch company"}
          </Button>
          <Button variant="outline" className="h-10" disabled={loading} onClick={onBack}>
            Edit plan
          </Button>
        </div>
      </aside>
    </div>
  );
}

function AssemblyMain({
  objective,
  companyStage,
  selectedDepartmentKey,
}: {
  objective: string;
  companyStage: OnboardingStage;
  selectedDepartmentKey: string;
}) {
  return (
    <>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="theft-label">Company assembly</p>
          <h2 className="mt-2 text-2xl font-medium">Company Assembly Preview</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review the operating structure, starter work, and outputs THEFT will create.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-signal" />
          Local runtime ready
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="theft-surface mx-auto max-w-xl p-6 text-center">
          <p className="theft-label">Mission objective</p>
          <p className="mt-2 text-lg leading-7">{objective}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Product Excellence", "Ship valuable, usable, delightful products."],
            ["Growth & Distribution", "Acquire, activate, and retain customers."],
            ["Operational Leverage", "Systematize and scale profitably."],
          ].map(([title, body]) => (
            <div key={title} className="theft-surface-plain p-4">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DEPARTMENT_SEED_SPECS.map((department) => {
            const meta = DEPARTMENT_ASSEMBLY_META[department.key];
            return (
              <div
                key={department.key}
                className={cn(
                  "theft-surface-plain p-4",
                  department.key === selectedDepartmentKey && "theft-selected-surface",
                )}
              >
                <DepartmentCardContent
                  department={department}
                  meta={meta}
                  companyStage={companyStage}
                />
              </div>
            );
          })}
        </div>

        <div className="theft-surface-plain mt-6 p-4">
          <p className="theft-label">Tech tree initial path</p>
          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {["Company foundation", "Core systems & tooling", "First product MVP", "Market launch & feedback", "Scale systems & team"].map((node, index) => (
              <div key={node} className="theft-inset-surface p-4 text-center">
                <p className="text-sm font-medium">{node}</p>
                <p className="theft-label-compact mt-2">
                  {index === 0 ? "active" : index === 1 ? "next" : "available"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DepartmentCardContent({
  department,
  meta,
  companyStage,
}: {
  department: (typeof DEPARTMENT_SEED_SPECS)[number];
  meta: (typeof DEPARTMENT_ASSEMBLY_META)[string];
  companyStage: OnboardingStage;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          {meta.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{department.title}</p>
          <p className="text-xs text-muted-foreground">{meta.focus}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="theft-label">Starter tasks</p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
          <li>{department.taskTitleByStage[companyStage]}</li>
          <li>{department.taskDescriptionByStage[companyStage]}</li>
        </ul>
      </div>
      <div className="mt-4">
        <p className="theft-label">Library outputs</p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
          {meta.outputs.slice(0, 3).map((output) => (
            <li key={output}>{output}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
