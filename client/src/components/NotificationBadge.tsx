import { memo } from 'react'
import { cn } from '@/utils/cn'

interface NotificationBadgeProps {
  count: number
  className?: string
}

/**
 * A small circular notification badge that displays a count
 * Uses blue (info) color scheme and appears with smooth animations
 */
function NotificationBadgeComponent({ count, className }: NotificationBadgeProps) {
  // Don't render if count is 0 or negative
  if (count <= 0) {
    return null
  }

  // Cap displayed count at 99 to prevent overflow
  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'min-w-[20px] h-[20px] px-1.5',
        'rounded-full',
        // Colors - blue info theme
        'bg-info text-info-foreground',
        // Typography
        'text-[10px] font-bold leading-none',
        // Animations
        'animate-in fade-in zoom-in-50',
        'duration-200',
        className
      )}
      aria-label={`${count} unread update${count === 1 ? '' : 's'}`}
      role="status"
    >
      {displayCount}
    </span>
  )
}

// Memoize to prevent unnecessary re-renders
export const NotificationBadge = memo(NotificationBadgeComponent)
