import { Button } from "@/components/ui/button";
import { CircleMarker } from "./TechTreePrimitives";

const FILTERS = ["All", "Idea", "Validation", "Build", "Go-to-market", "Launch", "Scale"];

export function TechTreeFilterRail() {
  return (
    <aside className="hidden min-w-0 space-y-5 border-r border-border pr-4 xl:block">
      <div>
        <p className="theft-label">View</p>
        <div className="mt-3 grid gap-2 text-sm">
          <Button variant="secondary" className="justify-start">Strategy Map</Button>
          <Button variant="outline" className="justify-start text-muted-foreground">Build Order</Button>
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <p className="theft-label">Filters</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {FILTERS.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CircleMarker complete={item === "All"} />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <p className="theft-label">Legend</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>-- Dependency</p>
          <p>{"->"} Unlocks</p>
          <p>Lock Locked</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full">Show critical path</Button>
    </aside>
  );
}
