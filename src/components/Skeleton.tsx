import { cn } from '../core/cn';

interface ISkeletonProps {
  className?: string;
  count?: number;
}

/**
 * Skeleton loading component that mimics content shape during data fetching.
 */
export function Skeleton({ className, count = 1 }: ISkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('bg-white/5 animate-pulse rounded-lg', className)} />
      ))}
    </>
  );
}

/**
 * Pre-built skeleton for expense list rows.
 */
export function ExpenseRowSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center gap-4 border-white/5">
      <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded-md" />
        <div className="h-3 w-1/2 bg-white/5 animate-pulse rounded-md opacity-50" />
      </div>
      <div className="h-6 w-20 bg-white/5 animate-pulse rounded-lg shrink-0" />
    </div>
  );
}

/**
 * Pre-built skeleton for chart sections.
 */
export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4 border-white/5">
      <div className="h-5 w-40 bg-white/5 animate-pulse rounded-md" />
      <div className="h-48 w-full bg-white/5 animate-pulse rounded-2xl" />
    </div>
  );
}
