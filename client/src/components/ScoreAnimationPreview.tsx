import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, Sparkles } from 'lucide-react'

/**
 * ScoreAnimationPreview - Animated score transformation showing before/after
 * Demonstrates the value of AI refinement visually
 */
export default function ScoreAnimationPreview() {
  const [displayScore, setDisplayScore] = useState(73)
  const [phase, setPhase] = useState<'before' | 'transforming' | 'after'>('before')

  useEffect(() => {
    const runAnimation = async () => {
      // Wait 1 second showing initial score
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Start transformation
      setPhase('transforming')

      // Animate the score from 73 to 95
      const duration = 2000
      const startScore = 73
      const endScore = 95
      const startTime = Date.now()

      const updateScore = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentScore = Math.round(startScore + (endScore - startScore) * easeOutQuart)

        setDisplayScore(currentScore)

        if (progress < 1) {
          requestAnimationFrame(updateScore)
        } else {
          setPhase('after')
        }
      }

      updateScore()
    }

    runAnimation()

    // Restart animation every 6 seconds
    const interval = setInterval(() => {
      setPhase('before')
      setDisplayScore(73)
      runAnimation()
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success'
    if (score >= 75) return 'text-info'
    return 'text-warning'
  }

  const getGradeLabel = (score: number) => {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'A-'
    if (score >= 80) return 'B+'
    if (score >= 75) return 'B'
    return 'B-'
  }

  return (
    <div className="relative scale-110 lg:scale-125">
      {/* Floating mockup card */}
      <motion.div
        className="bg-card/50 backdrop-blur-md border border-border/50 rounded-lg shadow-2xl p-8 w-80 lg:w-96"
        initial={{ opacity: 0, y: 20, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Schema Quality</span>
          {phase === 'transforming' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <motion.div
              className={`text-6xl lg:text-7xl font-bold ${getScoreColor(displayScore)}`}
              key={displayScore}
              initial={{ scale: 1 }}
              animate={phase === 'transforming' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {displayScore}
            </motion.div>
            <div className="text-sm text-muted-foreground">out of 100</div>
          </div>

          <motion.div
            className={`px-4 py-2 rounded-full text-base lg:text-lg font-semibold ${
              displayScore >= 90
                ? 'bg-success/10 text-success'
                : displayScore >= 75
                ? 'bg-info/10 text-info'
                : 'bg-warning/10 text-warning'
            }`}
            key={`grade-${displayScore}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {getGradeLabel(displayScore)}
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              displayScore >= 90
                ? 'bg-success'
                : displayScore >= 75
                ? 'bg-info'
                : 'bg-warning'
            }`}
            initial={{ width: '73%' }}
            animate={{ width: `${displayScore}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Status message */}
        <motion.div
          className="flex items-center gap-2 text-sm"
          key={phase}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {phase === 'before' && (
            <>
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="text-muted-foreground">Before AI refinement</span>
            </>
          )}
          {phase === 'transforming' && (
            <>
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <span className="text-primary font-medium">Refining with AI...</span>
            </>
          )}
          {phase === 'after' && (
            <>
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success font-medium">After AI refinement</span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Floating sparkles around the card */}
      {phase === 'after' && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: 140,
                y: 80,
                scale: 0,
                opacity: 0,
              }}
              animate={{
                x: 140 + Math.cos((i * Math.PI * 2) / 6) * 60,
                y: 80 + Math.sin((i * Math.PI * 2) / 6) * 60,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            >
              <Sparkles className="h-4 w-4 text-success" />
            </motion.div>
          ))}
        </>
      )}
    </div>
  )
}
