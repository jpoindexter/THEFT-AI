import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoalPropertiesToggleButton({
  panelVisible,
  onShowProperties,
}: {
  panelVisible: boolean;
  onShowProperties: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={cn(
        "hidden shrink-0 transition-opacity duration-200 md:inline-flex",
        panelVisible ? "pointer-events-none w-0 overflow-hidden opacity-0" : "opacity-100",
      )}
      onClick={onShowProperties}
      title="Show properties"
    >
      <SlidersHorizontal className="h-4 w-4" />
    </Button>
  );
}
