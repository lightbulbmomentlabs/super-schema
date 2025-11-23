import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

/**
 * Hook to fetch and manage user notifications
 * Includes automatic polling to check for new notifications
 */
export function useUserNotifications() {
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  // Fetch notifications with polling every 60 seconds
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: () => apiService.getUserNotifications(),
    enabled: isLoaded && isSignedIn,
    staleTime: 1000 * 50, // Cache for 50 seconds
    refetchInterval: 1000 * 60, // Poll every 60 seconds for new notifications
    retry: 1
  });

  // Mutation for marking a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiService.markNotificationRead(notificationId),
    onSuccess: () => {
      // Invalidate the notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  // Mutation for marking all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiService.markAllNotificationsRead(),
    onSuccess: () => {
      // Invalidate the notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  console.log('[useUserNotifications] Debug:', {
    rawData: data,
    notifications,
    unreadCount,
    isLoading,
    error
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: (notificationId: string) => markAsReadMutation.mutate(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending
  };
}
