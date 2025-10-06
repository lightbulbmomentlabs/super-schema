import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import SuperSchemaLogo from './SuperSchemaLogo'

interface OnboardingWelcomeModalProps {
  userName?: string
  onStart: () => void
  onSkip: () => void
}

export default function OnboardingWelcomeModal({ userName, onStart, onSkip }: OnboardingWelcomeModalProps) {
  const navigate = useNavigate()

  const handleStart = () => {
    onStart()
    navigate('/generate')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border">
          <div className="flex justify-center mb-4 animate-bounce">
            <SuperSchemaLogo className="h-16 w-16" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Welcome to SuperSchema{userName ? `, ${userName}` : ''}! 🎉
          </h2>
          <p className="text-muted-foreground">
            You've got 2 free credits to try out your new superpowers
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create your first schema in 30 seconds
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <p>Drop your website URL (like a mic drop, but less dramatic)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <p>Watch AI do the heavy lifting (and the thinking)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <p>Grab your JSON-LD and become an SEO hero</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleStart}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Start Your First Schema
            </button>
            <button
              onClick={onSkip}
              className="w-full px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              I'll explore on my own
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
