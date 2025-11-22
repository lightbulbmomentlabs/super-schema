/**
 * React Query hook for managing GA4 path exclusion patterns
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ga4Api, type ExclusionPattern, type ExclusionPatternType, type ExclusionCategory } from '../services/ga4'

export const GA4_EXCLUSIONS_KEY = 'ga4-exclusions'

/**
 * Fetch exclusion patterns for a domain mapping
 */
export function useGA4Exclusions(mappingId: string | undefined) {
  return useQuery({
    queryKey: [GA4_EXCLUSIONS_KEY, mappingId],
    queryFn: async () => {
      if (!mappingId) throw new Error('Mapping ID is required')
      const response = await ga4Api.listExclusionPatterns(mappingId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch exclusion patterns')
      }
      return response.patterns
    },
    enabled: !!mappingId
  })
}

/**
 * Create a new exclusion pattern
 */
export function useCreateExclusion(mappingId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      pattern: string
      patternType: ExclusionPatternType
      category: ExclusionCategory
      description?: string
    }) => {
      if (!mappingId) throw new Error('Mapping ID is required')
      const response = await ga4Api.createExclusionPattern(
        mappingId,
        data.pattern,
        data.patternType,
        data.category,
        data.description
      )
      if (!response.success) {
        throw new Error(response.error || 'Failed to create exclusion pattern')
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate exclusion patterns cache
      queryClient.invalidateQueries({ queryKey: [GA4_EXCLUSIONS_KEY, mappingId] })
      // Invalidate metrics cache since exclusions affect metrics
      queryClient.invalidateQueries({ queryKey: ['ga4-metrics'] })
    }
  })
}

/**
 * Update an existing exclusion pattern
 */
export function useUpdateExclusion(mappingId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      patternId: string
      pattern?: string
      patternType?: ExclusionPatternType
      category?: ExclusionCategory
      description?: string
    }) => {
      if (!mappingId) throw new Error('Mapping ID is required')
      const { patternId, ...updates } = data
      const response = await ga4Api.updateExclusionPattern(mappingId, patternId, updates)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update exclusion pattern')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GA4_EXCLUSIONS_KEY, mappingId] })
      queryClient.invalidateQueries({ queryKey: ['ga4-metrics'] })
    }
  })
}

/**
 * Delete an exclusion pattern
 */
export function useDeleteExclusion(mappingId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patternId: string) => {
      if (!mappingId) throw new Error('Mapping ID is required')
      const response = await ga4Api.deleteExclusionPattern(mappingId, patternId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete exclusion pattern')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GA4_EXCLUSIONS_KEY, mappingId] })
      queryClient.invalidateQueries({ queryKey: ['ga4-metrics'] })
    }
  })
}

/**
 * Toggle an exclusion pattern on/off
 */
export function useToggleExclusion(mappingId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { patternId: string; isActive: boolean }) => {
      if (!mappingId) throw new Error('Mapping ID is required')
      const response = await ga4Api.toggleExclusionPattern(mappingId, data.patternId, data.isActive)
      if (!response.success) {
        throw new Error(response.error || 'Failed to toggle exclusion pattern')
      }
      return response.data
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [GA4_EXCLUSIONS_KEY, mappingId] })

      // Snapshot previous value
      const previousPatterns = queryClient.getQueryData<ExclusionPattern[]>([GA4_EXCLUSIONS_KEY, mappingId])

      // Optimistically update
      if (previousPatterns) {
        queryClient.setQueryData<ExclusionPattern[]>(
          [GA4_EXCLUSIONS_KEY, mappingId],
          previousPatterns.map(p =>
            p.id === data.patternId ? { ...p, isActive: data.isActive } : p
          )
        )
      }

      return { previousPatterns }
    },
    onError: (_err, _data, context) => {
      // Rollback on error
      if (context?.previousPatterns) {
        queryClient.setQueryData([GA4_EXCLUSIONS_KEY, mappingId], context.previousPatterns)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [GA4_EXCLUSIONS_KEY, mappingId] })
      queryClient.invalidateQueries({ queryKey: ['ga4-metrics'] })
    }
  })
}
