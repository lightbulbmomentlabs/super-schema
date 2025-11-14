import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Activity,
  Sparkles,
  TrendingUp,
  CreditCard,
  DollarSign,
  UserPlus,
  Zap,
  Target,
  TrendingDown,
  Crown,
  Star,
  ShoppingCart
} from 'lucide-react'
import { apiService } from '@/services/api'
import AdminApiHealthWidget from '@/components/AdminApiHealthWidget'
import AdminPowerUsers from '@/components/AdminPowerUsers'
import AdminSchemaQuality from '@/components/AdminSchemaQuality'
import AdminConversionMetrics from '@/components/AdminConversionMetrics'
import AdminPurchaseAnalytics from '@/components/AdminPurchaseAnalytics'

type Tab = 'overview' | 'power-users' | 'quality' | 'revenue' | 'purchases'

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Fetch platform stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: () => apiService.getPlatformStats(),
    retry: false
  })

  const stats = statsData?.data || {
    totalUsers: 0,
    activeUsers: 0,
    totalSchemas: 0,
    totalCreditsDistributed: 0,
    totalCreditsUsed: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    payingCustomers: 0,
    conversionRate: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    schemasToday: 0,
    schemasThisWeek: 0,
    averageCreditsPerUser: 0,
    creditPackBreakdown: []
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Get most popular credit pack
  const mostPopularPack = stats.creditPackBreakdown[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of platform usage, revenue, and performance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('power-users')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'power-users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span>Power Users</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'quality'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Schema Quality</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Revenue & Conversions</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'purchases'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Purchases</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI API Health Monitoring */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">AI API Health</h2>
            </div>
            <AdminApiHealthWidget />
          </div>

          {/* Revenue Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <p className="text-3xl font-bold text-success">{statsLoading ? '...' : formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : formatCurrency(stats.revenueThisMonth)}</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue in current month</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Paying Customers</p>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.payingCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">Users who purchased credits</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <Zap className="h-4 w-4 text-warning" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : formatPercent(stats.conversionRate)}</p>
                <p className="text-xs text-muted-foreground mt-1">% of users who paid</p>
              </div>
            </div>
          </div>

          {/* User Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalUsers}</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <Activity className="h-4 w-4 text-success" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">New This Week</p>
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.newUsersThisWeek}</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.newUsersThisMonth}</p>
              </div>
            </div>
          </div>

          {/* Usage Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Usage & Credits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Schemas</p>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalSchemas}</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <Sparkles className="h-4 w-4 text-success" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.schemasToday}</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.schemasThisWeek}</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalCreditsUsed}</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Avg / User</p>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{statsLoading ? '...' : stats.averageCreditsPerUser}</p>
                <p className="text-xs text-muted-foreground mt-1">Credits per user</p>
              </div>
            </div>
          </div>

          {/* Credit Pack Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Credit Pack Performance
            </h3>

            {mostPopularPack && (
              <div className="mb-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Most Popular Pack</p>
                    <p className="text-2xl font-bold">{mostPopularPack.packName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Purchases</p>
                    <p className="text-2xl font-bold text-primary">{mostPopularPack.purchases}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revenue: <span className="font-semibold text-foreground">{formatCurrency(mostPopularPack.revenue)}</span>
                </p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium">Pack Name</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Purchases</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Revenue</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          Loading credit pack data...
                        </td>
                      </tr>
                    ) : stats.creditPackBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No credit pack purchases yet
                        </td>
                      </tr>
                    ) : (
                      stats.creditPackBreakdown.map((pack, index) => {
                        const percentOfTotal = stats.totalRevenue > 0 ? (pack.revenue / stats.totalRevenue) * 100 : 0
                        return (
                          <tr key={pack.packId} className="border-b border-border hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                                    Top
                                  </span>
                                )}
                                <span className="font-medium">{pack.packName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{pack.purchases}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(pack.revenue)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${percentOfTotal}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground min-w-[3rem]">
                                  {formatPercent(percentOfTotal)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'power-users' && <AdminPowerUsers />}
      {activeTab === 'quality' && <AdminSchemaQuality />}
      {activeTab === 'revenue' && <AdminConversionMetrics />}
      {activeTab === 'purchases' && <AdminPurchaseAnalytics />}
    </div>
  )
}
