import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import { X, Sparkles, Globe, ArrowRight, Lightbulb } from 'lucide-react'
import { api } from '@/services/api'
import toast from 'react-hot-toast'
import { extractDomain } from '@/utils/domain'

interface HubSpotConnection {
  id: string
  portal_id: string
  portal_name: string
  associated_domains: string[]
  is_active: boolean
  created_at: string
}

interface Props {
  connection: HubSpotConnection
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'hubspot_domain_prompts_shown'

// Helper functions for localStorage tracking
const markPromptAsShown = (connectionId: string) => {
  try {
    const shown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    shown[connectionId] = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shown))
  } catch (error) {
    console.error('Failed to mark prompt as shown:', error)
  }
}

export const HubSpotDomainAssociationModal = ({ connection, isOpen, onClose }: Props) => {
  const [domain, setDomain] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPulsing, setIsPulsing] = useState(true)
  const queryClient = useQueryClient()

  // Fetch user's schemas to detect common domains
  const { data: schemas } = useQuery({
    queryKey: ['schemas'],
    queryFn: async () => {
      const response = await api.get('/schemas')
      return response.data
    },
    enabled: isOpen,
  })

  // Trigger confetti on mount
  useEffect(() => {
    if (isOpen) {
      // Celebration confetti
      const duration = 3000
      const end = Date.now() + duration

      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()

      // Stop pulsing animation after 3 seconds
      const pulseTimer = setTimeout(() => setIsPulsing(false), 3000)

      return () => clearTimeout(pulseTimer)
    }
  }, [isOpen])

  // Smart domain detection from user's schema library
  const detectDomain = () => {
    if (!schemas || schemas.length === 0) {
      toast.info('No schemas found to detect domain from')
      return
    }

    // Count domain frequency from schemas
    const domainCounts: Record<string, number> = {}

    schemas.forEach((schema: any) => {
      if (schema.url) {
        const detected = extractDomain(schema.url)
        if (detected) {
          domainCounts[detected] = (domainCounts[detected] || 0) + 1
        }
      }
    })

    // Find most common domain
    const mostCommon = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]

    if (mostCommon) {
      setDomain(mostCommon[0])
      toast.success(`Detected: ${mostCommon[0]}`)
    } else {
      toast.info('Could not detect domain from your schemas')
    }
  }

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domainToAdd: string) => {
      const response = await api.post(
        `/hubspot/connections/${connection.id}/domains/add`,
        { domain: domainToAdd }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot-connections'] })
      setIsSuccess(true)

      // Success confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      })

      toast.success('Domain added successfully! 🎉')
      markPromptAsShown(connection.id)

      // Auto-close after showing success
      setTimeout(() => {
        onClose()
      }, 1500)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add domain')
    },
  })

  const handleAddDomain = () => {
    const trimmedDomain = domain.trim()

    if (!trimmedDomain) {
      toast.error('Please enter a domain')
      return
    }

    addDomainMutation.mutate(trimmedDomain)
  }

  const handleSkip = () => {
    markPromptAsShown(connection.id)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && domain.trim()) {
      handleAddDomain()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success State */}
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You're All Set! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Domain added successfully. You can now push schema automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                HubSpot Connected Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Connected to <span className="font-semibold">{connection.portal_name}</span>
              </p>
            </div>

            {/* One More Step Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  2
                </span>
                One More Step to Supercharge Your Workflow
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Add your website domain to enable <strong>automatic portal selection</strong>.
                This saves you time by detecting which HubSpot portal to use when pushing schema.
              </p>
            </div>

            {/* Domain Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Website Domain
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="example.com"
                    className={`
                      w-full h-12 px-4 rounded-lg border-2
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-white
                      placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary/50
                      transition-all
                      ${isPulsing ? 'border-primary animate-pulse' : 'border-gray-300 dark:border-gray-600'}
                    `}
                    autoFocus
                    disabled={addDomainMutation.isPending}
                  />
                </div>
                <button
                  onClick={detectDomain}
                  disabled={addDomainMutation.isPending || !schemas || schemas.length === 0}
                  className="px-4 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Detect
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  You can add multiple domains later from the HubSpot settings page
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleSkip}
                disabled={addDomainMutation.isPending}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium disabled:opacity-50"
              >
                Skip for Now
              </button>
              <button
                onClick={handleAddDomain}
                disabled={addDomainMutation.isPending || !domain.trim()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {addDomainMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    Add Domain
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Export helper to check if prompt should be shown
export const shouldShowDomainPrompt = (connectionId: string): boolean => {
  try {
    const shown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return shown[connectionId] !== true
  } catch (error) {
    return true // Show by default if localStorage fails
  }
}
