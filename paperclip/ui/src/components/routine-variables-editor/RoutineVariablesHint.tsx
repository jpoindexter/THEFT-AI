import { useState } from "react";
import { HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BuiltinVariableDoc = {
  name: string;
  example: string;
  description: string;
};

const BUILTIN_VARIABLE_DOCS: BuiltinVariableDoc[] = [
  {
    name: "date",
    example: "2026-04-28",
    description: "Current date in YYYY-MM-DD format (UTC) at the time the routine runs.",
  },
  {
    name: "timestamp",
    example: "April 28, 2026 at 12:17 PM UTC",
    description: "Human-readable date and time (UTC) at the time the routine runs.",
  },
];

export function RoutineVariablesHint() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <span>
          Use `{"{{variable_name}}"}` placeholders in the instructions to prompt for inputs when the routine runs.
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setHelpOpen(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Show variable help"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Routine variables</DialogTitle>
            <DialogDescription>
              How to prompt for inputs and which variables Paperclip fills in automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            <CustomVariablesHelp />
            <BuiltinVariablesHelp />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomVariablesHelp() {
  return (
    <section className="space-y-2">
      <h3 className="theft-label-compact text-muted-foreground">
        Custom variables
      </h3>
      <p className="text-muted-foreground">
        Type{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
          {"{{variable_name}}"}
        </code>{" "}
        anywhere in the title or instructions. Paperclip detects each placeholder, lists it
        under <span className="font-medium text-foreground">Variables</span>, and prompts
        for a value before each run.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Names must start with a letter and may use letters, numbers, and underscores.</li>
        <li>Pick a type, default value, and whether it is required.</li>
        <li>The same name reused across the title and instructions is treated as one variable.</li>
      </ul>
    </section>
  );
}

function BuiltinVariablesHelp() {
  return (
    <section className="space-y-2">
      <h3 className="theft-label-compact text-muted-foreground">
        Built-in variables
      </h3>
      <p className="text-muted-foreground">
        These are filled in automatically. No setup needed, and they will not appear in the Variables list.
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Placeholder</th>
              <th className="px-3 py-2 font-medium">Example</th>
              <th className="px-3 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {BUILTIN_VARIABLE_DOCS.map((entry) => (
              <tr key={entry.name} className="align-top">
                <td className="px-3 py-2">
                  <Badge variant="outline" className="font-mono text-xs">{`{{${entry.name}}}`}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{entry.example}</td>
                <td className="px-3 py-2 text-muted-foreground">{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
