import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ga4Api } from '@/services/ga4'
import toast from 'react-hot-toast'

/**
 * Hook to manage GA4 domain mappings
 */
export function useGA4DomainMappings(enabled: boolean = true) {
  const queryClient = useQueryClient()

  // Query for domain mappings
  const {
    data: mappingsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ga4', 'mappings'],
    queryFn: async () => {
      const response = await ga4Api.listDomainMappings()
      return response.mappings || []
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation to create domain mapping
  const createMutation = useMutation({
    mutationFn: ({
      propertyId,
      propertyName,
      domain
    }: {
      propertyId: string
      propertyName: string
      domain: string
    }) => ga4Api.createDomainMapping(propertyId, propertyName, domain),
    onSuccess: () => {
      // Invalidate and refetch mappings
      queryClient.invalidateQueries({ queryKey: ['ga4', 'mappings'] })
      toast.success('Domain mapping created successfully')
    },
    onError: (error: any) => {
      console.error('Failed to create domain mapping:', error)
      toast.error(error?.response?.data?.error || 'Failed to create domain mapping')
    }
  })

  // Mutation to delete domain mapping
  const deleteMutation = useMutation({
    mutationFn: (mappingId: string) => ga4Api.deleteDomainMapping(mappingId),
    onSuccess: () => {
      // Invalidate and refetch mappings
      queryClient.invalidateQueries({ queryKey: ['ga4', 'mappings'] })
      toast.success('Domain mapping deleted successfully')
    },
    onError: (error: any) => {
      console.error('Failed to delete domain mapping:', error)
      toast.error(error?.response?.data?.error || 'Failed to delete domain mapping')
    }
  })

  return {
    mappings: mappingsData || [],
    isLoading,
    error,
    refetch,
    createMapping: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteMapping: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending
  }
}
