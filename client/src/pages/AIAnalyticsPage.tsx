import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react'
import { useGA4Connection } from '@/hooks/useGA4Connection'
import { useGA4DomainMappings } from '@/hooks/useGA4DomainMappings'
import { useGA4Metrics } from '@/hooks/useGA4Metrics'
import AIVisibilityScoreCard from '@/components/AIVisibilityScoreCard'
import TopCrawlersTable from '@/components/TopCrawlersTable'
import CrawlerListWidget from '@/components/CrawlerListWidget'
import GA4ConnectionStatus from '@/components/GA4ConnectionStatus'
import DomainMappingSelector from '@/components/DomainMappingSelector'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

export default function AIAnalyticsPage() {
  const navigate = useNavigate()

  // State for date range (default to last 30 days)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })

  // Fetch connection status
  const { connected, connection, disconnect, isDisconnecting } = useGA4Connection()

  // Fetch domain mappings
  const {
    mappings,
    isLoading: isMappingsLoading,
    deleteMapping,
    isDeleting
  } = useGA4DomainMappings(connected)

  // Selected domain mapping
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null)

  // Auto-select first mapping when available
  useMemo(() => {
    if (mappings.length > 0 && !selectedMappingId) {
      setSelectedMappingId(mappings[0].id)
    }
  }, [mappings, selectedMappingId])

  const selectedMapping = mappings.find(m => m.id === selectedMappingId)

  // Fetch metrics for selected domain
  const {
    metrics,
    isLoading: isMetricsLoading,
    refresh,
    isRefreshing
  } = useGA4Metrics(
    selectedMapping?.propertyId || null,
    dateRange.start,
    dateRange.end,
    !!selectedMapping
  )

  const handleConnect = () => {
    navigate('/ga4/connect')
  }

  const handleCreateNewMapping = () => {
    navigate('/ga4/connect')
  }

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect Google Analytics? This will remove all domain mappings.')) {
      disconnect()
    }
  }

  // Quick date range presets
  const handleDatePreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                AI Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Track how AI crawlers discover and index your content
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <GA4ConnectionStatus
          connected={connected}
          connection={connection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isDisconnecting={isDisconnecting}
          className="mb-8"
        />

        {/* If not connected, show empty state */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Connect Google Analytics
              </h2>
              <p className="text-muted-foreground mb-6">
                Connect your Google Analytics 4 property to start tracking AI crawler activity on your website.
              </p>
              <button
                onClick={handleConnect}
                className={cn(
                  'px-6 py-3 rounded-lg font-semibold',
                  'bg-gradient-to-r from-primary to-primary/80',
                  'text-primary-foreground',
                  'hover:shadow-lg hover:scale-105',
                  'transition-all duration-200'
                )}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}

        {/* If connected but no mappings */}
        {connected && mappings.length === 0 && !isMappingsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Connect Your First Domain
              </h2>
              <p className="text-muted-foreground mb-6">
                Map a GA4 property to your domain to start tracking AI crawler analytics.
              </p>
              <button
                onClick={handleCreateNewMapping}
                className={cn(
                  'px-6 py-3 rounded-lg font-semibold',
                  'bg-gradient-to-r from-primary to-primary/80',
                  'text-primary-foreground',
                  'hover:shadow-lg hover:scale-105',
                  'transition-all duration-200'
                )}
              >
                Connect Domain
              </button>
            </div>
          </motion.div>
        )}

        {/* Analytics Dashboard */}
        {connected && mappings.length > 0 && (
          <div className="space-y-8">
            {/* Domain Selector and Date Range */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DomainMappingSelector
                mappings={mappings}
                selectedMappingId={selectedMappingId}
                onSelect={setSelectedMappingId}
                onCreateNew={handleCreateNewMapping}
                onDelete={deleteMapping}
                isLoading={isMappingsLoading}
                isDeleting={isDeleting}
              />

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-2">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-2">Date Range</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDatePreset(7)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          dateRange.start === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        7 days
                      </button>
                      <button
                        onClick={() => handleDatePreset(30)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          'bg-primary text-primary-foreground'
                        )}
                      >
                        30 days
                      </button>
                      <button
                        onClick={() => handleDatePreset(90)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        90 days
                      </button>
                      <button
                        onClick={() => refresh()}
                        disabled={isRefreshing}
                        className={cn(
                          'ml-auto p-2 rounded-lg transition-all',
                          'bg-muted/30 text-muted-foreground hover:bg-muted/50',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          isRefreshing && 'animate-spin'
                        )}
                        title="Refresh metrics"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* AI Visibility Score */}
              <div className="lg:col-span-1">
                <AIVisibilityScoreCard
                  score={metrics?.aiVisibilityScore || 0}
                  diversityScore={metrics?.aiDiversityScore || 0}
                  coveragePercentage={metrics?.coveragePercentage || 0}
                  isLoading={isMetricsLoading}
                />
              </div>

              {/* Crawler List */}
              <div className="lg:col-span-2">
                <CrawlerListWidget
                  crawlers={metrics?.crawlerList || []}
                  isLoading={isMetricsLoading}
                />
              </div>
            </div>

            {/* Top Crawlers Table */}
            <TopCrawlersTable
              crawlers={metrics?.topCrawlers || []}
              isLoading={isMetricsLoading}
            />

            {/* Summary Stats */}
            {metrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-foreground mb-1">
                    {metrics.totalPages.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-green-500 mb-1">
                    {metrics.aiCrawledPages.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">AI Crawled</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-primary mb-1">
                    {metrics.crawlerList.length}
                  </p>
                  <p className="text-sm text-muted-foreground">AI Crawlers</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-foreground mb-1">
                    {metrics.coveragePercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Coverage</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
