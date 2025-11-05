import { Skeleton } from "../ui/Skeleton"

/**
 * StatCardSkeleton
 *
 * Loading state for dashboard stat cards (credit balance, total schemas, etc.)
 * Mimics the layout of the actual stat cards for a seamless loading experience.
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      {/* Icon and title */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-24 h-4" />
        </div>
      </div>

      {/* Value */}
      <Skeleton variant="rectangle" className="w-32 h-8" />

      {/* Optional subtitle/description */}
      <Skeleton variant="text" className="w-full h-3" />
    </div>
  )
}

/**
 * StatCardsGridSkeleton
 *
 * Loading state for a grid of stat cards (typically 3-4 cards)
 */
export function StatCardsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}
