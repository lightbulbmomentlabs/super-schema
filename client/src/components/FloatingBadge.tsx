import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface FloatingBadgeProps {
  children: React.ReactNode
  className?: string
}

export default function FloatingBadge({ children, className = '' }: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`inline-flex ${className}`}
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="relative"
      >
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {children}
          </span>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10" />
      </motion.div>
    </motion.div>
  )
}
