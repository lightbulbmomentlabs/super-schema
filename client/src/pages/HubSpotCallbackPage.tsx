import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { hubspotApi } from '@/services/hubspot'
import { Loader2, CheckCircle, XCircle, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HubSpotCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, getToken, userId } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [errorDetails, setErrorDetails] = useState<any>(null)

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🔄 [HubSpotCallback] Starting callback handler', {
        isLoaded,
        isSignedIn,
        hasUserId: !!userId,
        timestamp: new Date().toISOString()
      })

      // Wait for Clerk to load before making API call
      if (!isLoaded) {
        console.log('⏳ [HubSpotCallback] Waiting for Clerk to load...')
        return
      }

      if (!isSignedIn) {
        console.error('❌ [HubSpotCallback] User not signed in', {
          isLoaded,
          isSignedIn,
          hasUserId: !!userId
        })
        setStatus('error')
        setErrorMessage('You must be signed in to connect HubSpot')
        toast.error('You must be signed in to connect HubSpot')
        setTimeout(() => navigate('/sign-in'), 2000)
        return
      }

      console.log('✅ [HubSpotCallback] Clerk loaded, user signed in', {
        userId,
        isLoaded,
        isSignedIn
      })

      // Get auth token with retry logic
      let authToken: string | null = null
      let retryCount = 0
      const maxRetries = 3

      while (!authToken && retryCount < maxRetries) {
        try {
          console.log(`🔑 [HubSpotCallback] Attempting to get auth token (attempt ${retryCount + 1}/${maxRetries})`)
          authToken = await getToken()

          if (authToken) {
            console.log('✅ [HubSpotCallback] Got auth token:', {
              tokenPreview: authToken.substring(0, 20) + '...',
              tokenLength: authToken.length,
              attempt: retryCount + 1
            })
          } else {
            console.warn('⚠️ [HubSpotCallback] getToken() returned null', {
              attempt: retryCount + 1,
              willRetry: retryCount < maxRetries - 1
            })

            if (retryCount < maxRetries - 1) {
              // Wait 500ms before retrying
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        } catch (error) {
          console.error('❌ [HubSpotCallback] Error getting token', {
            attempt: retryCount + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            willRetry: retryCount < maxRetries - 1
          })

          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        retryCount++
      }

      if (!authToken) {
        console.error('❌ [HubSpotCallback] Failed to get auth token after retries', {
          retriesAttempted: retryCount,
          isLoaded,
          isSignedIn,
          hasUserId: !!userId
        })
        setStatus('error')
        setErrorMessage('Failed to authenticate. Please try signing out and back in.')
        toast.error('Failed to authenticate')
        setTimeout(() => navigate('/hubspot'), 2000)
        return
      }

      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      console.log('📋 [HubSpotCallback] OAuth parameters', {
        hasCode: !!code,
        codePreview: code ? code.substring(0, 20) + '...' : null,
        hasError: !!error,
        error,
        errorDescription
      })

      // Check for OAuth errors
      if (error) {
        console.error('❌ [HubSpotCallback] OAuth error from HubSpot', {
          error,
          errorDescription
        })
        setStatus('error')
        setErrorMessage(errorDescription || error)
        toast.error(`Authorization failed: ${errorDescription || error}`)
        setTimeout(() => navigate('/hubspot'), 3000)
        return
      }

      // Check for authorization code
      if (!code) {
        console.error('❌ [HubSpotCallback] No authorization code in URL', {
          searchParams: Object.fromEntries(searchParams.entries())
        })
        setStatus('error')
        setErrorMessage('No authorization code received from HubSpot')
        toast.error('No authorization code received')
        setTimeout(() => navigate('/hubspot'), 3000)
        return
      }

      try {
        // Exchange code for tokens
        const redirectUri = `${window.location.origin}/hubspot/callback`

        console.log('🔄 [HubSpotCallback] Exchanging code for tokens', {
          redirectUri,
          codePreview: code.substring(0, 20) + '...',
          timestamp: new Date().toISOString()
        })

        const response = await hubspotApi.handleCallback(code, authToken, redirectUri)

        console.log('✅ [HubSpotCallback] Code exchange successful', {
          portalId: response.data?.portalId,
          portalName: response.data?.portalName,
          connectionId: response.data?.connectionId,
          scopes: response.data?.scopes
        })

        if (response.success && response.data) {
          setStatus('success')
          toast.success(`Successfully connected to ${response.data.portalName || 'HubSpot'}!`)
          setTimeout(() => navigate('/hubspot'), 2000)
        } else {
          throw new Error('Failed to connect HubSpot account')
        }
      } catch (error: any) {
        const errorContext = {
          error: error instanceof Error ? error.message : 'Unknown error',
          statusCode: error?.response?.status,
          statusText: error?.response?.statusText,
          errorData: error?.response?.data,
          timestamp: new Date().toISOString(),
          userId: userId || 'unknown',
          url: window.location.href
        }

        console.error('❌ [HubSpotCallback] Callback error', errorContext)

        setStatus('error')

        // Store error details for debugging
        setErrorDetails(errorContext)

        // Determine user-friendly error message based on error type
        let errorMsg = 'Failed to connect HubSpot account'
        let errorDetailsText = ''

        if (error?.response?.status === 401) {
          errorMsg = 'Authentication failed'
          errorDetailsText = 'Your session may have expired. Please try signing out and back in.'
        } else if (error?.response?.status === 400) {
          errorMsg = 'Invalid authorization code'
          errorDetailsText = 'The authorization code from HubSpot was invalid or expired. Please try connecting again.'
        } else if (error?.response?.status === 500) {
          errorMsg = error?.response?.data?.error || 'Server error occurred'
          errorDetailsText = 'Please try again in a few moments. If the problem persists, contact support.'
        } else if (error?.message?.includes('Network Error') || error?.message?.includes('timeout')) {
          errorMsg = 'Connection timeout'
          errorDetailsText = 'Unable to reach the server. Please check your internet connection and try again.'
        } else if (error?.response?.data?.error) {
          errorMsg = error.response.data.error
          errorDetailsText = error.response.data.message || ''
        } else if (error instanceof Error) {
          errorMsg = error.message
        }

        setErrorMessage(errorDetailsText ? `${errorMsg}: ${errorDetailsText}` : errorMsg)
        toast.error(errorMsg)
        setTimeout(() => navigate('/hubspot'), 5000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, isLoaded, isSignedIn, getToken, userId])

  const copyErrorDetails = () => {
    if (!errorDetails) return

    const detailsText = `HubSpot Connection Error Report
Generated: ${errorDetails.timestamp}
User ID: ${errorDetails.userId}

Error: ${errorDetails.error}
Status Code: ${errorDetails.statusCode || 'N/A'}
Status Text: ${errorDetails.statusText || 'N/A'}

URL: ${errorDetails.url}

Additional Data:
${JSON.stringify(errorDetails.errorData, null, 2)}`

    navigator.clipboard.writeText(detailsText)
      .then(() => toast.success('Error details copied to clipboard'))
      .catch(() => toast.error('Failed to copy error details'))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Connecting to HubSpot</h1>
            <p className="text-muted-foreground">
              Please wait while we complete the authorization...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-success-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-success-foreground">Successfully Connected!</h1>
            <p className="text-muted-foreground">
              Your HubSpot account has been connected. Redirecting...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-destructive">Connection Failed</h1>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            {errorDetails && (
              <div className="mt-4 mb-4">
                <button
                  onClick={copyErrorDetails}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy Error Details
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Share these details with support if you need help
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Redirecting back to HubSpot settings...</p>
          </>
        )}
      </div>
    </div>
  )
}
