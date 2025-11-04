import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSearchParams } from 'react-router-dom'
import { hubspotApi } from '@/services/hubspot'
import toast from 'react-hot-toast'

/**
 * Hook to automatically claim pending HubSpot connections after user signup
 * Used in Marketplace-first flow where user installs from HubSpot before creating account
 *
 * Usage: Add to main App component or layout that renders after authentication
 */
export function usePendingHubSpotConnection() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    const claimPendingConnection = async () => {
      // Only run once user is authenticated
      if (!isLoaded || !isSignedIn || !userId) {
        return
      }

      // Check if already claimed in this session
      if (claimed || claiming) {
        return
      }

      // Check for pending connection state parameter
      const pendingConnection = searchParams.get('pendingConnection')
      if (!pendingConnection) {
        return
      }

      console.log('🔄 [usePendingHubSpotConnection] Attempting to claim pending connection', {
        userId,
        statePreview: pendingConnection.substring(0, 10) + '...'
      })

      setClaiming(true)

      try {
        // Claim the pending connection
        const response = await hubspotApi.claimPendingConnection(pendingConnection)

        if (response.success && response.data) {
          console.log('✅ [usePendingHubSpotConnection] Successfully claimed connection', {
            userId,
            portalId: response.data.portalId,
            portalName: response.data.portalName
          })

          setClaimed(true)

          // Remove the query parameter from URL
          searchParams.delete('pendingConnection')
          setSearchParams(searchParams, { replace: true })

          // Show success message
          toast.success(`HubSpot account "${response.data.portalName}" connected successfully!`)
        } else {
          throw new Error('Failed to claim HubSpot connection')
        }
      } catch (error: any) {
        console.error('❌ [usePendingHubSpotConnection] Failed to claim connection', {
          userId,
          error: error?.message,
          statusCode: error?.response?.status
        })

        // Remove the query parameter even on failure (expired/invalid)
        searchParams.delete('pendingConnection')
        setSearchParams(searchParams, { replace: true })

        // Show error message
        const errorMsg = error?.response?.status === 404
          ? 'HubSpot connection expired. Please reconnect from HubSpot.'
          : 'Failed to connect HubSpot account. Please try connecting again.'

        toast.error(errorMsg)
      } finally {
        setClaiming(false)
      }
    }

    claimPendingConnection()
  }, [isLoaded, isSignedIn, userId, searchParams, setSearchParams, claimed, claiming])

  return {
    claiming,
    claimed
  }
}
