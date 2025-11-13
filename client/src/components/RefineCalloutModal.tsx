import { X, Zap, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface RefineCalloutModalProps {
  isOpen: boolean
  onClose: () => void
  onRefine: () => void
  currentScore: number
  isRefining?: boolean
}

export default function RefineCalloutModal({
  isOpen,
  onClose,
  onRefine,
  currentScore,
  isRefining = false
}: RefineCalloutModalProps) {
  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fire confetti from both sides
      const duration = 2000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        // Right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRefine = () => {
    onRefine()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-card border border-border rounded-lg shadow-2xl max-w-lg w-full mx-4 p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon/Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary via-purple-500 to-primary mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>

          {/* Animated sparkle emojis */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl animate-bounce">✨</span>
            <h2 className="text-2xl font-bold">Watch the Magic Happen!</h2>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
          </div>

          <p className="text-muted-foreground">
            Your schema scored <span className="font-bold text-foreground">{currentScore}/100</span>
          </p>
        </div>

        {/* Main Content */}
        <div className="mb-6 space-y-4">
          <p className="text-center text-base">
            Your schema is <span className="font-semibold text-foreground">good</span>, but our AI can make it{' '}
            <span className="font-bold text-primary text-lg">super</span>!
          </p>

          <div className="bg-info/10 border border-info rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">One-Click AI Enhancement</p>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your schema and automatically add advanced features,
                  optimize content quality, and boost your SEO score by 10-20 points on average.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-success/10 border border-success rounded-lg p-4">
            <p className="text-sm text-center">
              💡 <span className="font-semibold">Pro tip:</span> Most users see their score jump from the{' '}
              <span className="font-semibold">70s to 90s</span> after their first refinement!
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRefine}
            disabled={isRefining}
            className="w-full flex items-center justify-center px-6 py-4 text-lg font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isRefining ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                Refining Schema...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Refine with AI Now
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
