import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CreditCard, X, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiService } from '@/services/api'

interface LowCreditWarningProps {
  threshold?: number
  onDismiss?: () => void
}

export default function LowCreditWarning({ threshold = 5, onDismiss }: LowCreditWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // Get user credits
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    refetchInterval: 30000
  })

  // Get payment history to determine if user has ever purchased
  const { data: paymentHistory } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => apiService.getPaymentHistory(1, 1), // Only need to know if ANY purchases exist
  })

  const creditBalance = creditsData?.data?.creditBalance || 0
  const hasPurchasedBefore = (paymentHistory?.data?.data?.length ?? 0) > 0

  // Determine if this is a new user (never purchased, has 2 or fewer credits)
  useEffect(() => {
    setIsNewUser(!hasPurchasedBefore && creditBalance <= 2)
  }, [hasPurchasedBefore, creditBalance])

  // Check localStorage for dismiss state
  useEffect(() => {
    const dismissKey = isNewUser ? 'new-user-welcome-dismissed' : 'low-credit-warning-dismissed'
    const dismissed = localStorage.getItem(dismissKey)

    // For low credit warning, only use localStorage if dismissed in this session
    // (will re-appear next session)
    if (!isNewUser && dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const now = Date.now()
      // Show again if more than 1 hour has passed or in new session
      if (now - dismissedTime < 3600000) { // 1 hour
        setIsDismissed(true)
      }
    } else if (isNewUser && dismissed === 'true') {
      // New user welcome stays dismissed permanently
      setIsDismissed(true)
    }
  }, [isNewUser])

  const handleDismiss = () => {
    setIsDismissed(true)
    const dismissKey = isNewUser ? 'new-user-welcome-dismissed' : 'low-credit-warning-dismissed'

    if (isNewUser) {
      // Permanent dismiss for new users
      localStorage.setItem(dismissKey, 'true')
    } else {
      // Temporary dismiss with timestamp for existing users
      localStorage.setItem(dismissKey, Date.now().toString())
    }

    onDismiss?.()
  }

  // Don't show if dismissed or above threshold
  if (isDismissed || creditBalance >= threshold) {
    return null
  }

  // Don't show if we have enough credits
  if (creditBalance >= threshold) {
    return null
  }

  // Show different message for new users vs existing users
  if (isNewUser) {
    // Welcoming message for new users with free credits
    return (
      <div className="bg-info border border-info rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-5 w-5 text-info-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-info-foreground">
                Welcome! You've Got {creditBalance} Free Credit{creditBalance !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-info-foreground mt-1">
                Jump in and generate your first schema—no credit card required. See why life's too short for manual schema markup. When you're ready for more, credit packs are super affordable and super simple to grab.
              </p>
              <div className="mt-3 flex space-x-3">
                <Link
                  to="/dashboard/credits?purchase=true"
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  View Credit Packs
                </Link>
                <button
                  onClick={handleDismiss}
                  className="text-sm text-info-foreground hover:text-info-foreground/80 underline"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-info/90 rounded-md transition-colors"
          >
            <X className="h-4 w-4 text-info-foreground" />
          </button>
        </div>
      </div>
    )
  }

  // Warning message for existing users with low credits
  return (
    <div className="bg-warning border border-warning rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-warning-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-warning-foreground">
              {creditBalance === 0 ? 'No Credits Remaining' : 'Low Credit Balance'}
            </h3>
            <p className="text-sm text-warning-foreground mt-1">
              {creditBalance === 0 ? (
                'You have used all your credits. Purchase more to continue generating schemas.'
              ) : (
                `You have ${creditBalance} credit${creditBalance !== 1 ? 's' : ''} remaining.
                Consider purchasing more to avoid interruption.`
              )}
            </p>
            <div className="mt-3 flex space-x-3">
              <Link
                to="/dashboard/credits"
                className="inline-flex items-center px-3 py-1.5 text-sm bg-warning-foreground text-warning rounded-md hover:bg-warning-foreground/90 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Buy Credits
              </Link>
              <button
                onClick={handleDismiss}
                className="text-sm text-warning-foreground hover:text-warning-foreground/80 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-warning/90 rounded-md transition-colors"
        >
          <X className="h-4 w-4 text-warning-foreground" />
        </button>
      </div>
    </div>
  )
}