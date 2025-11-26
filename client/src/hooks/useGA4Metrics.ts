import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ga4Api } from '@/services/ga4'
import toast from 'react-hot-toast'

/**
 * Hook to fetch and manage GA4 AI crawler metrics
 */
export function useGA4Metrics(
  propertyId: string | null,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()

  // Query for metrics
  const {
    data: metricsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ga4', 'metrics', propertyId, startDate, endDate],
    queryFn: async () => {
      if (!propertyId) {
        throw new Error('Property ID is required')
      }
      const response = await ga4Api.getMetrics(propertyId, startDate, endDate)
      return response.metrics
    },
    enabled: enabled && !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes (metrics don't change frequently)
  })

  // Mutation to refresh metrics
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId) {
        throw new Error('Property ID is required')
      }
      return ga4Api.refreshMetrics(propertyId, startDate, endDate)
    },
    onSuccess: (response) => {
      // Update cache with new metrics
      queryClient.setQueryData(
        ['ga4', 'metrics', propertyId, startDate, endDate],
        response.metrics
      )
      // Invalidate snapshots cache to trigger re-fetch for trend chart
      // (snapshots are now recorded during refresh on the backend)
      queryClient.invalidateQueries({ queryKey: ['ga4', 'activity-snapshots'] })
      toast.success('Metrics refreshed successfully')
    },
    onError: (error: any) => {
      console.error('Failed to refresh metrics:', error)
      toast.error(error?.response?.data?.error || 'Failed to refresh metrics')
    }
  })

  return {
    metrics: metricsData || null,
    isLoading,
    error,
    refetch,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending
  }
}
