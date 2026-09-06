import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ChangeInsightSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5 bg-surface border-border space-y-4", className)}>
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-1.5 text-right flex flex-col items-end">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-28" />
      </div>

      <div className="p-3 bg-background/50 rounded-[4px] space-y-2">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      <div className="flex justify-between pt-1">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-6 w-20" />
      </div>
    </Card>
  );
}

export function WatchlistRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-[4px] border border-border-subtle bg-surface">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-2 w-2 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
      <div className="hidden md:block">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-1 text-right flex flex-col items-end">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}

export function WatchlistTableSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <WatchlistRowSkeleton key={idx} />
      ))}
    </div>
  );
}
