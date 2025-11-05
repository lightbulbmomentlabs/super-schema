import { Skeleton } from "../ui/Skeleton"

/**
 * HeaderSkeleton
 *
 * Loading state for header/navigation area
 * Shows skeleton for user profile, team switcher, and credits display
 */
export function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      {/* Team switcher skeleton */}
      <Skeleton variant="button" className="w-40" />

      {/* Credits display skeleton */}
      <Skeleton variant="rectangle" className="w-24 h-9 rounded-md" />

      {/* User menu skeleton */}
      <Skeleton variant="circle" className="w-9 h-9" />
    </div>
  )
}
