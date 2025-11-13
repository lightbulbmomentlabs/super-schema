import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface GlowingBadgeProps {
  icon: LucideIcon
  text: string
  className?: string
}

/**
 * GlowingBadge - A subtle info badge component
 * Perfect for highlighting important information like free credits
 */
export default function GlowingBadge({ icon: Icon, text, className = '' }: GlowingBadgeProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Subtle glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-success/10 blur-lg"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main badge - more subtle, info-style */}
      <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 backdrop-blur-sm">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon className="h-4 w-4 text-success" />
        </motion.div>
        <span className="font-medium text-sm text-success">{text}</span>
      </div>
    </div>
  )
}
