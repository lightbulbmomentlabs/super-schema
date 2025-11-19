/**
 * GA4 Metrics Refresh Service
 * Automatically refreshes cached metrics for all active GA4 connections
 */

import { db } from '../database.js'
import { ga4Data } from './data.js'
import { ga4OAuth } from './oauth.js'

export const ga4MetricsRefreshService = {
  /**
   * Refresh metrics for all active GA4 connections
   * Run this daily via cron job to keep metrics up-to-date
   */
  async refreshAllMetrics(): Promise<{
    totalConnections: number
    refreshedCount: number
    failedCount: number
    errors: Array<{ userId: string; error: string }>
  }> {
    console.log('[GA4 Metrics Refresh] Starting automated refresh...')

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

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Refresh metrics for each connection
    for (const connection of connections) {
      try {
        console.log(`[GA4 Metrics Refresh] Refreshing metrics for user ${connection.user_id}...`)

        // Get stored OAuth tokens
        const tokens = await ga4OAuth.getStoredTokens(connection.user_id)
        if (!tokens) {
          throw new Error('No OAuth tokens found')
        }

        // Fetch fresh metrics from GA4 API
        const metrics = await ga4Data.getAICrawlerMetrics(
          connection.property_id,
          startDateStr,
          endDateStr,
          tokens
        )

        // Store in cache
        await db.storeGA4Metrics(
          connection.user_id,
          connection.property_id,
          metrics,
          startDateStr,
          endDateStr
        )

        stats.refreshedCount++
        console.log(`[GA4 Metrics Refresh] ✅ Successfully refreshed for user ${connection.user_id}`)
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

    console.log(`[GA4 Metrics Refresh] Completed: ${stats.refreshedCount} successful, ${stats.failedCount} failed`)
    return stats
  }
}
