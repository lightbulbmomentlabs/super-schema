import { useQuery } from '@tanstack/react-query'
import { DollarSign, ShoppingCart, Users, Clock, Activity, ChevronDown, Download, FileCheck, TrendingUp } from 'lucide-react'
import { apiService } from '@/services/api'
import { useState, useRef, useEffect } from 'react'

interface PurchaseTransaction {
  purchaseId: string
  userEmail: string
  userName: string
  creditPackName: string
  credits: number
  amountPaid: number
  purchaseDate: string
  userLTV: number
  daysToFirstPurchase: number
}

interface PurchaseAnalytics {
  purchaseTransactions: PurchaseTransaction[]
  recentPurchasers: PurchaseTransaction[]
  metrics: {
    totalPayingCustomers: number
    totalPurchases: number
    totalRevenue: number
    arppu: number
    repeatPurchaseRate: number
    repeatCustomers: number
    avgTimeToFirstPurchase: number
    avgCreditUtilization: number
  }
  creditUtilization: Array<{
    userId: string
    creditsPurchased: number
    creditsUsed: number
    utilizationRate: number
  }>
}

export default function AdminPurchaseAnalytics() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-purchase-analytics'],
    queryFn: () => apiService.getPurchaseAnalytics(),
    refetchInterval: 60000, // Refetch every minute
  })

  const analytics = data?.data as PurchaseAnalytics | undefined

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Export functions
  const exportAsMarkdown = () => {
    if (!analytics) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)

    const recentPurchasersTable = analytics.recentPurchasers
      .map((p, i) => `${i + 1}. ${p.userEmail} - ${p.creditPackName} - ${formatCurrency(p.amountPaid)} (LTV: ${formatCurrency(p.userLTV)})`)
      .join('\n')

    const content = `# Purchase Analytics
Generated: ${new Date().toISOString()}

## Summary Metrics
- Total Paying Customers: ${analytics.metrics.totalPayingCustomers}
- Total Purchases: ${analytics.metrics.totalPurchases}
- Total Revenue: ${formatCurrency(analytics.metrics.totalRevenue)}
- ARPPU (Average Revenue Per Paying User): ${formatCurrency(analytics.metrics.arppu)}
- Repeat Purchase Rate: ${analytics.metrics.repeatPurchaseRate.toFixed(1)}%
- Repeat Customers: ${analytics.metrics.repeatCustomers}
- Avg Time to First Purchase: ${analytics.metrics.avgTimeToFirstPurchase.toFixed(1)} days
- Avg Credit Utilization: ${analytics.metrics.avgCreditUtilization.toFixed(1)}%

## Recent Purchasers (Last ${analytics.recentPurchasers.length})
${recentPurchasersTable}

## All Purchases (${analytics.purchaseTransactions.length} total)
${analytics.purchaseTransactions.map((p, i) => {
  return `${i + 1}. ${p.userEmail} - ${p.creditPackName} (${p.credits} credits) - ${formatCurrency(p.amountPaid)} - ${formatDate(p.purchaseDate)}
   - User LTV: ${formatCurrency(p.userLTV)}
   - Days to First Purchase: ${p.daysToFirstPurchase} days`
}).join('\n\n')}

## Analysis Context
This data represents all purchase transactions and customer lifetime value for AI analysis.
Key insights:
1. Repeat Purchase Rate: ${analytics.metrics.repeatPurchaseRate.toFixed(1)}% of customers make multiple purchases
2. Average Time to First Purchase: ${analytics.metrics.avgTimeToFirstPurchase.toFixed(1)} days from signup
3. Credit Utilization: Customers use ${analytics.metrics.avgCreditUtilization.toFixed(1)}% of purchased credits on average
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase-analytics-${timestamp}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowDropdown(false)
  }

  const exportAsJSON = () => {
    if (!analytics) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const exportData = {
      exportedAt: new Date().toISOString(),
      analytics
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase-analytics-${timestamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowDropdown(false)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">No purchase analytics available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-bold">Purchase Analytics</h2>
        </div>

        {/* Download Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={!analytics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showDropdown && analytics && (
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{formatCurrency(analytics.metrics.totalRevenue)}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Revenue</div>
            <div className="text-xs text-muted-foreground mt-2">
              {analytics.metrics.totalPurchases} purchases
            </div>
          </div>
        </div>

        {/* ARPPU */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{formatCurrency(analytics.metrics.arppu)}</div>
            <div className="text-sm text-muted-foreground mt-1">ARPPU</div>
            <div className="text-xs text-muted-foreground mt-2">
              Avg revenue per user
            </div>
          </div>
        </div>

        {/* Repeat Purchase Rate */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{analytics.metrics.repeatPurchaseRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Repeat Purchase Rate</div>
            <div className="text-xs text-muted-foreground mt-2">
              {analytics.metrics.repeatCustomers} repeat customers
            </div>
          </div>
        </div>

        {/* Avg Time to First Purchase */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{analytics.metrics.avgTimeToFirstPurchase.toFixed(1)}d</div>
            <div className="text-sm text-muted-foreground mt-1">Time to First Purchase</div>
            <div className="text-xs text-muted-foreground mt-2">
              Average across all users
            </div>
          </div>
        </div>

        {/* Credit Utilization */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-pink-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{analytics.metrics.avgCreditUtilization.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Credit Utilization</div>
            <div className="text-xs text-muted-foreground mt-2">
              Avg credits used
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchasers */}
      <div className="border border-border rounded-lg bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Purchasers (Last {analytics.recentPurchasers.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Credit Pack</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">LTV</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Days to Purchase</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">When</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentPurchasers.map((purchase) => (
                <tr key={purchase.purchaseId} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium text-sm">{purchase.userName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{purchase.userEmail}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <div className="text-sm">{purchase.creditPackName}</div>
                      <div className="text-xs text-muted-foreground">{purchase.credits} credits</div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-medium text-sm">{formatCurrency(purchase.amountPaid)}</div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-medium text-sm text-green-600">{formatCurrency(purchase.userLTV)}</div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="text-sm">{purchase.daysToFirstPurchase}d</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-muted-foreground">{formatDate(purchase.purchaseDate)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Purchase Transactions */}
      <div className="border border-border rounded-lg bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">All Purchase Transactions ({analytics.purchaseTransactions.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Credit Pack</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">LTV</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Days to Purchase</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.purchaseTransactions.map((purchase) => (
                <tr key={purchase.purchaseId} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium text-sm">{purchase.userName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{purchase.userEmail}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <div className="text-sm">{purchase.creditPackName}</div>
                      <div className="text-xs text-muted-foreground">{purchase.credits} credits</div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-medium text-sm">{formatCurrency(purchase.amountPaid)}</div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-medium text-sm text-green-600">{formatCurrency(purchase.userLTV)}</div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="text-sm">{purchase.daysToFirstPurchase}d</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-muted-foreground">{formatDate(purchase.purchaseDate)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Purchase Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {analytics.metrics.repeatPurchaseRate >= 20 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Repeat Purchase Rate</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.metrics.repeatPurchaseRate >= 20
                    ? 'Excellent customer retention - strong product-market fit'
                    : 'Opportunity to improve customer retention with follow-up offers'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="mt-1">
                {analytics.metrics.avgTimeToFirstPurchase <= 7 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Time to First Purchase</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.metrics.avgTimeToFirstPurchase <= 7
                    ? 'Users convert quickly - effective onboarding and value proposition'
                    : 'Consider adding urgency or limited-time offers to accelerate conversion'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                {analytics.metrics.avgCreditUtilization >= 70 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">Credit Utilization</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.metrics.avgCreditUtilization >= 70
                    ? 'High engagement - customers actively using purchased credits'
                    : 'Low utilization - consider improving product engagement or credit pack sizing'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="mt-1">
                {analytics.metrics.arppu >= 30 ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium">ARPPU</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.metrics.arppu >= 30
                    ? 'Strong average revenue per user - effective pricing strategy'
                    : 'Opportunity to increase average order value with larger pack promotions'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
