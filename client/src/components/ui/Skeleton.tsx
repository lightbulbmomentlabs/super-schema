import { cn } from "@/utils/cn"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "card" | "circle" | "button" | "rectangle"
}

/**
 * Skeleton loading component with shimmer animation
 *
 * Variants:
 * - text: For text content (full width, small height)
 * - card: For card-like content (rounded corners)
 * - circle: For avatars/circular content
 * - button: For button-like content
 * - rectangle: Default rectangular shape
 */
export function Skeleton({
  className,
  variant = "rectangle",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 w-full rounded",
    card: "rounded-lg",
    circle: "rounded-full",
    button: "h-10 rounded-md",
    rectangle: "rounded-md",
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        "relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/10 before:to-transparent",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
