import { useQuery } from '@tanstack/react-query'
import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react'
import { apiService } from '@/services/api'

export default function AdminApiHealthWidget() {
  // Fetch API health metrics with 60s refetch interval
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['admin-api-health'],
    queryFn: () => apiService.getApiHealthMetrics(),
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: false,
  })

  const metrics = healthData?.data

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Unable to load API health metrics</p>
      </div>
    )
  }

  // Determine status color and icon
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5" />
      case 'down':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const { current, last24Hours } = metrics

  return (
    <div className="space-y-6">
      {/* Current Status Banner */}
      <div className={`rounded-lg border p-4 flex items-center justify-between ${getStatusColor(current.status)}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon(current.status)}
          <div>
            <h3 className="font-semibold text-lg">
              AI API Status: {current.status.charAt(0).toUpperCase() + current.status.slice(1)}
            </h3>
            <p className="text-sm opacity-80">
              {current.errorRate === 0
                ? 'All systems operational'
                : `${current.errorRate} error${current.errorRate !== 1 ? 's' : ''} in last hour`
              }
            </p>
          </div>
        </div>
        {current.avgResponseTime > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {(current.avgResponseTime / 1000).toFixed(1)}s avg
            </span>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Success Rate */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className={`text-2xl font-bold ${
              last24Hours.successRate >= 95 ? 'text-green-600' :
              last24Hours.successRate >= 85 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {last24Hours.successRate}%
            </span>
          </div>
          <p className="text-sm font-medium">Success Rate</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last 24 hours
          </p>
        </div>

        {/* 529 Errors */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className={`text-2xl font-bold ${
              last24Hours.total529Errors === 0 ? 'text-green-600' :
              last24Hours.total529Errors < 5 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {last24Hours.total529Errors}
            </span>
          </div>
          <p className="text-sm font-medium">529 Overload Errors</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last 24 hours
          </p>
        </div>

        {/* Total Requests */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">
              {last24Hours.totalRequests}
            </span>
          </div>
          <p className="text-sm font-medium">Total Requests</p>
          <p className="text-xs text-muted-foreground mt-1">
            {last24Hours.successfulRequests} successful, {last24Hours.failedRequests} failed
          </p>
        </div>

        {/* Users Affected */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className={`text-2xl font-bold ${
              last24Hours.usersAffected === 0 ? 'text-green-600' :
              last24Hours.usersAffected < 5 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {last24Hours.usersAffected}
            </span>
          </div>
          <p className="text-sm font-medium">Users Affected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last 24 hours
          </p>
        </div>
      </div>

      {/* Error Breakdown */}
      {last24Hours.totalApiErrors > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">Error Breakdown (Last 24h)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">529 Overload</span>
              <span className="text-lg font-semibold text-red-600">
                {last24Hours.errorBreakdown.error529}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">429 Rate Limit</span>
              <span className="text-lg font-semibold text-yellow-600">
                {last24Hours.errorBreakdown.error429}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">500 Server Error</span>
              <span className="text-lg font-semibold text-orange-600">
                {last24Hours.errorBreakdown.error500}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Other</span>
              <span className="text-lg font-semibold">
                {last24Hours.errorBreakdown.other}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Trend Mini Chart */}
      {metrics.trends.hourly.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">529 Errors - Last 24 Hours</h4>
          <div className="flex items-end gap-1 h-24">
            {metrics.trends.hourly.map((hour, i) => {
              const maxErrors = Math.max(...metrics.trends.hourly.map(h => h.errors529), 1)
              const height = hour.errors529 > 0 ? (hour.errors529 / maxErrors) * 100 : 2

              return (
                <div
                  key={i}
                  className="flex-1 group relative"
                  title={`${new Date(hour.hour).toLocaleTimeString([], { hour: '2-digit' })}: ${hour.errors529} error${hour.errors529 !== 1 ? 's' : ''}`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      hour.errors529 === 0 ? 'bg-green-200' :
                      hour.errors529 < 3 ? 'bg-yellow-400' :
                      'bg-red-500'
                    } group-hover:opacity-75`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>
      )}
    </div>
  )
}
