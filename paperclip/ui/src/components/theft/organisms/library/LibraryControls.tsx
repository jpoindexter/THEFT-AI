import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TheftStat, TheftSurface } from "@/components/theft";
import type { LibrarySummary } from "@/lib/library-items";
import { relativeTime } from "@/lib/utils";

export function LibraryControls({
  search,
  onSearchChange,
  departmentFilter,
  onDepartmentFilterChange,
  departmentOptions,
  summary,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  departmentOptions: string[];
  summary: LibrarySummary;
}) {
  return (
    <TheftSurface tone="plain" padding="md" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search Library"
            className="pl-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
          <SelectTrigger className="w-full md:w-56" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departmentOptions.map((department) => (
              <SelectItem key={department} value={department.toLowerCase()}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-4">
        <TheftStat label="Outputs" value={summary.totalItems} />
        <TheftStat label="Pinned / important" value={summary.importantItems} />
        <TheftStat label="Department shelves" value={summary.departmentCount} />
        <TheftStat
          label="Latest"
          value={summary.latestUpdatedAt ? relativeTime(summary.latestUpdatedAt) : "None"}
        />
      </div>
    </TheftSurface>
  );
}
