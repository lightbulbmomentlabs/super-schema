import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { hubspotApi } from '@/services/hubspot'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HubSpotCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for Clerk to load before making API call
      if (!isLoaded) {
        console.log('⏳ [HubSpotCallback] Waiting for Clerk to load...')
        return
      }

      if (!isSignedIn) {
        console.error('❌ [HubSpotCallback] User not signed in')
        setStatus('error')
        setErrorMessage('You must be signed in to connect HubSpot')
        toast.error('You must be signed in to connect HubSpot')
        setTimeout(() => navigate('/sign-in'), 2000)
        return
      }

      console.log('✅ [HubSpotCallback] Clerk loaded, user signed in')

      // Get auth token explicitly
      const authToken = await getToken()
      if (!authToken) {
        console.error('❌ [HubSpotCallback] Failed to get auth token')
        setStatus('error')
        setErrorMessage('Failed to authenticate')
        toast.error('Failed to authenticate')
        setTimeout(() => navigate('/hubspot'), 2000)
        return
      }
      console.log('✅ [HubSpotCallback] Got auth token:', authToken.substring(0, 20) + '...')

      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check for OAuth errors
      if (error) {
        setStatus('error')
        setErrorMessage(errorDescription || error)
        toast.error(`Authorization failed: ${errorDescription || error}`)
        setTimeout(() => navigate('/hubspot'), 3000)
        return
      }

      // Check for authorization code
      if (!code) {
        setStatus('error')
        setErrorMessage('No authorization code received')
        toast.error('No authorization code received')
        setTimeout(() => navigate('/hubspot'), 3000)
        return
      }

      try {
        // Exchange code for tokens
        const redirectUri = `${window.location.origin}/hubspot/callback`
        const response = await hubspotApi.handleCallback(code, authToken, redirectUri)

        if (response.success) {
          setStatus('success')
          toast.success(`Successfully connected to ${response.data.portalName || 'HubSpot'}!`)
          setTimeout(() => navigate('/hubspot'), 2000)
        } else {
          throw new Error('Failed to connect HubSpot account')
        }
      } catch (error: any) {
        console.error('HubSpot callback error:', error)
        setStatus('error')
        setErrorMessage(error?.response?.data?.error || error.message || 'Failed to connect HubSpot account')
        toast.error(error?.response?.data?.error || 'Failed to connect HubSpot account')
        setTimeout(() => navigate('/hubspot'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, isLoaded, isSignedIn, getToken])

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
            <p className="text-sm text-muted-foreground">Redirecting back to HubSpot settings...</p>
          </>
        )}
      </div>
    </div>
  )
}
