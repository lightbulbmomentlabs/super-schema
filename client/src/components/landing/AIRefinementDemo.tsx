import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Check } from 'lucide-react'

export default function AIRefinementDemo() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [stage, setStage] = useState<'before' | 'refining' | 'after'>('before')
  const [score, setScore] = useState(73)

  // Auto-play animation sequence when in view
  useEffect(() => {
    if (!isInView) return

    const timers: NodeJS.Timeout[] = []

    // Start refinement after 1 second
    timers.push(setTimeout(() => setStage('refining'), 1000))

    // Complete refinement after 2.5 seconds
    timers.push(setTimeout(() => {
      setStage('after')
      // Animate score from 73 to 95
      let current = 73
      const interval = setInterval(() => {
        current += 1
        setScore(current)
        if (current >= 95) clearInterval(interval)
      }, 30)
      timers.push(interval as unknown as NodeJS.Timeout)
    }, 3500))

    return () => timers.forEach(clearTimeout)
  }, [isInView])

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-blue-500'
    return 'text-orange-500'
  }

  const getGrade = (score: number) => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    return 'C+'
  }

  return (
    <div
      ref={ref}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Mock interface card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />

        {/* Content */}
        <div className="relative p-8 space-y-6">
          {/* Score display */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Schema Quality Score</div>
            <motion.div
              key={score}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`text-6xl font-bold ${getGradeColor(score)}`}
            >
              {score}
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">out of 100</div>

            {/* Grade badge */}
            <motion.div
              layout
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-muted/50 border border-border"
            >
              <span className={`text-lg font-bold ${getGradeColor(score)}`}>
                {getGrade(score)}
              </span>
            </motion.div>
          </div>

          {/* Issues found (before state) */}
          <AnimatePresence mode="wait">
            {stage === 'before' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="text-sm text-muted-foreground">Issues to fix:</div>
                <div className="space-y-1">
                  {['Missing required properties', 'Incomplete author info', 'No image metadata'].map((issue, i) => (
                    <motion.div
                      key={issue}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-orange-500"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {issue}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Refine button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: stage === 'before' ? 1.02 : 1 }}
              whileTap={{ scale: stage === 'before' ? 0.98 : 1 }}
              className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                stage === 'refining'
                  ? 'bg-primary/50 text-primary-foreground cursor-wait'
                  : stage === 'after'
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              disabled={stage !== 'before'}
            >
              <AnimatePresence mode="wait">
                {stage === 'before' && (
                  <motion.div
                    key="before"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Refine with AI</span>
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                )}
                {stage === 'refining' && (
                  <motion.div
                    key="refining"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                    <span>Optimizing...</span>
                  </motion.div>
                )}
                {stage === 'after' && (
                  <motion.div
                    key="after"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    <span>Optimized!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Processing animation overlay */}
            {stage === 'refining' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full"
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>

          {/* Success message (after state) */}
          <AnimatePresence mode="wait">
            {stage === 'after' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">All issues resolved!</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Added missing properties, enhanced metadata, and optimized for AEO
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Particle effects on completion */}
        <AnimatePresence>
          {stage === 'after' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12
                const distance = 100
                return (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    initial={{
                      opacity: 0,
                      scale: 0,
                      x: 0,
                      y: 0
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: Math.cos((angle * Math.PI) / 180) * distance,
                      y: Math.sin((angle * Math.PI) / 180) * distance
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: 'easeOut'
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-green-500" />
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating "Before" and "After" labels */}
      <AnimatePresence>
        {stage !== 'refining' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-background border border-border text-xs font-medium shadow-lg"
          >
            {stage === 'before' ? 'Before' : 'After'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
