import { motion } from 'framer-motion'
import { Brain, Sparkles, Zap, Bot, Search, MessageSquare } from 'lucide-react'

/**
 * FloatingAIIcons - Animated AI engine icons that float across the background
 * Represents ChatGPT, Perplexity, Gemini, and other AI search engines
 */
export default function FloatingAIIcons() {
  // Define the AI engines with their colors and icons
  const aiEngines = [
    {
      name: 'ChatGPT',
      icon: MessageSquare,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      size: 'h-12 w-12',
      delay: 0,
      duration: 20,
      x: ['0%', '100%'],
      y: ['0%', '30%'],
    },
    {
      name: 'Perplexity',
      icon: Search,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      size: 'h-10 w-10',
      delay: 2,
      duration: 25,
      x: ['100%', '0%'],
      y: ['20%', '60%'],
    },
    {
      name: 'Gemini',
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      size: 'h-14 w-14',
      delay: 4,
      duration: 22,
      x: ['50%', '80%'],
      y: ['10%', '70%'],
    },
    {
      name: 'Claude',
      icon: Brain,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      size: 'h-11 w-11',
      delay: 1,
      duration: 24,
      x: ['20%', '90%'],
      y: ['50%', '20%'],
    },
    {
      name: 'AI Search',
      icon: Bot,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      size: 'h-9 w-9',
      delay: 3,
      duration: 28,
      x: ['80%', '10%'],
      y: ['60%', '10%'],
    },
    {
      name: 'AI Engine',
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      size: 'h-10 w-10',
      delay: 5,
      duration: 26,
      x: ['30%', '70%'],
      y: ['80%', '40%'],
    },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {aiEngines.map((engine) => {
        const Icon = engine.icon

        return (
          <motion.div
            key={engine.name}
            className={`absolute ${engine.size} rounded-full ${engine.bgColor} backdrop-blur-sm flex items-center justify-center border border-white/10`}
            initial={{
              x: engine.x[0],
              y: engine.y[0],
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: engine.x,
              y: engine.y,
              opacity: [0, 0.4, 0.6, 0.4, 0],
              scale: [0, 1, 1, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: engine.duration,
              delay: engine.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              left: '0%',
              top: '0%',
            }}
          >
            <Icon className={`${engine.color} ${engine.size === 'h-14 w-14' ? 'h-7 w-7' : engine.size === 'h-12 w-12' ? 'h-6 w-6' : 'h-5 w-5'}`} />
          </motion.div>
        )
      })}

      {/* Additional sparkle effects */}
      {[...Array(6)].map((_, sparkleIndex) => (
        <motion.div
          key={`sparkle-${sparkleIndex}`}
          className="absolute"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3,
            delay: sparkleIndex * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="h-4 w-4 text-primary/40" />
        </motion.div>
      ))}
    </div>
  )
}
