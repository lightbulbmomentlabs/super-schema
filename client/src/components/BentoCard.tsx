import { motion, useInView } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/utils/cn'

interface BentoCardProps {
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  title: string
  description: string
  index: number
  featured?: boolean
  className?: string
}

export default function BentoCard({
  icon: Icon,
  title,
  description,
  index,
  featured = false,
  className = ''
}: BentoCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className={cn(
        'group relative bg-card border border-border rounded-2xl p-6 transition-all duration-300',
        'hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50',
        featured && 'md:col-span-2 md:row-span-2 p-8',
        className
      )}
    >
      {/* Decorative number badge */}
      <div className="absolute top-4 right-4 text-7xl font-black text-muted/5 select-none">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon with animation */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          className={cn(
            'inline-flex items-center justify-center rounded-xl bg-primary/10 p-3 mb-4',
            featured && 'p-4'
          )}
        >
          <Icon className={cn(
            'text-primary',
            featured ? 'h-8 w-8' : 'h-6 w-6'
          )} />
        </motion.div>

        <h3 className={cn(
          'font-bold mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent',
          featured ? 'text-3xl' : 'text-xl'
        )}>
          {title}
        </h3>

        <p className={cn(
          'text-muted-foreground leading-relaxed',
          featured ? 'text-lg' : 'text-base'
        )}>
          {description}
        </p>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </motion.div>
  )
}
