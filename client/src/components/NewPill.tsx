import { memo } from 'react'
import { cn } from '@/utils/cn'

interface NewPillProps {
  className?: string
}

/**
 * A small pill badge that displays "New" text
 * Uses blue (info) color scheme and appears inline with content
 */
function NewPillComponent({ className }: NewPillProps) {
  return (
    <span
      className={cn(
        // Layout
        'inline-flex items-center justify-center',
        'px-2 py-0.5',
        'rounded-full',
        // Colors - blue info theme
        'bg-info text-info-foreground',
        // Typography
        'text-[11px] font-medium leading-none',
        // Spacing
        'ml-2',
        // Animations
        'animate-in fade-in zoom-in-95',
        'duration-200',
        className
      )}
      aria-label="New update"
      role="status"
    >
      New
    </span>
  )
}

// Memoize to prevent unnecessary re-renders
export const NewPill = memo(NewPillComponent)
