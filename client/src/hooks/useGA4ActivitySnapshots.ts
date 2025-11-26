import { useQuery } from '@tanstack/react-query'
import { ga4Api, type ActivitySnapshot } from '@/services/ga4'

/**
 * Hook to fetch GA4 activity snapshots for trend visualization
 * Uses TanStack Query for consistent caching, race condition protection,
 * and proper loading state management
 */
export function useGA4ActivitySnapshots(
  propertyId: string | null,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  const {
    data: snapshots = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['ga4', 'activity-snapshots', propertyId, startDate, endDate],
    queryFn: async (): Promise<ActivitySnapshot[]> => {
      if (!propertyId) {
        throw new Error('Property ID is required')
      }
      const response = await ga4Api.getActivitySnapshots(propertyId, startDate, endDate)

      if (response.success && response.snapshots) {
        return response.snapshots
      }
      return []
    },
    enabled: enabled && !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes (consistent with useGA4Metrics)
  })

  return {
    snapshots,
    isLoading,
    error: error ? (error as Error).message : null
  }
}
