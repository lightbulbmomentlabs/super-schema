import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'

const STORAGE_KEYS = {
  monitoring: 'admin:monitoring:lastViewed',
  tickets: 'admin:tickets:lastViewed',
  users: 'admin:users:lastViewed',
}

/**
 * Get the last viewed timestamp for a specific admin tab from localStorage
 * Returns epoch (0) if no timestamp exists, causing all items to be considered "new"
 * Handles localStorage errors gracefully (e.g., private browsing mode)
 */
function getLastViewedTimestamp(key: string): Date {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      return new Date(0) // Epoch - treat all items as new on first visit
    }
    return new Date(stored)
  } catch (error) {
    // localStorage may not be available (private browsing, disabled, etc.)
    console.warn('Failed to read from localStorage:', error)
    return new Date(0) // Fallback to epoch - show all items as new
  }
}

/**
 * Hook to calculate badge counts for admin navigation tabs
 * Compares item creation timestamps against last-viewed timestamps from localStorage
 *
 * Returns badge counts for:
 * - Monitoring tab (error logs)
 * - Tickets tab (support tickets)
 * - Users tab (new user signups)
 */
export function useAdminBadgeCounts() {
  // Get last-viewed timestamps from localStorage
  const lastViewedMonitoring = getLastViewedTimestamp(STORAGE_KEYS.monitoring)
  const lastViewedTickets = getLastViewedTimestamp(STORAGE_KEYS.tickets)
  const lastViewedUsers = getLastViewedTimestamp(STORAGE_KEYS.users)

  // Query error logs for Monitoring tab
  const { data: errorLogsData } = useQuery({
    queryKey: ['admin-error-logs-for-badge'],
    queryFn: () => apiService.getErrorLogs({ limit: 1000, offset: 0 }), // Fetch all recent errors
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: false,
  })

  // Query support tickets for Tickets tab
  const { data: ticketsData } = useQuery({
    queryKey: ['admin-support-tickets-for-badge'],
    queryFn: () => apiService.getSupportTickets(),
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: false,
  })

  // Query all users for Users tab
  const { data: usersData } = useQuery({
    queryKey: ['admin-all-users-for-badge'],
    queryFn: () => apiService.getAllUsers(1000, 0), // Fetch up to 1000 users for badge calculation
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: false,
  })

  // Calculate badge counts by comparing timestamps
  const monitoringCount = errorLogsData?.data?.errorLogs?.filter((log: any) => {
    const createdAt = new Date(log.created_at)
    return createdAt > lastViewedMonitoring
  }).length || 0

  const ticketsCount = ticketsData?.data?.filter((ticket: any) => {
    const createdAt = new Date(ticket.createdAt)
    return createdAt > lastViewedTickets
  }).length || 0

  const usersCount = usersData?.data?.filter((user: any) => {
    const createdAt = new Date(user.created_at)
    return createdAt > lastViewedUsers
  }).length || 0

  return {
    monitoringCount,
    ticketsCount,
    usersCount,
  }
}

/**
 * Mark an admin tab as viewed by updating its localStorage timestamp
 * This will reset the badge count for that tab to 0
 * Handles localStorage errors gracefully (e.g., private browsing mode)
 */
export function markTabAsViewed(tab: 'monitoring' | 'tickets' | 'users') {
  try {
    const key = STORAGE_KEYS[tab]
    localStorage.setItem(key, new Date().toISOString())
  } catch (error) {
    // localStorage may not be available (private browsing, disabled, etc.)
    // Silently fail - badge functionality will be degraded but won't break the app
    console.warn('Failed to write to localStorage:', error)
  }
}
