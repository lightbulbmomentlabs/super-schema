import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { ga4Api } from '@/services/ga4'
import { cn } from '@/utils/cn'

export default function GA4CallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      // Get code and state from URL params
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      // Handle OAuth errors
      if (error) {
        console.error('OAuth error:', error)
        setStatus('error')
        setErrorMessage(
          error === 'access_denied'
            ? 'Access was denied. Please try again and grant the necessary permissions.'
            : `Authorization failed: ${error}`
        )
        return
      }

      // Validate required params
      if (!code || !state) {
        setStatus('error')
        setErrorMessage('Missing authorization code or state parameter.')
        return
      }

      try {
        // Exchange code for tokens
        const response = await ga4Api.handleCallback(code, state)

        if (response.success) {
          setStatus('success')
          // Redirect to connect page after 1.5 seconds
          setTimeout(() => {
            navigate('/ga4/connect')
          }, 1500)
        } else {
          setStatus('error')
          setErrorMessage(response.error || 'Failed to complete authorization')
        }
      } catch (err: any) {
        console.error('Callback error:', err)
        setStatus('error')
        setErrorMessage(
          err?.response?.data?.error || 'An unexpected error occurred during authorization'
        )
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-12 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-6 mb-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Connecting to Google Analytics
            </h1>
            <p className="text-muted-foreground">
              Please wait while we complete the authorization...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center rounded-full bg-green-500/10 p-6 mb-6"
            >
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Successfully Connected!
            </h1>
            <p className="text-muted-foreground">
              Redirecting you to complete the setup...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center rounded-full bg-destructive/10 p-6 mb-6">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Connection Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/ga4/connect')}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold',
                'bg-gradient-to-r from-primary to-primary/80',
                'text-primary-foreground',
                'hover:shadow-lg hover:scale-105',
                'transition-all duration-200'
              )}
            >
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
