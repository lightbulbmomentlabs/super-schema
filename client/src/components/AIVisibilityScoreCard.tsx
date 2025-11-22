import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Eye, Info, Activity } from 'lucide-react'
import { cn } from '@/utils/cn'
import AIVisibilityScoreInfoModal from './AIVisibilityScoreInfoModal'

interface AIVisibilityScoreCardProps {
  score: number
  diversityScore: number
  coveragePercentage: number
  scoreBreakdown?: {
    diversityPoints: number      // 0-40 points
    coveragePoints: number        // 0-40 points
    volumePoints: number          // 0-20 points
    totalAiSessions: number       // Raw count for reference
  }
  isLoading?: boolean
  className?: string
}

export default function AIVisibilityScoreCard({
  score,
  diversityScore,
  coveragePercentage,
  scoreBreakdown,
  isLoading = false,
  className = ''
}: AIVisibilityScoreCardProps) {
  const [showInfoModal, setShowInfoModal] = useState(false)
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/20'
    if (score >= 60) return 'from-yellow-500/20 to-amber-500/20'
    if (score >= 40) return 'from-orange-500/20 to-red-500/20'
    return 'from-red-500/20 to-rose-500/20'
  }

  if (isLoading) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'animate-pulse h-full',
        className
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-muted/20 rounded" />
          <div className="h-12 w-12 bg-muted/20 rounded-full" />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-32 w-32 bg-muted/20 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative group bg-card border border-border rounded-2xl p-8',
        'hover:shadow-2xl hover:border-primary/50 transition-all duration-300',
        'h-full',
        className
      )}
    >
      {/* Gradient background effect */}
      <div className={cn(
        'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10',
        getScoreGradient(score)
      )} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              AI Visibility Score
            </h3>
            <p className="text-sm text-muted-foreground">
              How well AIs discover your content
            </p>
          </div>
        </div>
        <Sparkles className="h-8 w-8 text-primary/50" />
      </div>

      {/* Main Score Display */}
      <div className="relative z-10 flex items-center justify-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          {/* Circle background */}
          <svg className="w-40 h-40 -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/20"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className={getScoreColor(score)}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
              style={{
                strokeDasharray: `${2 * Math.PI * 70}`,
                strokeDashoffset: `${2 * Math.PI * 70 * (1 - score / 100)}`
              }}
            />
          </svg>

          {/* Score number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <div className={cn('text-5xl font-black', getScoreColor(score))}>
                {score}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                out of 100
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Score Breakdown Bars */}
      {scoreBreakdown && (
        <div className="relative z-10 mt-6 pt-6 border-t border-border/50">
          <div className="space-y-3">
            {/* AI Diversity Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center text-foreground">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  AI Diversity
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {scoreBreakdown.diversityPoints}/40 pts
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreBreakdown.diversityPoints / 40) * 100}%` }}
                  transition={{ delay: 1.0, duration: 0.5, ease: 'easeOut' }}
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                />
              </div>
            </div>

            {/* Coverage Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center text-foreground">
                  <TrendingUp className="h-4 w-4 mr-2 text-info" />
                  Coverage
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {scoreBreakdown.coveragePoints}/40 pts
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreBreakdown.coveragePoints / 40) * 100}%` }}
                  transition={{ delay: 1.1, duration: 0.5, ease: 'easeOut' }}
                  className="h-2 rounded-full bg-info transition-all duration-500"
                />
              </div>
            </div>

            {/* Volume Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center text-foreground">
                  <Activity className="h-4 w-4 mr-2 text-success" />
                  Volume
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {scoreBreakdown.volumePoints}/20 pts
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreBreakdown.volumePoints / 20) * 100}%` }}
                  transition={{ delay: 1.2, duration: 0.5, ease: 'easeOut' }}
                  className="h-2 rounded-full bg-success transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How this is calculated - Prominent Link */}
      <div className="relative z-10 mt-4 pt-4 border-t border-border/50">
        <button
          onClick={() => setShowInfoModal(true)}
          className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center justify-center gap-1.5"
        >
          <Info className="h-4 w-4" />
          How is this calculated?
        </button>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <AIVisibilityScoreInfoModal
          currentScore={score}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </motion.div>
  )
}
