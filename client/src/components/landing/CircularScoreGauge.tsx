import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface CircularScoreGaugeProps {
  targetScore: number
  size?: number
  isInView: boolean
}

export default function CircularScoreGauge({
  targetScore,
  size = 240,
  isInView
}: CircularScoreGaugeProps) {
  const [showParticles, setShowParticles] = useState(false)

  // Animated score value
  const motionScore = useMotionValue(0)
  const springScore = useSpring(motionScore, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.01
  })

  // Round the score for display
  const displayScore = useTransform(springScore, (value) => Math.round(value))

  // Trigger animation when in view
  useEffect(() => {
    if (isInView) {
      motionScore.set(targetScore)
      // Show particles after animation completes
      setTimeout(() => {
        if (targetScore >= 90) {
          setShowParticles(true)
        }
      }, 1500)
    }
  }, [isInView, targetScore, motionScore])

  // Calculate grade based on score
  const getGrade = (score: number) => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    return 'D'
  }

  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#16a34a' // green-600
    if (score >= 75) return '#3b82f6' // blue-500
    if (score >= 60) return '#f59e0b' // orange-500
    return '#ef4444' // red-500
  }

  const radius = (size - 40) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Calculate stroke offset based on score
  const scorePercentage = useTransform(springScore, (value) => value / 100)
  const strokeDashoffset = useTransform(
    scorePercentage,
    [0, 1],
    [circumference, 0]
  )

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glowing background effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 -z-10"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     bg-primary/20 rounded-full blur-3xl animate-pulse"
          style={{ width: size * 1.2, height: size * 1.2 }}
        />
      </motion.div>

      {/* SVG Gauge */}
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          {/* Gradient definition */}
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6338A0" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/20"
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          filter="url(#glow)"
          initial={{ strokeDashoffset: circumference }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Animated score number */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <motion.div className="text-5xl md:text-6xl font-bold">
            {displayScore}
          </motion.div>
          <div className="text-sm text-muted-foreground mt-1">out of 100</div>
        </motion.div>

        {/* Grade badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
          className="mt-4 px-4 py-1 rounded-full bg-primary/10 border border-primary/20"
        >
          <span className="text-lg font-bold text-primary">
            {getGrade(targetScore)}
          </span>
        </motion.div>
      </div>

      {/* Celebration particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8
            const distance = size * 0.5
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
                  duration: 1,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
