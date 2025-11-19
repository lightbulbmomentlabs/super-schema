import { motion } from 'framer-motion'
import { Bot, TrendingUp, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { CrawlerStats } from '@/services/ga4'

interface TopCrawlersTableProps {
  crawlers: CrawlerStats[]
  isLoading?: boolean
  className?: string
}

export default function TopCrawlersTable({
  crawlers,
  isLoading = false,
  className = ''
}: TopCrawlersTableProps) {
  if (isLoading) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'animate-pulse',
        className
      )}>
        <div className="h-8 w-48 bg-muted/20 rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded" />
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
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Top AI Crawlers
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No AI crawler data available</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Connect your GA4 property to start tracking AI crawlers
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'hover:shadow-2xl hover:border-primary/50 transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Top AI Crawlers
          </h3>
          <p className="text-sm text-muted-foreground">
            Most active AI crawlers on your site
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Crawler
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Sessions
                </div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  <FileText className="h-4 w-4" />
                  Page Views
                </div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                Unique Pages
              </th>
            </tr>
          </thead>
          <tbody>
            {crawlers.map((crawler, index) => (
              <motion.tr
                key={crawler.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      index === 0 && 'bg-green-500',
                      index === 1 && 'bg-blue-500',
                      index === 2 && 'bg-purple-500',
                      index > 2 && 'bg-muted-foreground/50'
                    )} />
                    <span className="font-medium text-foreground">
                      {crawler.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-semibold text-foreground">
                  {crawler.sessions.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-semibold text-foreground">
                  {crawler.pageViews.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right text-muted-foreground">
                  {crawler.uniquePages.toLocaleString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
