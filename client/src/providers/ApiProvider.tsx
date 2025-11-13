import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { authTokenManager } from '@/utils/authTokenManager'
import { apiService } from '@/services/api'

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
  const { user } = useUser()
  const hasInitializedRef = useRef(false)

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

  // Initialize user account when they sign in for the first time
  // This ensures credits are granted regardless of sign-up flow (Sign Up page, Sign In with Google, etc.)
  useEffect(() => {
    const initializeAccount = async () => {
      // Only initialize once per session
      if (hasInitializedRef.current) {
        return
      }

      // Wait for user to be fully loaded and signed in
      if (!isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
        return
      }

      // Mark as initialized to prevent duplicate calls
      hasInitializedRef.current = true

      try {
        console.log('🎉 [ApiProvider] Initializing user account...', {
          email: user.primaryEmailAddress.emailAddress,
          userId: user.id
        })

        await apiService.initializeUser({
          email: user.primaryEmailAddress.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined
        })

        console.log('✅ [ApiProvider] User account initialized successfully!')
      } catch (error: any) {
        console.error('❌ [ApiProvider] Failed to initialize user:', error)
        // Don't block the user - backend endpoint is idempotent
        // If initialization fails, it will be retried on next page load
        hasInitializedRef.current = false // Allow retry on next load
      }
    }

    initializeAccount()
  }, [isSignedIn, user])

  return <>{children}</>
}
