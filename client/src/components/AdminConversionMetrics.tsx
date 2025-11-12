import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, TrendingDown, UserPlus, FileText, ShoppingCart, ChevronDown, Download, FileCheck } from 'lucide-react'
import { apiService } from '@/services/api'
import { useState, useRef, useEffect } from 'react'

interface ConversionMetrics {
  conversionRate: number
  totalSignups: number
  totalConversions: number
  averageTimeToConversion: number
  conversionFunnel: {
    signups: number
    firstSchema: number
    firstPurchase: number
    dropoffAfterSignup: number
    dropoffAfterFirstSchema: number
  }
  recentTrend: {
    last7Days: number
    last30Days: number
    trendDirection: 'up' | 'stable' | 'down'
  }
}

export default function AdminConversionMetrics() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-conversion-metrics'],
    queryFn: () => apiService.getConversionAnalytics(),
    refetchInterval: 60000, // Refetch every minute
  })

  const metrics = data?.data as ConversionMetrics | undefined

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Export functions
  const exportAsMarkdown = () => {
    if (!metrics) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const signupToSchema = metrics.conversionFunnel.signups > 0
      ? (metrics.conversionFunnel.firstSchema / metrics.conversionFunnel.signups) * 100
      : 0
    const schemaToPurchase = metrics.conversionFunnel.firstSchema > 0
      ? (metrics.conversionFunnel.firstPurchase / metrics.conversionFunnel.firstSchema) * 100
      : 0
    const overallConversion = metrics.conversionFunnel.signups > 0
      ? (metrics.conversionFunnel.firstPurchase / metrics.conversionFunnel.signups) * 100
      : 0

    const content = `# Revenue & Conversion Metrics
Generated: ${new Date().toISOString()}

## Summary Metrics
- Overall Conversion Rate: ${metrics.conversionRate.toFixed(1)}%
- Total Signups: ${metrics.totalSignups}
- Total Conversions: ${metrics.totalConversions}
- Average Time to Convert: ${metrics.averageTimeToConversion.toFixed(0)} days
- Conversion Trend: ${metrics.recentTrend.trendDirection}

## Recent Trends
- Last 7 Days: ${metrics.recentTrend.last7Days.toFixed(1)}%
- Last 30 Days: ${metrics.recentTrend.last30Days.toFixed(1)}%

## Conversion Funnel
### Stage 1: User Signups
- Count: ${metrics.conversionFunnel.signups}
- Percentage: 100%

### Stage 2: First Schema Generated
- Count: ${metrics.conversionFunnel.firstSchema}
- Conversion from Signups: ${signupToSchema.toFixed(1)}%
- Drop-off: ${metrics.conversionFunnel.dropoffAfterSignup} users (${((metrics.conversionFunnel.dropoffAfterSignup / metrics.conversionFunnel.signups) * 100).toFixed(1)}%)

### Stage 3: First Purchase
- Count: ${metrics.conversionFunnel.firstPurchase}
- Conversion from First Schema: ${schemaToPurchase.toFixed(1)}%
- Overall Conversion from Signup: ${overallConversion.toFixed(1)}%
- Drop-off after First Schema: ${metrics.conversionFunnel.dropoffAfterFirstSchema} users (${((metrics.conversionFunnel.dropoffAfterFirstSchema / metrics.conversionFunnel.firstSchema) * 100).toFixed(1)}%)

## Analysis Context
This data represents the complete user conversion funnel for AI analysis.
Key conversion points:
1. Signup → First Schema: Activation metric (users trying the product)
2. First Schema → First Purchase: Monetization metric (free to paid conversion)
3. Overall: Complete funnel efficiency
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversion-metrics-${timestamp}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowDropdown(false)
  }

  const exportAsJSON = () => {
    if (!metrics) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const exportData = {
      exportedAt: new Date().toISOString(),
      metrics
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversion-metrics-${timestamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowDropdown(false)
  }

  // Get trend indicator
  const getTrendIndicator = (trend: 'up' | 'stable' | 'down') => {
    switch (trend) {
      case 'up':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-green-500',
          bg: 'bg-green-100',
          text: 'Increasing',
        }
      case 'down':
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          color: 'text-red-500',
          bg: 'bg-red-100',
          text: 'Decreasing',
        }
      default:
        return {
          icon: <TrendingDown className="h-4 w-4 rotate-90" />,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          text: 'Stable',
        }
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">No conversion metrics available</p>
      </div>
    )
  }

  const trendInfo = getTrendIndicator(metrics.recentTrend.trendDirection)

  // Calculate conversion percentages for funnel
  const signupToSchema = metrics.conversionFunnel.signups > 0
    ? (metrics.conversionFunnel.firstSchema / metrics.conversionFunnel.signups) * 100
    : 0

  const schemaToPurchase = metrics.conversionFunnel.firstSchema > 0
    ? (metrics.conversionFunnel.firstPurchase / metrics.conversionFunnel.firstSchema) * 100
    : 0

  const overallConversion = metrics.conversionFunnel.signups > 0
    ? (metrics.conversionFunnel.firstPurchase / metrics.conversionFunnel.signups) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-bold">Conversion Metrics</h2>
        </div>

        {/* Download Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={!metrics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showDropdown && metrics && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-10">
              <button
                onClick={exportAsMarkdown}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors rounded-t-lg flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                Download as Markdown
              </button>
              <button
                onClick={exportAsJSON}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors rounded-b-lg flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                Download as JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Conversion Rate */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${trendInfo.bg} ${trendInfo.color}`}>
              <div className="flex items-center gap-1">
                {trendInfo.icon}
                <span>{trendInfo.text}</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Overall Conversion</div>
            <div className="text-xs text-muted-foreground mt-2">
              {metrics.totalConversions} / {metrics.totalSignups} signups
            </div>
          </div>
        </div>

        {/* 7-Day Trend */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.recentTrend.last7Days.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Last 7 Days</div>
            <div className="text-xs text-muted-foreground mt-2">
              Recent conversion rate
            </div>
          </div>
        </div>

        {/* 30-Day Trend */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.recentTrend.last30Days.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Last 30 Days</div>
            <div className="text-xs text-muted-foreground mt-2">
              Monthly conversion rate
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel Visualization */}
      <div className="border border-border rounded-lg bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Conversion Funnel</h3>

        <div className="space-y-6">
          {/* Stage 1: Signups */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">User Signups</div>
                  <div className="text-xs text-muted-foreground">New account creations</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{metrics.conversionFunnel.signups}</div>
                <div className="text-xs text-muted-foreground">100%</div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Dropoff 1 */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-red-50 px-4 py-2 rounded-lg">
              <ChevronDown className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-600">
                {metrics.conversionFunnel.dropoffAfterSignup} dropped off
              </span>
              <span>({((metrics.conversionFunnel.dropoffAfterSignup / metrics.conversionFunnel.signups) * 100).toFixed(1)}%)</span>
            </div>
          </div>

          {/* Stage 2: First Schema */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">First Schema Generated</div>
                  <div className="text-xs text-muted-foreground">Users who created a schema</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{metrics.conversionFunnel.firstSchema}</div>
                <div className="text-xs text-muted-foreground">{signupToSchema.toFixed(1)}%</div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className="bg-purple-500 h-4 rounded-full transition-all"
                style={{ width: `${signupToSchema}%` }}
              ></div>
            </div>
          </div>

          {/* Dropoff 2 */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-red-50 px-4 py-2 rounded-lg">
              <ChevronDown className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-600">
                {metrics.conversionFunnel.dropoffAfterFirstSchema} dropped off
              </span>
              <span>({((metrics.conversionFunnel.dropoffAfterFirstSchema / metrics.conversionFunnel.firstSchema) * 100).toFixed(1)}%)</span>
            </div>
          </div>

          {/* Stage 3: First Purchase */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">First Purchase</div>
                  <div className="text-xs text-muted-foreground">Converted to paying customers</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{metrics.conversionFunnel.firstPurchase}</div>
                <div className="text-xs text-muted-foreground">{overallConversion.toFixed(1)}%</div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${overallConversion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Funnel Stats Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Signup → Schema</div>
            <div className="text-2xl font-bold text-purple-600">{signupToSchema.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Schema → Purchase</div>
            <div className="text-2xl font-bold text-green-600">{schemaToPurchase.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Overall Conversion</div>
            <div className="text-2xl font-bold text-blue-600">{overallConversion.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Avg Time to Convert</div>
            <div className="text-2xl font-bold">{metrics.averageTimeToConversion.toFixed(0)}d</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Conversion Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {signupToSchema >= 60 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Signup to First Schema</div>
                <div className="text-xs text-muted-foreground">
                  {signupToSchema >= 60
                    ? 'Good activation rate - most users try the product'
                    : 'High drop-off after signup - improve onboarding flow'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="mt-1">
                {schemaToPurchase >= 10 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Schema to Purchase</div>
                <div className="text-xs text-muted-foreground">
                  {schemaToPurchase >= 10
                    ? 'Solid conversion from free to paid'
                    : 'Opportunity to improve paid conversion rate'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {metrics.recentTrend.trendDirection === 'up' ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : metrics.recentTrend.trendDirection === 'down' ? (
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Conversion Trend</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.recentTrend.trendDirection === 'up'
                    ? 'Conversion rate is improving - keep it up!'
                    : metrics.recentTrend.trendDirection === 'down'
                    ? 'Conversion declining - investigate recent changes'
                    : 'Conversion rate remains steady'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="mt-1">
                {metrics.averageTimeToConversion <= 7 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Time to Convert</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.averageTimeToConversion <= 7
                    ? 'Users convert quickly after trying the product'
                    : 'Consider adding urgency or time-limited offers'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
