import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface ScoreBreakdownBarProps {
  label: string
  value: number
  icon: LucideIcon
  delay?: number
  color?: 'green' | 'blue' | 'purple' | 'pink'
}

const colorStyles = {
  green: 'from-green-500 to-emerald-600',
  blue: 'from-blue-500 to-cyan-600',
  purple: 'from-purple-500 to-violet-600',
  pink: 'from-pink-500 to-rose-600'
}

export default function ScoreBreakdownBar({
  label,
  value,
  icon: Icon,
  delay = 0,
  color = 'green'
}: ScoreBreakdownBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      className="space-y-2"
    >
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
          className="text-sm font-bold text-primary"
        >
          {value}%
        </motion.span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Animated fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{
            delay: delay + 0.1,
            duration: 1,
            ease: [0.21, 0.47, 0.32, 0.98]
          }}
          className={`h-full bg-gradient-to-r ${colorStyles[color]} relative`}
        >
          {/* Shine effect */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              delay: delay + 0.5,
              duration: 1.5,
              ease: 'easeInOut'
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
