import { X } from "lucide-react";
import { usePanel } from "../context/PanelContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "../lib/utils";

export function PropertiesPanel() {
  const { panelContent, panelVisible, setPanelVisible } = usePanel();

  if (!panelContent) return null;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col overflow-hidden border-l border-border bg-card transition-all duration-200 ease-in-out md:flex",
        panelVisible ? "w-80 opacity-100" : "w-0 opacity-0",
      )}
    >
      <div className="flex min-h-0 w-80 min-w-80 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium">Properties</span>
          <Button variant="ghost" size="icon-xs" onClick={() => setPanelVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">{panelContent}</div>
        </ScrollArea>
      </div>
    </aside>
  );
}
