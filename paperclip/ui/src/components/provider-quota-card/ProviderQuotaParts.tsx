import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const METER_WIDTH_CLASSES = [
  "w-0",
  "w-1/12",
  "w-1/6",
  "w-1/4",
  "w-1/3",
  "w-5/12",
  "w-1/2",
  "w-7/12",
  "w-2/3",
  "w-3/4",
  "w-5/6",
  "w-11/12",
  "w-full",
];

function meterWidthClass(percent: number | null | undefined) {
  const clamped = Math.min(Math.max(percent ?? 0, 0), 100);
  return METER_WIDTH_CLASSES[Math.round((clamped / 100) * (METER_WIDTH_CLASSES.length - 1))];
}

export function MeterFill({
  percent,
  className,
  title,
}: {
  percent: number | null | undefined;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn("h-full transition-[width] duration-150", meterWidthClass(percent), className)}
      title={title}
    />
  );
}

export function MeterBar({
  percent,
  fillClassName = "bg-primary/60",
  heightClassName = "h-2",
}: {
  percent: number | null | undefined;
  fillClassName?: string;
  heightClassName?: string;
}) {
  return (
    <div className={cn("w-full overflow-hidden border border-border", heightClassName)}>
      <MeterFill percent={percent} className={fillClassName} />
    </div>
  );
}

export function QuotaPanelSkeleton() {
  return (
    <div className="border border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border border-border px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44 max-w-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-3 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
