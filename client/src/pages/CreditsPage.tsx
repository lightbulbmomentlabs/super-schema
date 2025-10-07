import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useSearchParams } from 'react-router-dom'
import {
  CreditCard,
  Plus,
  History,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import CreditPurchase from '@/components/CreditPurchase'
import { apiService } from '@/services/api'
import { cn } from '@/utils/cn'

export default function CreditsPage() {
  const { user } = useUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPurchase, setShowPurchase] = useState(false)

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Credits'
  }, [])

  // Check URL parameter to auto-show purchase page
  useEffect(() => {
    if (searchParams.get('purchase') === 'true') {
      setShowPurchase(true)
      // Remove the parameter from URL after reading it
      searchParams.delete('purchase')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Get user credits
  const { data: creditsData, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    refetchInterval: 30000
  })

  // Get user stats
  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiService.getUserStats()
  })

  // Get credit transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['credit-transactions'],
    queryFn: () => apiService.getCreditTransactions(1, 10)
  })

  // Get payment history
  const { data: paymentHistoryData } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => apiService.getPaymentHistory(1, 10)
  })

  const creditBalance = creditsData?.data?.creditBalance || 0
  const totalCreditsUsed = creditsData?.data?.totalCreditsUsed || 0
  const stats = statsData?.data || {}
  const transactions = transactionsData?.data?.data || []
  const paymentHistory = paymentHistoryData?.data?.data || []

  const handlePurchaseSuccess = () => {
    setShowPurchase(false)
    refetchCredits()
    // Refetch other queries
    window.location.reload()
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'usage':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'bonus':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (showPurchase) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Purchase Credits</h1>
        </div>
        <CreditPurchase
          onSuccess={handlePurchaseSuccess}
          onCancel={() => setShowPurchase(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits & Billing</h1>
          <p className="text-muted-foreground">
            Manage your credits and view your usage history
          </p>
        </div>
        <button
          onClick={() => setShowPurchase(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Buy Credits
        </button>
      </div>

      {/* Credit Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold">{creditBalance}</p>
            </div>
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
              <p className="text-3xl font-bold">{totalCreditsUsed}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Schemas Generated</p>
              <p className="text-3xl font-bold">{stats.total_schemas_generated || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-3xl font-bold">
                ${((stats.total_spent_cents || 0) / 100).toFixed(0)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Low Credits Warning */}
      {creditBalance < 5 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">Low Credit Balance</h3>
                <p className="text-sm text-yellow-700">
                  You have {creditBalance} credit{creditBalance !== 1 ? 's' : ''} remaining.
                  Purchase more to continue generating schemas.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPurchase(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Buy Credits
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <History className="h-5 w-5 text-muted-foreground" />
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-border rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-medium text-sm',
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No transactions yet
            </p>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>

          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border border-border rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {getPaymentStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {payment.credits} credits
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      ${(payment.amountInCents / 100).toFixed(2)}
                    </p>
                    <p className={cn(
                      'text-xs capitalize',
                      payment.status === 'succeeded' ? 'text-green-600' :
                      payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    )}>
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No payments yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}