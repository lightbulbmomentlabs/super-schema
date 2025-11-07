import { useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'

/**
 * Hook to check if the current user has admin privileges
 * Fetches admin status from the backend database (is_admin flag)
 * Uses React Query for caching with 5-minute staleTime
 */
export function useIsAdmin(): boolean {
  const { isLoaded, isSignedIn } = useUser()

  // Query the backend API for user profile which includes isAdmin field
  const { data } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiService.getProfile(),
    enabled: isLoaded && isSignedIn, // Only fetch if user is loaded and signed in
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1 // Retry once on failure
  })

  // Return isAdmin from backend, defaults to false if not set or during loading
  return data?.data?.isAdmin || false
}
