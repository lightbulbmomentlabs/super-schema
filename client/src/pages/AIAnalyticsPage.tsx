import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { useGA4Connection } from '@/hooks/useGA4Connection'
import { useGA4DomainMappings } from '@/hooks/useGA4DomainMappings'
import { useGA4Metrics } from '@/hooks/useGA4Metrics'
import { useGA4ActivitySnapshots } from '@/hooks/useGA4ActivitySnapshots'
import type { GA4DomainMapping } from '@/services/ga4'
import AIVisibilityScoreCard from '@/components/AIVisibilityScoreCard'
import AIActivityTrendChart from '@/components/AIActivityTrendChart'
import TopCrawlersTable from '@/components/TopCrawlersTable'
import PageCrawlerMetricsTable from '@/components/PageCrawlerMetricsTable'
import GA4ConnectionStatus from '@/components/GA4ConnectionStatus'
import DomainMappingSelector from '@/components/DomainMappingSelector'
import { FeatureGate } from '@/components/FeatureGate'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

function AIAnalyticsContent() {
  const navigate = useNavigate()

  // State for date range (default to last 30 days from today)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })

  // Minimum loading time state to prevent flash
  const [showLoading, setShowLoading] = useState(true)
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false)

  // Fetch connection status
  const {
    connected,
    connections,
    activeConnection,
    disconnect,
    isDisconnecting,
    switchConnection,
    isSwitching,
    isLoading: isConnectionLoading
  } = useGA4Connection()

  // Ensure loading state shows for at least 500ms to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Update showLoading based on both connection loading and minimum time
  useEffect(() => {
    if (!isConnectionLoading && minLoadingTimePassed) {
      setShowLoading(false)
    }
  }, [isConnectionLoading, minLoadingTimePassed])

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

  const selectedMapping = mappings.find((m: GA4DomainMapping) => m.id === selectedMappingId)

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

  // Fetch activity snapshots for selected domain
  const {
    snapshots,
    isLoading: isSnapshotsLoading,
    refetch: refetchSnapshots
  } = useGA4ActivitySnapshots(
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

  const handleDisconnect = (connectionId?: string) => {
    if (window.confirm('Are you sure you want to disconnect this Google Analytics account? This will remove all domain mappings for this account.')) {
      if (connectionId) {
        disconnect(connectionId)
      }
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
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                AI Visibility
              </h1>
              <p className="text-muted-foreground mt-1">
                Track how AI crawlers discover and index your content
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Show loading state while checking connection */}
        {showLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Loading...
              </h2>
              <p className="text-muted-foreground">
                Checking your Google Analytics connection
              </p>
            </div>
          </motion.div>
        )}

        {/* If not connected, show empty state */}
        {!showLoading && !connected && (
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
          <div className="space-y-6">
            {/* Row 1: GA4 Connection Status + Domain Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GA4ConnectionStatus
                connected={connected}
                connections={connections}
                activeConnection={activeConnection}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onSwitchAccount={switchConnection}
                isDisconnecting={isDisconnecting}
                isSwitching={isSwitching}
                compact={true}
              />

              <DomainMappingSelector
                mappings={mappings}
                selectedMappingId={selectedMappingId}
                onSelect={setSelectedMappingId}
                onCreateNew={handleCreateNewMapping}
                onDelete={deleteMapping}
                isLoading={isMappingsLoading}
                isDeleting={isDeleting}
              />
            </div>

            {/* Row 2: Date Range Controls */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-2">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Date Range</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">
                    Last 30 days
                  </div>
                </div>

                <button
                  onClick={() => refresh()}
                  disabled={isRefreshing}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    'bg-primary/10 text-primary hover:bg-primary/20',
                    'border border-primary/30 hover:border-primary/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'inline-flex items-center gap-2'
                  )}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* AI Visibility Score */}
              <div className="lg:col-span-1 flex">
                <AIVisibilityScoreCard
                  score={metrics?.aiVisibilityScore || 0}
                  diversityScore={metrics?.aiDiversityScore || 0}
                  coveragePercentage={metrics?.coveragePercentage || 0}
                  scoreBreakdown={metrics?.scoreBreakdown}
                  isLoading={isMetricsLoading}
                  className="w-full"
                />
              </div>

              {/* AI Visibility Trend Chart */}
              <div className="lg:col-span-2 flex">
                <AIActivityTrendChart
                  snapshots={snapshots}
                  isLoading={isSnapshotsLoading}
                  onRetry={() => refetchSnapshots()}
                  className="w-full"
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
                className="grid grid-cols-2 lg:grid-cols-5 gap-4"
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
                  <p className="text-3xl font-black text-orange-500 mb-1">
                    {metrics.ignoredPagesCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Ignored Pages</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-red-500 mb-1">
                    {metrics.nonCrawledPages.length.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Not Yet Discovered</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-foreground mb-1">
                    {metrics.coveragePercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Coverage</p>
                </div>
              </motion.div>
            )}

            {/* Page-Level Crawler Metrics Table */}
            <PageCrawlerMetricsTable
              pages={metrics?.topPages || []}
              nonCrawledPages={metrics?.nonCrawledPages || []}
              mappingId={selectedMapping?.id}
              domain={selectedMapping?.domain}
              isLoading={isMetricsLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIAnalyticsPage() {
  return (
    <FeatureGate featureSlug="ai-visibility">
      <AIAnalyticsContent />
    </FeatureGate>
  )
}
