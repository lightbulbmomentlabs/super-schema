import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

/**
 * Hook to check if the current user has access to a specific feature
 * Takes into account feature status, user permissions, and beta grants
 */
export function useFeatureAccess(featureSlug: string) {
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['feature-access', featureSlug],
    queryFn: () => apiService.checkFeatureAccess(featureSlug),
    enabled: isLoaded && isSignedIn && !!featureSlug,
    staleTime: 1000 * 30, // Cache for 30 seconds (reduced from 5 minutes for faster access updates)
    retry: 1
  });

  // Mutation for requesting beta access
  const requestBetaMutation = useMutation({
    mutationFn: async (featureId: string) => {
      return apiService.requestFeatureBetaAccess(featureId);
    },
    onSuccess: () => {
      // Invalidate the feature access query to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['feature-access', featureSlug] });
    }
  });

  const result = {
    hasAccess: data?.data?.hasAccess || false,
    feature: data?.data?.feature,
    reason: data?.data?.reason,
    hasPendingRequest: data?.data?.hasPendingRequest || false,
    requestedAt: data?.data?.requestedAt,
    isLoading,
    error,
    requestBeta: (featureId: string) => requestBetaMutation.mutate(featureId),
    isRequestingBeta: requestBetaMutation.isPending
  };

  console.log(`[useFeatureAccess] ${featureSlug} Debug:`, {
    rawData: data,
    result,
    isLoading,
    error
  });

  return result;
}
