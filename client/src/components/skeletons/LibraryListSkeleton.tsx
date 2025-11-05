import { Skeleton } from "../ui/Skeleton"

/**
 * LibraryListItemSkeleton
 *
 * Loading state for a single URL list item in the library
 */
export function LibraryListItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* URL and metadata */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-1/2 h-4" />
      </div>

      {/* Schema badges */}
      <div className="flex gap-2">
        <Skeleton variant="rectangle" className="w-20 h-6 rounded-full" />
        <Skeleton variant="rectangle" className="w-24 h-6 rounded-full" />
        <Skeleton variant="rectangle" className="w-16 h-6 rounded-full" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" className="w-20" />
        <Skeleton variant="button" className="w-24" />
      </div>
    </div>
  )
}

/**
 * LibraryListSkeleton
 *
 * Loading state for the library URL list
 */
export function LibraryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <LibraryListItemSkeleton key={i} />
      ))}
    </div>
  )
}
