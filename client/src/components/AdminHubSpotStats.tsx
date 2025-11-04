import { useQuery } from '@tanstack/react-query'
import { Globe, Activity, Users, AlertCircle } from 'lucide-react'
import { apiService } from '@/services/api'

export default function AdminHubSpotStats() {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['admin-hubspot-stats'],
    queryFn: () => apiService.getHubSpotStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const stats = statsData?.data

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading HubSpot stats...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load HubSpot stats
      </div>
    )
  }

  if (!stats) return null

  const regionLabels: Record<string, string> = {
    na1: 'North America',
    eu1: 'Europe',
    ap1: 'Asia Pacific'
  }

  const getTotalRegionalConnections = () => {
    return stats.connectionsByRegion.na1 + stats.connectionsByRegion.eu1 + stats.connectionsByRegion.ap1
  }

  const getRegionPercentage = (region: 'na1' | 'eu1' | 'ap1') => {
    const total = getTotalRegionalConnections()
    if (total === 0) return 0
    return Math.round((stats.connectionsByRegion[region] / total) * 100)
  }

  const syncFailureRate = stats.recentSyncs24h > 0
    ? Math.round((stats.recentSyncFailures24h / stats.recentSyncs24h) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Connections</p>
              <p className="text-2xl font-bold">{stats.totalConnections}</p>
            </div>
            <Globe className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeConnections}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Syncs (24h)</p>
              <p className="text-2xl font-bold">{stats.recentSyncs24h}</p>
            </div>
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sync Failures</p>
              <p className={`text-2xl font-bold ${stats.recentSyncFailures24h > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                {stats.recentSyncFailures24h}
              </p>
            </div>
            <AlertCircle className={`w-8 h-8 ${stats.recentSyncFailures24h > 0 ? 'text-destructive/50' : 'text-green-400'}`} />
          </div>
          {stats.recentSyncs24h > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {syncFailureRate}% failure rate
            </p>
          )}
        </div>
      </div>

      {/* Regional Distribution */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
        <div className="space-y-4">
          {(['na1', 'eu1', 'ap1'] as const).map((region) => {
            const count = stats.connectionsByRegion[region]
            const percentage = getRegionPercentage(region)

            return (
              <div key={region}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{regionLabels[region]}</span>
                    <span className="text-xs text-muted-foreground uppercase">({region})</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{count}</span>
                    <span className="text-muted-foreground ml-1">({percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      region === 'na1' ? 'bg-blue-500' :
                      region === 'eu1' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {getTotalRegionalConnections() === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No active HubSpot connections yet
          </p>
        )}
      </div>

      {/* Top Users */}
      {stats.topUsersByConnections.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Top Users by Connections</h3>
          </div>
          <div className="space-y-2">
            {stats.topUsersByConnections.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.userEmail}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.userId}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  {user.connectionCount} {user.connectionCount === 1 ? 'connection' : 'connections'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional API Health Notice */}
      {stats.connectionsByRegion.eu1 > 0 || stats.connectionsByRegion.ap1 > 0 ? (
        <div className="rounded-lg border border-success bg-success p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-success-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-success-foreground">✅ Regional API Support Active</h4>
              <p className="text-xs text-success-foreground mt-1">
                Your HubSpot integration is properly using regional API endpoints (EU1, AP1) for international users.
                This ensures optimal performance and compliance.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold">North America Only</h4>
              <p className="text-xs text-muted-foreground mt-1">
                All connections are using the NA1 region. EU1 and AP1 support is available for international users.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
