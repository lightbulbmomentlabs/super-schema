/**
 * GA4 Metrics Refresh Service
 * Automatically refreshes cached metrics and records daily snapshots for all active GA4 connections
 */

import { db } from '../database.js'
import { ga4Data } from './data.js'
import { ga4OAuth } from './oauth.js'

export const ga4MetricsRefreshService = {
  /**
   * Refresh metrics and record daily snapshots for all active GA4 connections
   * Run this daily via cron job to keep metrics up-to-date
   */
  async refreshAllMetrics(): Promise<{
    totalConnections: number
    refreshedCount: number
    snapshotsRecorded: number
    failedCount: number
    errors: Array<{ userId: string; error: string }>
  }> {
    console.log('[GA4 Metrics Refresh] Starting automated refresh and snapshot recording...')

    // Get all active GA4 connections
    const query = `
      SELECT DISTINCT ON (gdm.user_id)
        gc.user_id,
        gdm.property_id,
        gdm.property_name,
        gdm.domain
      FROM ga4_connections gc
      INNER JOIN ga4_domain_mappings gdm
        ON gc.user_id = gdm.user_id
      WHERE gc.is_active = true
        AND gdm.is_active = true
    `

    const { rows: connections } = await db.query(query)

    const stats = {
      totalConnections: connections.length,
      refreshedCount: 0,
      snapshotsRecorded: 0,
      failedCount: 0,
      errors: [] as Array<{ userId: string; error: string }>
    }

    if (connections.length === 0) {
      console.log('[GA4 Metrics Refresh] No active connections found')
      return stats
    }

    console.log(`[GA4 Metrics Refresh] Found ${connections.length} active connections`)

    // Set date range: last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Refresh metrics for each connection
    for (const connection of connections) {
      try {
        console.log(`[GA4 Metrics Refresh] Processing user ${connection.user_id}...`)

        // Fetch and cache latest metrics (last 30 days)
        await ga4Data.getAICrawlerMetrics(
          connection.user_id,
          connection.property_id,
          startDate,
          endDate,
          true // force refresh
        )

        stats.refreshedCount++
        console.log(`[GA4 Metrics Refresh] ✅ Metrics refreshed for user ${connection.user_id}`)

        // Record daily snapshots for the last 30 days
        // This will upsert (update or insert) snapshots for each day
        try {
          await ga4Data.recordDailyActivitySnapshots(
            connection.user_id,
            connection.property_id,
            startDate,
            endDate
          )
          stats.snapshotsRecorded++
          console.log(`[GA4 Metrics Refresh] ✅ Snapshots recorded for user ${connection.user_id}`)
        } catch (snapshotError: any) {
          console.warn(`[GA4 Metrics Refresh] ⚠️  Snapshot recording failed for user ${connection.user_id}:`, snapshotError?.message)
          // Don't fail the entire refresh if just snapshots fail
        }

      } catch (error: any) {
        stats.failedCount++
        const errorMessage = error?.message || 'Unknown error'
        stats.errors.push({
          userId: connection.user_id,
          error: errorMessage
        })
        console.error(`[GA4 Metrics Refresh] ❌ Failed for user ${connection.user_id}:`, errorMessage)
      }
    }

    console.log(`[GA4 Metrics Refresh] Completed: ${stats.refreshedCount} metrics refreshed, ${stats.snapshotsRecorded} snapshots recorded, ${stats.failedCount} failed`)
    return stats
  }
}
