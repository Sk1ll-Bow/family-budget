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
        <div key={i} className={cn('skeleton h-4 w-full', className)} />
      ))}
    </>
  );
}

/**
 * Pre-built skeleton for expense list rows.
 */
export function ExpenseRowSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
      <div className="skeleton h-5 w-20 shrink-0" />
    </div>
  );
}

/**
 * Pre-built skeleton for chart sections.
 */
export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  );
}
