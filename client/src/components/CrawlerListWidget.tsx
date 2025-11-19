import { motion } from 'framer-motion'
import { Sparkles, Bot } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CrawlerListWidgetProps {
  crawlers: string[]
  isLoading?: boolean
  className?: string
}

export default function CrawlerListWidget({
  crawlers,
  isLoading = false,
  className = ''
}: CrawlerListWidgetProps) {
  // Get icon color based on crawler name
  const getCrawlerColor = (crawler: string) => {
    const lowerName = crawler.toLowerCase()
    if (lowerName.includes('chatgpt') || lowerName.includes('gpt')) {
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    }
    if (lowerName.includes('claude')) {
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    }
    if (lowerName.includes('gemini') || lowerName.includes('bard')) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
    if (lowerName.includes('perplexity')) {
      return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    }
    return 'bg-primary/10 text-primary border-primary/20'
  }

  if (isLoading) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'animate-pulse',
        className
      )}>
        <div className="h-8 w-48 bg-muted/20 rounded mb-6" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 w-24 bg-muted/20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (crawlers.length === 0) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        className
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Detected AI Crawlers
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No crawlers detected yet</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'hover:shadow-2xl hover:border-primary/50 transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Detected AI Crawlers
            </h3>
            <p className="text-sm text-muted-foreground">
              {crawlers.length} unique AI {crawlers.length === 1 ? 'crawler' : 'crawlers'} found
            </p>
          </div>
        </div>
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2">
          <span className="text-2xl font-black text-primary">{crawlers.length}</span>
        </div>
      </div>

      {/* Crawler Badges */}
      <div className="flex flex-wrap gap-3">
        {crawlers.map((crawler, index) => (
          <motion.div
            key={crawler}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'border transition-all duration-200',
              'hover:scale-105 hover:shadow-lg',
              getCrawlerColor(crawler)
            )}
          >
            <Bot className="h-4 w-4" />
            <span className="font-semibold text-sm">{crawler}</span>
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          These AI crawlers are actively indexing your content for their AI systems
        </p>
      </div>
    </motion.div>
  )
}
