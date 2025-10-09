import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCard, Check, Star, Loader2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'
import { cn } from '@/utils/cn'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface CreditPack {
  id: string
  name: string
  credits: number
  priceInCents: number
  priceFormatted: string
  pricePerCredit: number
  savings?: number
  isPopular?: boolean
}

interface CreditPurchaseProps {
  onSuccess?: () => void
  onCancel?: () => void
}

function PaymentForm({
  selectedPack,
  onSuccess,
  onCancel
}: {
  selectedPack: CreditPack
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const createPaymentMutation = useMutation({
    mutationFn: (creditPackId: string) => apiService.createPaymentIntent(creditPackId),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create payment')
    }
  })

  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentIntentId: string) => apiService.confirmPayment(paymentIntentId),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to confirm payment')
    }
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe not loaded')
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const response = await createPaymentMutation.mutateAsync(selectedPack.id)

      if (!response.success || !response.data?.clientSecret) {
        throw new Error('Failed to create payment intent')
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        response.data?.clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (error) {
        toast.error(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend and allocate credits immediately
        try {
          const confirmResult = await confirmPaymentMutation.mutateAsync(paymentIntent.id)

          if (confirmResult.success) {
            // Invalidate queries to refresh user data
            queryClient.invalidateQueries({ queryKey: ['user-credits'] })
            queryClient.invalidateQueries({ queryKey: ['user-stats'] })
            queryClient.invalidateQueries({ queryKey: ['payment-history'] })

            toast.success(`Successfully purchased ${selectedPack.credits} credits!`)
            onSuccess?.()
          } else {
            toast.error(confirmResult.data?.message || 'Payment succeeded but failed to allocate credits. Please contact support.')
          }
        } catch (confirmError: any) {
          // Payment succeeded but confirmation failed - this is recoverable via webhook
          console.error('Confirmation error:', confirmError)
          toast.error('Payment succeeded! Your credits will be added shortly.')
          onSuccess?.()
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDarkMode ? '#f3f4f6' : '#111827', // Light text for dark mode, dark text for light mode
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/20 border border-border rounded-lg p-4">
        <h3 className="font-medium mb-2">Order Summary</h3>
        <div className="flex justify-between items-center">
          <span>{selectedPack.name}</span>
          <span className="font-medium">{selectedPack.priceFormatted}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {selectedPack.credits} credits • ${selectedPack.pricePerCredit.toFixed(2)} per credit
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium">
          Payment Information
        </label>
        <div className="border border-border rounded-md p-3 bg-background">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {selectedPack.priceFormatted}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function CreditPurchase({ onSuccess, onCancel }: CreditPurchaseProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)

  // Get credit packs
  const { data: creditPacksData, isLoading } = useQuery({
    queryKey: ['credit-packs'],
    queryFn: () => apiService.getCreditPacks()
  })

  const creditPacks = creditPacksData?.data || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    )
  }

  if (selectedPack) {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Complete Purchase</h2>
          <button
            onClick={() => setSelectedPack(null)}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm
            selectedPack={selectedPack}
            onSuccess={onSuccess}
            onCancel={() => setSelectedPack(null)}
          />
        </Elements>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Credit Pack</h2>
        <p className="text-muted-foreground">
          Purchase credits to generate more schema markup for your websites
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {creditPacks.map((pack: CreditPack) => (
          <div
            key={pack.id}
            className={cn(
              'relative border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg',
              pack.isPopular
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => setSelectedPack(pack)}
          >
            {pack.isPopular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </div>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{pack.name}</h3>
              <div className="text-3xl font-bold mb-1">{pack.priceFormatted}</div>
              <div className="text-sm text-muted-foreground mb-4">
                {pack.credits} credits
              </div>

              <div className="h-7 mb-4">
                {pack.savings ? (
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-success text-success-foreground text-xs font-medium">
                    Save {pack.savings}%
                  </div>
                ) : (
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    Standard Price
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center text-sm">
                  <Check className="h-4 w-4 text-success-foreground mr-2" />
                  ${pack.pricePerCredit.toFixed(2)} per credit
                </div>
                <div className="flex items-center justify-center text-sm">
                  <Check className="h-4 w-4 text-success-foreground mr-2" />
                  Generate {pack.credits} schemas
                </div>
                <div className="flex items-center justify-center text-sm">
                  <Check className="h-4 w-4 text-success-foreground mr-2" />
                  Credits never expire
                </div>
              </div>

              <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Select Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  )
}