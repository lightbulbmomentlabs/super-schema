import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ga4Api, type GA4Connection } from '@/services/ga4'
import toast from 'react-hot-toast'

/**
 * Hook to manage GA4 connection status
 */
export function useGA4Connection() {
  const queryClient = useQueryClient()

  // Query for connection status
  const {
    data: connectionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ga4', 'connection'],
    queryFn: () => ga4Api.getConnectionStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation to disconnect GA4
  const disconnectMutation = useMutation({
    mutationFn: () => ga4Api.disconnect(),
    onSuccess: () => {
      // Invalidate connection query
      queryClient.invalidateQueries({ queryKey: ['ga4', 'connection'] })
      queryClient.invalidateQueries({ queryKey: ['ga4', 'mappings'] })
      queryClient.invalidateQueries({ queryKey: ['ga4', 'properties'] })
      toast.success('Google Analytics disconnected successfully')
    },
    onError: (error: any) => {
      console.error('Failed to disconnect GA4:', error)
      toast.error(error?.response?.data?.error || 'Failed to disconnect Google Analytics')
    }
  })

  return {
    connected: connectionData?.connected || false,
    connection: connectionData?.connection || null,
    isLoading,
    error,
    refetch,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending
  }
}
