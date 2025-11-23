import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface FloatingMetricBadgeProps {
  label: string
  value: number
  icon: LucideIcon
  delay?: number
}

export default function FloatingMetricBadge({
  label,
  value,
  icon: Icon,
  delay = 0
}: FloatingMetricBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                 bg-background/60 backdrop-blur-md border border-border/50
                 shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay * 0.5
        }}
        className="flex items-center gap-2"
      >
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-primary">{value}%</span>
      </motion.div>
    </motion.div>
  )
}
