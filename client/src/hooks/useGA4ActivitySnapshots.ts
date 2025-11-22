import { useState, useEffect } from 'react'
import { ga4Api, type ActivitySnapshot } from '@/services/ga4'

export function useGA4ActivitySnapshots(
  propertyId: string | null,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  const [snapshots, setSnapshots] = useState<ActivitySnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !propertyId) {
      setSnapshots([])
      return
    }

    const fetchSnapshots = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await ga4Api.getActivitySnapshots(propertyId, startDate, endDate)

        if (response.success && response.data?.snapshots) {
          setSnapshots(response.data.snapshots)
        } else {
          setSnapshots([])
        }
      } catch (err: any) {
        console.error('Failed to fetch activity snapshots:', err)
        setError(err.message || 'Failed to load activity snapshots')
        setSnapshots([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSnapshots()
  }, [propertyId, startDate, endDate, enabled])

  return {
    snapshots,
    isLoading,
    error
  }
}
