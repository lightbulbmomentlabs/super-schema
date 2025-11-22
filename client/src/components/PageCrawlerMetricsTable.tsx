import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Bot, TrendingUp, Calendar, ChevronDown, ChevronUp, AlertCircle, Ban } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { PageCrawlerInfo, ExclusionPattern } from '@/services/ga4'
import { PagePathActionsDropdown } from '@/components/ga4/PagePathActionsDropdown'
import { GA4ExclusionManager } from '@/components/ga4/GA4ExclusionManager'
import { useGA4Exclusions } from '@/hooks/useGA4Exclusions'

/**
 * Check if a path matches an exclusion pattern
 */
function matchesPattern(path: string, pattern: ExclusionPattern): boolean {
  const { pattern: patternStr, patternType } = pattern

  switch (patternType) {
    case 'exact':
      return path === patternStr

    case 'prefix':
      return path.startsWith(patternStr)

    case 'suffix':
      return path.endsWith(patternStr)

    case 'regex':
      try {
        const regex = new RegExp(patternStr)
        return regex.test(path)
      } catch {
        return false
      }

    default:
      return false
  }
}

/**
 * Check if a path is excluded by any active pattern
 */
function isPathExcluded(path: string, patterns: ExclusionPattern[]): { excluded: boolean; pattern?: ExclusionPattern } {
  const activePatterns = patterns.filter(p => p.isActive)
  for (const pattern of activePatterns) {
    if (matchesPattern(path, pattern)) {
      return { excluded: true, pattern }
    }
  }
  return { excluded: false }
}

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
  nonCrawledPages?: string[]
  mappingId?: string
  domain?: string
  isLoading?: boolean
  className?: string
}

export default function PageCrawlerMetricsTable({
  pages,
  nonCrawledPages = [],
  mappingId,
  domain,
  isLoading = false,
  className = ''
}: PageCrawlerMetricsTableProps) {
  const [showAllCrawled, setShowAllCrawled] = useState(false)

  // Fetch exclusion patterns for this mapping
  const { data: exclusionPatterns = [] } = useGA4Exclusions(mappingId)

  // Check which non-crawled pages are excluded
  const categorizedPages = useMemo(() => {
    const excluded: Array<{ path: string; pattern: ExclusionPattern }> = []
    const active: string[] = []

    for (const path of nonCrawledPages) {
      const result = isPathExcluded(path, exclusionPatterns)
      if (result.excluded && result.pattern) {
        excluded.push({ path, pattern: result.pattern })
      } else {
        active.push(path)
      }
    }

    return { excluded, active }
  }, [nonCrawledPages, exclusionPatterns])

  // Auto-expand "Pages Not Yet Discovered" section when there are pages (active or excluded)
  const [showNonCrawled, setShowNonCrawled] = useState(false)

  // Auto-expand on mount if there are any non-crawled pages
  useEffect(() => {
    if (categorizedPages.active.length > 0 || categorizedPages.excluded.length > 0) {
      setShowNonCrawled(true)
    }
  }, [categorizedPages.active.length, categorizedPages.excluded.length])

  // Show top 10 by default, all when expanded
  const displayedPages = showAllCrawled ? pages : pages.slice(0, 10)
  const hasMorePages = pages.length > 10
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
            {displayedPages.map((page, index) => (
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

      {/* View All / Collapse Button */}
      {hasMorePages && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <button
            onClick={() => setShowAllCrawled(!showAllCrawled)}
            className="w-full px-4 py-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/50 hover:border-primary/50 transition-all text-sm font-semibold text-foreground flex items-center justify-center gap-2"
          >
            {showAllCrawled ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Top 10 Pages
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View All {pages.length} Pages
              </>
            )}
          </button>
        </div>
      )}

      {/* Non-Crawled Pages Section */}
      {nonCrawledPages.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <button
            onClick={() => setShowNonCrawled(!showNonCrawled)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-lg bg-orange-500/10 p-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    Pages Not Yet Discovered ({categorizedPages.active.length})
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {categorizedPages.excluded.length > 0
                      ? `${categorizedPages.excluded.length} ignored • ${categorizedPages.active.length} need quality schema ✨`
                      : 'These pages need quality schema to attract AI crawlers ✨'
                    }
                  </p>
                </div>
              </div>
              {showNonCrawled ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {showNonCrawled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              {/* Exclusion Manager Panel */}
              {mappingId && domain && (
                <GA4ExclusionManager mappingId={mappingId} domain={domain} />
              )}

              {/* Active Pages (Not Excluded) */}
              {categorizedPages.active.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Active Pages ({categorizedPages.active.length})
                  </h5>
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {categorizedPages.active.map((path) => (
                      <div
                        key={path}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-background border border-border/50 text-sm hover:border-primary/30 transition-colors group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-orange-500/50 flex-shrink-0" />
                          <span className="text-foreground truncate" title={path}>
                            {path}
                          </span>
                        </div>
                        {mappingId && (
                          <PagePathActionsDropdown
                            path={path}
                            mappingId={mappingId}
                            onPatternCreated={() => {
                              // Pattern was created successfully, categorizedPages will auto-update via hook
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Excluded Pages */}
              {categorizedPages.excluded.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-green-500/5 border-2 border-green-500/30"
                >
                  <h5 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Successfully Ignored ({categorizedPages.excluded.length})
                  </h5>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {categorizedPages.excluded.map(({ path, pattern }, index) => (
                      <motion.div
                        key={path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded bg-green-500/10 border border-green-500/30 text-sm"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Ban className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-foreground/70 line-through truncate" title={`${path} - Excluded by: ${pattern.pattern}`}>
                            {path}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-700 border border-green-500/30" title={pattern.description || undefined}>
                            {pattern.category}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}
