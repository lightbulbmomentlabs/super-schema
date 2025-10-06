import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/services/api'

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    // Set up request interceptor to add auth token
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        if (isSignedIn) {
          try {
            const token = await getToken()
            if (token) {
              config.headers.Authorization = `Bearer ${token}`
            }
          } catch (error) {
            console.error('Failed to get auth token:', error)
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Set up response interceptor for error handling
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/sign-in'
        }
        return Promise.reject(error)
      }
    )

    // Cleanup interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [getToken, isSignedIn])

  return <>{children}</>
}
