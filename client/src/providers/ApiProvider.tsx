import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { authTokenManager } from '@/utils/authTokenManager'

/**
 * ApiProvider manages the authentication state for API requests
 *
 * Instead of setting up axios interceptors in a useEffect (which creates a race condition),
 * this component simply updates the global authTokenManager with the latest getToken function.
 *
 * The axios interceptor is configured once at module load time in api.ts and uses the
 * authTokenManager to get fresh tokens for each request.
 */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, userId } = useAuth()

  useEffect(() => {
    console.log('🔧 [ApiProvider] Updating auth token manager', {
      isSignedIn,
      hasUserId: !!userId,
      timestamp: new Date().toISOString()
    })

    // Update the global token manager with the latest auth state
    // The axios interceptor (configured in api.ts) will use this to get tokens
    authTokenManager.setTokenGetter(getToken, isSignedIn, userId || null)
  }, [getToken, isSignedIn, userId])

  return <>{children}</>
}
