import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * HubSpot Marketplace Installation Page
 *
 * This page handles installations from the HubSpot Marketplace.
 * When users click "Install" in the marketplace, HubSpot redirects them here.
 *
 * Two scenarios:
 * 1. Marketplace install (has ?code parameter) → Forward to /hubspot/callback
 * 2. Direct visit (no code) → Initiate OAuth flow
 */
export default function HubSpotInstallPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'redirecting'>('loading')

  useEffect(() => {
    const handleInstall = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      console.log('🚀 [HubSpot Install] Marketplace install page loaded', {
        hasCode: !!code,
        hasError: !!error,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })

      // Check for OAuth errors from HubSpot marketplace install
      if (error) {
        console.error('❌ [HubSpot Install] Error from marketplace install', {
          error,
          errorDescription
        })
        toast.error(`Installation failed: ${errorDescription || error}`)
        // Redirect to main HubSpot page after error
        setTimeout(() => navigate('/hubspot'), 3000)
        return
      }

      // Scenario 1: Marketplace install completed (has authorization code)
      if (code) {
        console.log('✅ [HubSpot Install] Marketplace install detected - forwarding to callback', {
          codePreview: code.substring(0, 20) + '...'
        })

        setStatus('redirecting')

        // Forward to callback page with all parameters
        // The callback page handles the OAuth code exchange and account creation
        const callbackUrl = new URL('/hubspot/callback', window.location.origin)

        // Preserve all query parameters from marketplace redirect
        searchParams.forEach((value, key) => {
          callbackUrl.searchParams.set(key, value)
        })

        console.log('🔄 [HubSpot Install] Redirecting to callback:', callbackUrl.toString())
        window.location.href = callbackUrl.toString()
        return
      }

      // Scenario 2: Direct visit to install page (no code)
      // This means user navigated directly or install URL wasn't clicked
      // Initiate standard OAuth flow
      console.log('🔄 [HubSpot Install] No code found - initiating OAuth flow')

      const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID

      if (!clientId) {
        console.error('❌ [HubSpot Install] No client ID configured')
        toast.error('HubSpot Client ID not configured')
        setTimeout(() => navigate('/hubspot'), 2000)
        return
      }

      const redirectUri = `${window.location.origin}/hubspot/callback`
      const scopes = ['oauth', 'content'] // Match HubSpot app configuration

      // Generate state parameter for CSRF protection
      const stateArray = new Uint8Array(32)
      crypto.getRandomValues(stateArray)
      const state = btoa(String.fromCharCode.apply(null, Array.from(stateArray)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      // Store state in session storage
      sessionStorage.setItem('hubspot_oauth_state', state)
      sessionStorage.setItem('hubspot_oauth_initiation_time', new Date().toISOString())

      // Build OAuth URL
      const authUrl = new URL('https://app.hubspot.com/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', scopes.join(' '))
      authUrl.searchParams.set('state', state)

      console.log('🔐 [HubSpot Install] Initiating OAuth flow', {
        authUrl: authUrl.toString(),
        scopes,
        redirectUri
      })

      setStatus('redirecting')

      // Redirect to HubSpot OAuth
      window.location.href = authUrl.toString()
    }

    handleInstall()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {status === 'loading' ? 'Processing HubSpot installation...' : 'Redirecting...'}
        </h2>
        <p className="text-muted-foreground">
          Please wait while we complete the installation.
        </p>
      </div>
    </div>
  )
}
