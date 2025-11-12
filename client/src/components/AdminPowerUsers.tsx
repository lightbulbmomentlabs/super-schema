import { useQuery } from '@tanstack/react-query'
import { Crown, TrendingUp, TrendingDown, Minus, DollarSign, FileText, Calendar } from 'lucide-react'
import { apiService } from '@/services/api'
import { useState } from 'react'

interface PowerUser {
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  powerScore: number
  activeDays: number
  totalLogins: number
  schemasGenerated: number
  revenueInCents: number
  lastActiveAt: string
  trend: 'up' | 'stable' | 'down'
}

export default function AdminPowerUsers() {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-power-users', period],
    queryFn: () => apiService.getPowerUsersAnalytics(period),
    refetchInterval: 60000, // Refetch every minute
  })

  const powerUsers = data?.data?.users as PowerUser[] | undefined

  // Get trend icon and color
  const getTrendIndicator = (trend: 'up' | 'stable' | 'down') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded"></div>
        ))}
      </div>
    )
  }

  if (!powerUsers || powerUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">No power users found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Users with engagement scores above 20 will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Power Users</h2>
          <span className="text-sm text-muted-foreground">
            ({powerUsers.length} users)
          </span>
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

      {/* Power Users Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                <th className="text-center py-3 px-4 font-semibold text-sm">Power Score</th>
                <th className="text-center py-3 px-4 font-semibold text-sm">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Active Days</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-sm">
                  <div className="flex items-center justify-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Schemas</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-sm">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Revenue</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-sm">Last Active</th>
                <th className="text-center py-3 px-4 font-semibold text-sm">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {powerUsers.map((user, index) => (
                <tr key={user.userId} className="hover:bg-muted/30 transition-colors">
                  {/* Rank */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {index < 3 ? (
                        <Crown className={`h-5 w-5 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-amber-700'
                        }`} />
                      ) : (
                        <span className="text-muted-foreground font-medium">#{index + 1}</span>
                      )}
                    </div>
                  </td>

                  {/* User */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </td>

                  {/* Power Score */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
                      <span className="font-bold text-lg">{user.powerScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </td>

                  {/* Active Days */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{user.activeDays}</span>
                      <span className="text-xs text-muted-foreground">
                        ({user.totalLogins} logins)
                      </span>
                    </div>
                  </td>

                  {/* Schemas */}
                  <td className="py-3 px-4 text-center font-semibold">
                    {user.schemasGenerated}
                  </td>

                  {/* Revenue */}
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${
                      user.revenueInCents > 0 ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(user.revenueInCents)}
                    </span>
                  </td>

                  {/* Last Active */}
                  <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                    {formatDate(user.lastActiveAt)}
                  </td>

                  {/* Trend */}
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      {getTrendIndicator(user.trend)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-semibold mb-3 text-sm">Power Score Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Login Frequency (40%)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Active days / total days in period
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Schema Volume (40%)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Schemas generated (normalized ~2/week)
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Revenue (20%)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total revenue contribution (max $100)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
