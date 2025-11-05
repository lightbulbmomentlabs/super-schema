import { Skeleton } from "./ui/Skeleton"

/**
 * Auth Loading Screen
 *
 * Shown briefly while Clerk authentication initializes.
 * Displays a subtle loading animation to prevent flash of Welcome screen.
 */
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Logo or brand element */}
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="w-10 h-10" />
          <Skeleton variant="rectangle" className="w-32 h-8" />
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1.5">
          <Skeleton variant="circle" className="w-2 h-2 animate-bounce [animation-delay:-0.3s]" />
          <Skeleton variant="circle" className="w-2 h-2 animate-bounce [animation-delay:-0.15s]" />
          <Skeleton variant="circle" className="w-2 h-2 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
