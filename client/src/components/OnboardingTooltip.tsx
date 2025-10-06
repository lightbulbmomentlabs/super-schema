import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface OnboardingTooltipProps {
  children: ReactNode
  message: string
  step?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  onNext?: () => void
  onSkip?: () => void
  nextLabel?: string
  className?: string
}

export default function OnboardingTooltip({
  children,
  message,
  step,
  position = 'bottom',
  onNext,
  onSkip,
  nextLabel = 'Got it',
  className
}: OnboardingTooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-border border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-border border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-border border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-border border-t-transparent border-b-transparent border-l-transparent'
  }

  return (
    <div className="relative inline-block">
      {/* Highlight ring around the element */}
      <div className="relative">
        <div className="absolute inset-0 -m-1 rounded-lg border-2 border-primary animate-pulse pointer-events-none" />
        {children}
      </div>

      {/* Tooltip */}
      <div className={cn(
        'absolute z-50 w-72 bg-card border border-primary shadow-xl rounded-lg p-4',
        positionClasses[position],
        className
      )}>
        {/* Arrow */}
        <div className={cn(
          'absolute w-0 h-0 border-8',
          arrowClasses[position]
        )} />

        {/* Step indicator */}
        {step && (
          <div className="text-xs font-semibold text-primary mb-2">
            {step}
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-foreground mb-4">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onNext && (
            <button
              onClick={onNext}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              {nextLabel}
            </button>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Skip tutorial"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
