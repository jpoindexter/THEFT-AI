import type { Environment } from "@paperclipai/shared";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "../../lib/utils";
import { Field } from "../agent-config-primitives";

type MarkIdentityValue = (group: "identity", field: string, value: unknown) => void;

export function AgentExecutionSection({
  cards,
  currentDefaultEnvironmentId,
  inputClass,
  isCreate,
  mark,
  onCreateChange,
  runnableEnvironments,
}: {
  cards: boolean;
  currentDefaultEnvironmentId: string;
  inputClass: string;
  isCreate: boolean;
  mark: MarkIdentityValue;
  onCreateChange: ((patch: Partial<CreateConfigValues>) => void) | null;
  runnableEnvironments: Environment[];
}) {
  return (
    <div className={cn(!cards && (isCreate ? "border-t border-border" : "border-b border-border"))}>
      {cards ? (
        <h3 className="mb-3 text-sm font-medium">Execution</h3>
      ) : (
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground">Execution</div>
      )}
      <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
        <Field
          label="Default environment"
          hint="Agent-level default execution target. Project and issue settings can still override this."
        >
          <Select
            value={currentDefaultEnvironmentId || "__company_default__"}
            onValueChange={(nextValue) => {
              const environmentId = nextValue === "__company_default__" ? "" : nextValue;
              if (isCreate) {
                onCreateChange!({ defaultEnvironmentId: environmentId });
                return;
              }
              mark("identity", "defaultEnvironmentId", environmentId || null);
            }}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Company default (Local)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__company_default__">Company default (Local)</SelectItem>
              {runnableEnvironments.map((environment) => (
                <SelectItem key={environment.id} value={environment.id}>
                  {environment.name} · {environment.driver}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}
