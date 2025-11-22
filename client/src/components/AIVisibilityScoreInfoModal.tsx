import { X, TrendingUp, Target, Activity, Lightbulb } from 'lucide-react'

interface AIVisibilityScoreInfoModalProps {
  onClose: () => void
  currentScore: number
}

export default function AIVisibilityScoreInfoModal({ onClose, currentScore }: AIVisibilityScoreInfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            How Your AI Visibility Score Works ✨
          </h2>
          <p className="text-muted-foreground">
            Your score is like a report card for how AI platforms discover your site
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Current Score - Full Width */}
          <div className="bg-muted/20 border border-border/50 rounded-lg p-6 text-center mb-8">
            <p className="text-sm text-muted-foreground mb-1">Your Current Score</p>
            <p className="text-5xl font-bold text-primary">{currentScore}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Formula Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Score Breakdown (0-100)</h3>
              <div className="space-y-4">
                {/* Diversity */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">Diversity (40%)</p>
                      <span className="text-sm text-muted-foreground">0-40 pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      How many unique AI platforms (ChatGPT, Claude, Gemini, etc.) are sending people to your site
                    </p>
                  </div>
                </div>

                {/* Coverage */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">Coverage (40%)</p>
                      <span className="text-sm text-muted-foreground">0-40 pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      What percentage of your pages are being discovered by AI (more coverage = better)
                    </p>
                  </div>
                </div>

                {/* Volume */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">Volume (20%)</p>
                      <span className="text-sm text-muted-foreground">0-20 pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      How much AI referral traffic you're getting (more engagement = higher score)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: How to Improve */}
            <div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">How to Improve Your Score</h4>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">💡</span>
                    <span><strong>Add quality schema markup</strong> to pages that haven't been discovered yet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">💡</span>
                    <span><strong>Create comprehensive content</strong> that answers questions AI platforms care about</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">💡</span>
                    <span><strong>Keep content fresh and updated</strong> so AI crawlers keep coming back</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">💡</span>
                    <span><strong>Use SuperSchema</strong> to generate perfect structured data for every page 🎉</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button - Full Width */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}
