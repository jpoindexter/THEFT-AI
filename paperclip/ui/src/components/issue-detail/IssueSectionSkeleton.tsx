import { Skeleton } from "@/components/ui/skeleton";

type IssueSectionSkeletonProps = {
  titleWidth?: string;
  rows?: number;
};

export function IssueSectionSkeleton({
  titleWidth = "w-28",
  rows = 3,
}: IssueSectionSkeletonProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <Skeleton className={`h-4 ${titleWidth}`} />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
