export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded-lg ${className}`} aria-hidden />
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl border border-border/50 p-4">
          <Skeleton className="h-24 w-36 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}
