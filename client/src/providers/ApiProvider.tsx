import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/services/api'

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, userId } = useAuth()

  useEffect(() => {
    console.log('🔧 [ApiProvider] Initializing API interceptors', {
      isSignedIn,
      hasUserId: !!userId,
      timestamp: new Date().toISOString()
    })

    // Set up request interceptor to add auth token
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken()
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('✅ [ApiProvider] Auth token attached:', {
              url: config.url,
              method: config.method?.toUpperCase(),
              hasToken: true,
              tokenPreview: token.substring(0, 20) + '...',
              isSignedIn,
              userId
            })
          } else {
            console.warn('⚠️ [ApiProvider] No auth token available:', {
              url: config.url,
              method: config.method?.toUpperCase(),
              isSignedIn,
              hasUserId: !!userId
            })
          }
        } catch (error) {
          console.error('❌ [ApiProvider] Failed to get auth token:', {
            url: config.url,
            method: config.method?.toUpperCase(),
            error: error instanceof Error ? error.message : 'Unknown error',
            isSignedIn,
            hasUserId: !!userId
          })
        }
        return config
      },
      (error) => {
        console.error('❌ [ApiProvider] Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Set up response interceptor for error handling
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        console.log('✅ [ApiProvider] Response received:', {
          url: response.config.url,
          status: response.status,
          statusText: response.statusText
        })
        return response
      },
      (error) => {
        const status = error.response?.status
        const url = error.config?.url

        console.error('❌ [ApiProvider] Response error:', {
          url,
          method: error.config?.method?.toUpperCase(),
          status,
          statusText: error.response?.statusText,
          errorMessage: error.message,
          isSignedIn,
          hasUserId: !!userId
        })

        if (status === 401) {
          console.warn('🚫 [ApiProvider] 401 Unauthorized - Redirecting to sign-in')
          // Handle unauthorized - redirect to login
          window.location.href = '/sign-in'
        }

        return Promise.reject(error)
      }
    )

    // Cleanup interceptors on unmount
    return () => {
      console.log('🧹 [ApiProvider] Cleaning up interceptors')
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [getToken, isSignedIn, userId])

  return <>{children}</>
}
