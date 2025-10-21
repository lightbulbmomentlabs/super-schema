/**
 * Global token manager to provide auth tokens to axios interceptor
 *
 * This solves the race condition where API calls were being made before
 * the ApiProvider's useEffect could set up the axios interceptor.
 *
 * By maintaining a global reference to Clerk's getToken function,
 * we can configure the axios interceptor once at module load time
 * while still accessing fresh auth tokens.
 */

type GetTokenFunction = (() => Promise<string | null>) | null

class AuthTokenManager {
  private getTokenFn: GetTokenFunction = null
  private isSignedIn: boolean | undefined = false
  private userId: string | null = null

  /**
   * Set the token getter function from Clerk
   * This is called by ApiProvider when the auth state changes
   */
  setTokenGetter(getToken: GetTokenFunction, isSignedIn: boolean | undefined, userId: string | null) {
    this.getTokenFn = getToken
    this.isSignedIn = isSignedIn
    this.userId = userId

    console.log('🔑 [AuthTokenManager] Token getter updated:', {
      hasTokenGetter: !!getToken,
      isSignedIn,
      hasUserId: !!userId,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get an auth token for API requests
   * Returns null if no token getter is available or user is not signed in
   */
  async getToken(): Promise<string | null> {
    if (!this.getTokenFn) {
      console.warn('⚠️ [AuthTokenManager] No token getter available')
      return null
    }

    if (!this.isSignedIn) {
      console.warn('⚠️ [AuthTokenManager] User is not signed in')
      return null
    }

    try {
      const token = await this.getTokenFn()
      if (!token) {
        console.warn('⚠️ [AuthTokenManager] Token getter returned null')
      }
      return token
    } catch (error) {
      console.error('❌ [AuthTokenManager] Failed to get token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Check if the auth system is ready
   */
  isReady(): boolean {
    return this.getTokenFn !== null
  }

  /**
   * Get current auth status
   */
  getStatus() {
    return {
      isReady: this.isReady(),
      isSignedIn: this.isSignedIn,
      hasUserId: !!this.userId
    }
  }
}

// Export singleton instance
export const authTokenManager = new AuthTokenManager()
