import { useNavigate } from 'react-router-dom'
import { Trophy, Copy, Sparkles, Library } from 'lucide-react'

interface OnboardingSuccessModalProps {
  schemaScore?: number
  creditsRemaining: number
  remainingUrls?: number
  onComplete: () => void
  onCopySchema?: () => void
}

export default function OnboardingSuccessModal({
  schemaScore = 85,
  creditsRemaining,
  remainingUrls = 0,
  onComplete,
  onCopySchema
}: OnboardingSuccessModalProps) {
  const navigate = useNavigate()

  const handleContinue = () => {
    onComplete()
    navigate('/generate')
  }

  const handleViewLibrary = () => {
    onComplete()
    navigate('/library')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Confetti-style header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border relative overflow-hidden">
          {/* Floating celebration elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 left-4 text-2xl animate-bounce">🎉</div>
            <div className="absolute top-6 right-6 text-2xl animate-bounce delay-100">✨</div>
            <div className="absolute bottom-6 left-8 text-2xl animate-bounce delay-200">🚀</div>
            <div className="absolute bottom-4 right-12 text-2xl animate-bounce delay-75">⭐</div>
          </div>

          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              You're Officially Super! 🎉
            </h2>
            {schemaScore > 0 && (
              <div className="inline-block px-4 py-2 bg-primary/20 rounded-full">
                <p className="text-lg font-semibold text-primary">
                  Score: {schemaScore}/100
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <h3 className="text-lg font-semibold mb-4">What's next?</h3>

          <div className="space-y-3 mb-6">
            {onCopySchema && (
              <button
                onClick={() => {
                  onCopySchema()
                  onComplete()
                }}
                className="w-full p-4 border-2 border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Copy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Copy & Conquer</p>
                    <p className="text-sm text-muted-foreground">Paste it in your site's &lt;head&gt; and watch the magic happen</p>
                  </div>
                </div>
              </button>
            )}

            {remainingUrls > 0 && (
              <button
                onClick={handleContinue}
                className="w-full p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Generate More Schemas</p>
                    <p className="text-sm text-muted-foreground">
                      {remainingUrls} more {remainingUrls === 1 ? 'page' : 'pages'} discovered
                    </p>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleViewLibrary}
              className="w-full p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Library className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Check Out Your Library</p>
                  <p className="text-sm text-muted-foreground">All your super schemas in one place</p>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              💳 You have <span className="font-semibold text-foreground">{creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'}</span> remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
