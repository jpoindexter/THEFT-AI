import type { RoutineVariable } from "@paperclipai/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function RoutineRunVariableFields({
  variables,
  values,
  workspaceBranchAutoValue,
  isAutoWorkspaceBranchVariable,
  onValueChange,
}: {
  variables: RoutineVariable[];
  values: Record<string, unknown>;
  workspaceBranchAutoValue: string | null;
  isAutoWorkspaceBranchVariable: (variable: RoutineVariable) => boolean;
  onValueChange: (variableName: string, value: unknown) => void;
}) {
  return (
    <>
      {variables.map((variable) => (
        <div key={variable.name} className="space-y-1.5">
          <Label className="text-xs">
            {variable.label || variable.name}
            {variable.required ? " *" : ""}
          </Label>
          {isAutoWorkspaceBranchVariable(variable) ? (
            <Input
              readOnly
              disabled
              value={workspaceBranchAutoValue ?? ""}
            />
          ) : variable.type === "textarea" ? (
            <Textarea
              rows={4}
              value={typeof values[variable.name] === "string" ? values[variable.name] as string : ""}
              onChange={(event) => onValueChange(variable.name, event.target.value)}
            />
          ) : variable.type === "boolean" ? (
            <Select
              value={values[variable.name] === true ? "true" : values[variable.name] === false ? "false" : "__unset__"}
              onValueChange={(next) => onValueChange(variable.name, next === "__unset__" ? "" : next === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unset__">No value</SelectItem>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          ) : variable.type === "select" ? (
            <Select
              value={typeof values[variable.name] === "string" && values[variable.name] ? values[variable.name] as string : "__unset__"}
              onValueChange={(next) => onValueChange(variable.name, next === "__unset__" ? "" : next)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unset__">No value</SelectItem>
                {variable.options.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={variable.type === "number" ? "number" : "text"}
              value={values[variable.name] == null ? "" : String(values[variable.name])}
              onChange={(event) => onValueChange(variable.name, event.target.value)}
            />
          )}
        </div>
      ))}
    </>
  );
}
