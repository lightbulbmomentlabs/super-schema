import { useQuery } from '@tanstack/react-query'
import { ga4Api } from '@/services/ga4'

/**
 * Hook to fetch AI Visibility Score trend data
 */
export function useGA4Trend(
  propertyId: string | null,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  const {
    data: trendData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['ga4', 'trend', propertyId, startDate, endDate],
    queryFn: async () => {
      if (!propertyId) {
        throw new Error('Property ID is required')
      }
      const response = await ga4Api.getTrend(propertyId, startDate, endDate)
      return response.trend
    },
    enabled: enabled && !!propertyId,
    staleTime: 30 * 60 * 1000, // 30 minutes (trend data doesn't change frequently)
  })

  return {
    trend: trendData || [],
    isLoading,
    error
  }
}
