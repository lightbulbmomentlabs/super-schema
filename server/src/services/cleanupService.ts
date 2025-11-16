/**
 * Cleanup Service
 * Handles automated cleanup of expired resources in the database
 *
 * This service runs the PostgreSQL cleanup function that removes expired
 * pending HubSpot connections and returns analytics about the cleanup.
 */

export class CleanupService {
  private isRunning = false

  /**
   * Clean up expired pending HubSpot connections
   * Returns analytics about what was cleaned up
   *
   * Note: The actual cleanup happens in the PostgreSQL database via the
   * cleanup_expired_pending_hubspot_connections() function defined in migration 024.
   * This service just triggers that function and logs the results.
   */
  async cleanupExpiredPendingHubSpotConnections(): Promise<{
    deletedCount: number
    superschemaFirstCount: number
    marketplaceFirstCount: number
    serverGeneratedCount: number
  }> {
    if (this.isRunning) {
      console.log('⏭️ [Cleanup Service] Cleanup already in progress, skipping...')
      return {
        deletedCount: 0,
        superschemaFirstCount: 0,
        marketplaceFirstCount: 0,
        serverGeneratedCount: 0
      }
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      console.log('🧹 [Cleanup Service] Starting cleanup of expired pending HubSpot connections...')

      // Import db dynamically to avoid circular dependency issues
      const { db } = await import('./database.js')

      // The database function will:
      // 1. Count expired connections by flow type
      // 2. Delete all expired connections
      // 3. Return analytics about what was deleted
      const result: any = await db.supabase
        .rpc('cleanup_expired_pending_hubspot_connections')
        .single()

      if (result.error) {
        throw result.error
      }

      const duration = Date.now() - startTime
      const stats = {
        deletedCount: result.data?.deleted_count || 0,
        superschemaFirstCount: result.data?.superschema_first_count || 0,
        marketplaceFirstCount: result.data?.marketplace_first_count || 0,
        serverGeneratedCount: result.data?.server_generated_count || 0
      }

      if (stats.deletedCount > 0) {
        console.log('✅ [Cleanup Service] Cleanup completed successfully', {
          duration: `${duration}ms`,
          totalDeleted: stats.deletedCount,
          superschemaFirst: stats.superschemaFirstCount,
          marketplaceFirst: stats.marketplaceFirstCount,
          serverGenerated: stats.serverGeneratedCount
        })
      } else {
        console.log('✅ [Cleanup Service] Cleanup completed, nothing to clean', {
          duration: `${duration}ms`
        })
      }

      return stats
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ [Cleanup Service] Cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`
      })

      // Return zeros instead of throwing to prevent cron job from crashing
      return {
        deletedCount: 0,
        superschemaFirstCount: 0,
        marketplaceFirstCount: 0,
        serverGeneratedCount: 0
      }
    } finally {
      this.isRunning = false
    }
  }
}

// Export singleton instance
export const cleanupService = new CleanupService()
