import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CreditCard, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiService } from '@/services/api'

interface LowCreditWarningProps {
  threshold?: number
  onDismiss?: () => void
}

export default function LowCreditWarning({ threshold = 5, onDismiss }: LowCreditWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Get user credits
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    refetchInterval: 30000
  })

  const creditBalance = creditsData?.data?.creditBalance || 0

  const handleDismiss = () => {
    setIsDismissed(true)
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

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800">
              {creditBalance === 0 ? 'No Credits Remaining' : 'Low Credit Balance'}
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
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
                className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Buy Credits
              </Link>
              <button
                onClick={handleDismiss}
                className="text-sm text-yellow-700 hover:text-yellow-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-yellow-100 rounded-md transition-colors"
        >
          <X className="h-4 w-4 text-yellow-600" />
        </button>
      </div>
    </div>
  )
}