import { useQuery } from '@tanstack/react-query'
import { Star, TrendingUp, TrendingDown, Minus, FileCheck, RefreshCw, Layers } from 'lucide-react'
import { apiService } from '@/services/api'
import { useState } from 'react'
import MetricBarChart from './charts/MetricBarChart'

interface SchemaQualityMetrics {
  averageQualityScore: number
  refinementRate: number
  averageComplexity: number
  successRate: number
  totalSchemas: number
  qualityTrend: 'improving' | 'stable' | 'declining'
  schemasByType: Array<{ type: string; count: number; avgScore: number }>
}

export default function AdminSchemaQuality() {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-schema-quality', period],
    queryFn: () => apiService.getSchemaQualityAnalytics(period),
    refetchInterval: 60000, // Refetch every minute
  })

  const metrics = data?.data as SchemaQualityMetrics | undefined

  // Get trend indicator
  const getTrendIndicator = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-green-500',
          bg: 'bg-green-100',
          text: 'Improving',
        }
      case 'declining':
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          color: 'text-red-500',
          bg: 'bg-red-100',
          text: 'Declining',
        }
      default:
        return {
          icon: <Minus className="h-4 w-4" />,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          text: 'Stable',
        }
    }
  }

  // Get quality rating
  const getQualityRating = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' }
    if (score >= 75) return { label: 'Good', color: 'text-blue-600' }
    if (score >= 60) return { label: 'Fair', color: 'text-yellow-600' }
    return { label: 'Needs Work', color: 'text-red-600' }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
        <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">No quality metrics available</p>
      </div>
    )
  }

  const trendInfo = getTrendIndicator(metrics.qualityTrend)
  const qualityRating = getQualityRating(metrics.averageQualityScore)

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Schema Quality Metrics</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === '7d'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === '30d'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Average Quality Score */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${trendInfo.bg} ${trendInfo.color}`}>
              <div className="flex items-center gap-1">
                {trendInfo.icon}
                <span>{trendInfo.text}</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.averageQualityScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground mt-1">Avg Quality Score</div>
            <div className={`text-xs font-medium mt-2 ${qualityRating.color}`}>
              {qualityRating.label}
            </div>
          </div>
        </div>

        {/* Refinement Rate */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.refinementRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Refinement Rate</div>
            <div className="text-xs text-muted-foreground mt-2">
              Schemas with refinements
            </div>
          </div>
        </div>

        {/* Average Complexity */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Layers className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.averageComplexity.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground mt-1">Avg Complexity</div>
            <div className="text-xs text-muted-foreground mt-2">
              Properties per schema
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <FileCheck className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
            <div className="text-xs text-muted-foreground mt-2">
              {metrics.totalSchemas} total schemas
            </div>
          </div>
        </div>
      </div>

      {/* Schema Types Chart */}
      {metrics.schemasByType.length > 0 && (
        <div className="border border-border rounded-lg bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Quality by Schema Type</h3>
          <MetricBarChart
            data={metrics.schemasByType.map(item => ({
              name: item.type || 'Unknown',
              value: item.avgScore,
              count: item.count,
            }))}
            dataKey="value"
            xAxisKey="name"
            height={300}
            color="hsl(var(--primary))"
            showGrid={true}
            yAxisLabel="Avg Score"
            formatValue={(value) => value.toFixed(1)}
          />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.schemasByType.slice(0, 8).map((item, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium truncate" title={item.type || 'Unknown'}>
                  {item.type || 'Unknown'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.count} schemas · Score: {item.avgScore.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Quality Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {metrics.averageQualityScore >= 75 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Overall Quality</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.averageQualityScore >= 75
                    ? 'Schemas are consistently high quality'
                    : 'Room for improvement in schema quality'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="mt-1">
                {metrics.refinementRate < 30 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Refinement Rate</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.refinementRate < 30
                    ? 'Most schemas are accepted on first try'
                    : 'Users frequently refine schemas - consider improving initial generation'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {metrics.qualityTrend === 'improving' ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : metrics.qualityTrend === 'declining' ? (
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Quality Trend</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.qualityTrend === 'improving'
                    ? 'Quality is improving over time'
                    : metrics.qualityTrend === 'declining'
                    ? 'Quality is declining - investigate recent changes'
                    : 'Quality remains stable'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="mt-1">
                {metrics.averageComplexity >= 5 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Schema Complexity</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.averageComplexity >= 5
                    ? 'Schemas are comprehensive with good property coverage'
                    : 'Schemas may be too simple - consider adding more properties'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
