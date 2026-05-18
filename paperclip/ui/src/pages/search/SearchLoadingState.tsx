import { Skeleton } from "@/components/ui/skeleton";

export function SearchLoadingState({ trimmedQuery }: { trimmedQuery: string }) {
  return (
    <div className="flex flex-col gap-2 px-2 py-3 sm:px-4">
      <div className="px-3 text-xs text-muted-foreground" data-testid="search-loading">
        Searching for &ldquo;{trimmedQuery}&rdquo;…
      </div>
      <div className="flex flex-col">
        <div className="px-3 py-2">
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3 px-3 py-2">
            <Skeleton className="mt-1 size-4 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
