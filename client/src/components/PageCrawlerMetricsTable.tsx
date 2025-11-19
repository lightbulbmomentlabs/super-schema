import { motion } from 'framer-motion'
import { FileText, Bot, TrendingUp, Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { PageCrawlerInfo } from '@/services/ga4'

// Helper function to format date in a friendly way
function formatLastCrawled(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }

  // For older dates, show the actual date
  const month = date.toLocaleString('default', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  const currentYear = now.getFullYear()

  // Don't show year if it's the current year
  return currentYear === year ? `${month} ${day}` : `${month} ${day}, ${year}`
}

interface PageCrawlerMetricsTableProps {
  pages: PageCrawlerInfo[]
  isLoading?: boolean
  className?: string
}

export default function PageCrawlerMetricsTable({
  pages,
  isLoading = false,
  className = ''
}: PageCrawlerMetricsTableProps) {
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

  if (pages.length === 0) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        className
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Pages Crawled by AI
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No AI crawler activity detected yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add schemas to your pages to attract AI crawlers
          </p>
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
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Pages Crawled by AI
          </h3>
          <p className="text-sm text-muted-foreground">
            Your top performing pages by AI crawler diversity
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Page Path
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <Bot className="h-4 w-4" />
                  AI Crawlers
                </div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                Crawler Names
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Last Crawled
                </div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Sessions
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, index) => (
              <motion.tr
                key={page.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors"
              >
                {/* Page Path */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      page.crawlerCount >= 5 && 'bg-green-500',
                      page.crawlerCount >= 3 && page.crawlerCount < 5 && 'bg-yellow-500',
                      page.crawlerCount < 3 && 'bg-muted-foreground/50'
                    )} />
                    <span className="font-medium text-foreground text-sm truncate max-w-[200px] lg:max-w-[400px]" title={page.path}>
                      {page.path}
                    </span>
                  </div>
                </td>

                {/* Crawler Count Badge */}
                <td className="py-4 px-4 text-center">
                  <span className={cn(
                    'inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold',
                    page.crawlerCount >= 5 && 'bg-green-500/10 text-green-500',
                    page.crawlerCount >= 3 && page.crawlerCount < 5 && 'bg-yellow-500/10 text-yellow-500',
                    page.crawlerCount < 3 && 'bg-muted-foreground/10 text-muted-foreground'
                  )}>
                    {page.crawlerCount}
                  </span>
                </td>

                {/* Crawler Names (hidden on mobile) */}
                <td className="py-4 px-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1.5">
                    {page.crawlers.slice(0, 4).map((crawler) => (
                      <span
                        key={crawler}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                      >
                        {crawler}
                      </span>
                    ))}
                    {page.crawlers.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                        +{page.crawlers.length - 4}
                      </span>
                    )}
                  </div>
                </td>

                {/* Last Crawled (hidden on mobile) */}
                <td className="py-4 px-4 text-center hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {formatLastCrawled(page.lastCrawled)}
                  </span>
                </td>

                {/* Sessions */}
                <td className="py-4 px-4 text-right font-semibold text-foreground">
                  {page.sessions.toLocaleString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      {pages.length === 10 && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            Showing top 10 pages. More detailed analytics coming soon!
          </p>
        </div>
      )}
    </motion.div>
  )
}
