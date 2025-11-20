import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ga4Api, type GA4Connection } from '@/services/ga4'
import toast from 'react-hot-toast'

/**
 * Hook to manage GA4 connection status
 * Supports multiple Google Analytics account connections
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

  // Mutation to disconnect a specific GA4 connection
  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => ga4Api.disconnect(connectionId),
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

  // Mutation to switch active connection
  const switchConnectionMutation = useMutation({
    mutationFn: (connectionId: string) => ga4Api.setActiveConnection(connectionId),
    onSuccess: () => {
      // Invalidate queries to refresh data with new connection
      queryClient.invalidateQueries({ queryKey: ['ga4', 'connection'] })
      queryClient.invalidateQueries({ queryKey: ['ga4', 'mappings'] })
      queryClient.invalidateQueries({ queryKey: ['ga4', 'properties'] })
      queryClient.invalidateQueries({ queryKey: ['ga4', 'metrics'] })
      queryClient.invalidateQueries({ queryKey: ['ga4', 'trend'] })
      toast.success('Switched Google Analytics account successfully')
    },
    onError: (error: any) => {
      console.error('Failed to switch GA4 connection:', error)
      toast.error(error?.response?.data?.error || 'Failed to switch Google Analytics account')
    }
  })

  return {
    connected: connectionData?.data?.connected || false,
    connections: connectionData?.data?.connections || [],
    activeConnection: connectionData?.data?.activeConnection || null,
    isLoading,
    error,
    refetch,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    switchConnection: switchConnectionMutation.mutate,
    isSwitching: switchConnectionMutation.isPending
  }
}
