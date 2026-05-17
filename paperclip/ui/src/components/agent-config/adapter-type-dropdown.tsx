import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { getAdapterDisplay, getAdapterLabel } from "../../adapters/adapter-display-registry";
import { listAdapterOptions } from "../../adapters/metadata";
import { OpenCodeLogoIcon } from "../OpenCodeLogoIcon";
import { adapterLabels } from "../agent-config-primitives";

export function AdapterTypeDropdown({
  value,
  onChange,
  disabledTypes,
}: {
  value: string;
  onChange: (type: string) => void;
  disabledTypes: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const selectedDisplay = getAdapterDisplay(value);
  const adapterList = useMemo(
    () =>
      listAdapterOptions((type) => adapterLabels[type] ?? getAdapterLabel(type)).filter(
        (item) => !disabledTypes.has(item.value),
      ),
    [disabledTypes],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-auto w-full justify-between px-2.5 py-1.5 font-normal hover:bg-accent/50">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {value === "opencode_local" ? <OpenCodeLogoIcon className="h-3.5 w-3.5" /> : null}
            <span className="truncate">{adapterLabels[value] ?? getAdapterLabel(value)}</span>
            {selectedDisplay.experimental && <ExperimentalBadge />}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
        {adapterList.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant="ghost"
            size="sm"
            disabled={item.comingSoon}
            className={cn(
              "h-auto w-full justify-between px-2 py-1.5 font-normal",
              item.comingSoon
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-accent/50",
              item.value === value && !item.comingSoon && "bg-accent",
            )}
            onClick={() => {
              if (!item.comingSoon) {
                onChange(item.value);
                setOpen(false);
              }
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              {item.value === "opencode_local" ? <OpenCodeLogoIcon className="h-3.5 w-3.5" /> : null}
              <span>{item.label}</span>
              {item.experimental && <ExperimentalBadge />}
            </span>
            {item.comingSoon && (
              <span className="text-nano text-muted-foreground">Coming soon</span>
            )}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ExperimentalBadge() {
  return (
    <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-nano font-medium leading-none text-amber-700 dark:text-amber-200">
      Experimental
    </span>
  );
}
