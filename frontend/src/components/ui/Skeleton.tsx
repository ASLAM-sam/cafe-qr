import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-white p-3 gap-3">
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2 flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
