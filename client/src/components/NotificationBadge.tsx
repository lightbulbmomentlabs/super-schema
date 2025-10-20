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
        'absolute flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'rounded-full',
        // Colors - blue info theme
        'bg-info text-info-foreground',
        // Border for contrast against parent
        'border-2 border-background',
        // Typography
        'text-[10px] font-bold leading-none',
        // Positioning
        '-top-1 -right-1',
        'z-10',
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
