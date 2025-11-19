/**
 * Google Analytics 4 Data Service
 * Queries GA4 Data API to retrieve AI crawler metrics
 *
 * This service handles:
 * - Fetching AI crawler traffic data from GA4 properties
 * - Calculating AI Visibility Score (0-100) based on diversity and coverage
 * - Caching metrics to minimize GA4 API calls
 * - Automatic token refresh
 *
 * AI Visibility Score Calculation:
 * - AI Diversity (50%): Number of unique AI crawlers detected (normalized to 0-50)
 * - Coverage (50%): Percentage of pages crawled by at least one AI (0-50)
 * - Total Score: AI Diversity + Coverage (0-100)
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { ga4OAuth } from './oauth.js'
import { db } from '../database.js'

// Known AI crawlers to detect in GA4 traffic
const AI_CRAWLERS = {
  'ChatGPT': ['ChatGPT-User', 'ChatGPT', 'GPTBot'],
  'Claude': ['Claude-Web', 'ClaudeBot', 'anthropic-ai'],
  'Gemini': ['Google-Extended', 'Gemini', 'Bard'],
  'Perplexity': ['PerplexityBot', 'Perplexity'],
  'You.com': ['YouBot', 'you.com'],
  'Bing AI': ['bingbot', 'BingPreview'],
  'SearchGPT': ['SearchGPT', 'OAI-SearchBot']
} as const

export interface CrawlerStats {
  name: string
  sessions: number
  pageViews: number
  uniquePages: number
}

export interface PageCrawlerInfo {
  path: string
  crawlerCount: number
  crawlers: string[]
  sessions: number
}

export interface GA4MetricsResult {
  aiVisibilityScore: number
  aiDiversityScore: number
  coveragePercentage: number
  totalPages: number
  aiCrawledPages: number
  crawlerList: string[]
  topCrawlers: CrawlerStats[]
  topPages: PageCrawlerInfo[]
  dateRangeStart: Date
  dateRangeEnd: Date
}

export class GA4DataService {
  /**
   * Get AI crawler metrics for a GA4 property
   * Uses cached data if available and fresh, otherwise queries GA4 API
   */
  async getAICrawlerMetrics(
    userId: string,
    propertyId: string,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    forceRefresh: boolean = false
  ): Promise<GA4MetricsResult> {
    try {
      console.log('📊 [GA4 Data] Getting AI crawler metrics', {
        userId,
        propertyId,
        dateRangeStart: dateRangeStart.toISOString().split('T')[0],
        dateRangeEnd: dateRangeEnd.toISOString().split('T')[0],
        forceRefresh
      })

      // Check for cached metrics if not forcing refresh
      if (!forceRefresh) {
        const cached = await this.getCachedMetrics(userId, propertyId, dateRangeStart, dateRangeEnd)
        if (cached) {
          console.log('✅ [GA4 Data] Using cached metrics')
          return cached
        }
      }

      // Fetch fresh data from GA4 API
      console.log('🔄 [GA4 Data] Fetching fresh metrics from GA4 API')
      const metrics = await this.fetchMetricsFromGA4(userId, propertyId, dateRangeStart, dateRangeEnd)

      // Cache the results
      await this.cacheMetrics(userId, propertyId, metrics)

      return metrics
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to get AI crawler metrics:', error)
      throw error
    }
  }

  /**
   * Fetch metrics directly from GA4 Data API
   */
  private async fetchMetricsFromGA4(
    userId: string,
    propertyId: string,
    dateRangeStart: Date,
    dateRangeEnd: Date
  ): Promise<GA4MetricsResult> {
    try {
      // Get authenticated client
      const analyticsClient = await this.getAuthenticatedClient(userId)

      // Format dates for GA4 API (YYYY-MM-DD)
      const startDate = dateRangeStart.toISOString().split('T')[0]
      const endDate = dateRangeEnd.toISOString().split('T')[0]

      console.log('🔍 [GA4 Data] Querying GA4 API for AI crawler traffic', {
        propertyId,
        startDate,
        endDate
      })

      // Run report to get AI crawler traffic
      // Query for sessionSource and pageReferrer to identify AI crawlers
      const [response] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'pagePath' },
          { name: 'pageReferrer' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        limit: 10000 // Increase limit to capture all traffic
      })

      console.log('✅ [GA4 Data] Received GA4 API response', {
        rowCount: response.rows?.length || 0
      })

      // Process response to identify AI crawlers
      const crawlerData = this.processGA4Response(response)

      // Calculate metrics
      const metrics = this.calculateMetrics(crawlerData, dateRangeStart, dateRangeEnd)

      console.log('📈 [GA4 Data] Calculated metrics', {
        aiVisibilityScore: metrics.aiVisibilityScore,
        aiDiversityScore: metrics.aiDiversityScore,
        coveragePercentage: metrics.coveragePercentage,
        crawlerCount: metrics.crawlerList.length
      })

      return metrics
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to fetch from GA4 API:', error)
      throw new Error('Failed to fetch Google Analytics data. Please check your connection and try again.')
    }
  }

  /**
   * Process GA4 API response to identify AI crawler traffic
   */
  private processGA4Response(response: any): Map<string, CrawlerStats> {
    const crawlerStatsMap = new Map<string, CrawlerStats>()
    const pagesVisitedByCrawler = new Map<string, Set<string>>()

    if (!response.rows || response.rows.length === 0) {
      console.log('⚠️ [GA4 Data] No data returned from GA4 API')
      return crawlerStatsMap
    }

    // Process each row to identify AI crawlers
    for (const row of response.rows) {
      const sessionSource = row.dimensionValues?.[0]?.value || ''
      const pagePath = row.dimensionValues?.[1]?.value || ''
      const pageReferrer = row.dimensionValues?.[2]?.value || ''
      const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const pageViews = parseInt(row.metricValues?.[1]?.value || '0', 10)

      // Check if this traffic is from an AI crawler
      const crawlerName = this.identifyAICrawler(sessionSource, pageReferrer)

      if (crawlerName) {
        // Initialize crawler stats if not exists
        if (!crawlerStatsMap.has(crawlerName)) {
          crawlerStatsMap.set(crawlerName, {
            name: crawlerName,
            sessions: 0,
            pageViews: 0,
            uniquePages: 0
          })
          pagesVisitedByCrawler.set(crawlerName, new Set())
        }

        // Update stats
        const stats = crawlerStatsMap.get(crawlerName)!
        stats.sessions += sessions
        stats.pageViews += pageViews

        // Track unique pages
        if (pagePath) {
          pagesVisitedByCrawler.get(crawlerName)!.add(pagePath)
        }
      }
    }

    // Update unique page counts
    for (const [crawlerName, pages] of pagesVisitedByCrawler.entries()) {
      const stats = crawlerStatsMap.get(crawlerName)!
      stats.uniquePages = pages.size
    }

    console.log('🤖 [GA4 Data] Identified AI crawlers:', {
      crawlerCount: crawlerStatsMap.size,
      crawlers: Array.from(crawlerStatsMap.keys())
    })

    return crawlerStatsMap
  }

  /**
   * Identify if traffic is from an AI crawler based on source/referrer
   */
  private identifyAICrawler(source: string, referrer: string): string | null {
    const combinedText = `${source} ${referrer}`.toLowerCase()

    for (const [crawlerName, patterns] of Object.entries(AI_CRAWLERS)) {
      for (const pattern of patterns) {
        if (combinedText.includes(pattern.toLowerCase())) {
          return crawlerName
        }
      }
    }

    return null
  }

  /**
   * Calculate AI Visibility Score and other metrics
   */
  private calculateMetrics(
    crawlerData: Map<string, CrawlerStats>,
    dateRangeStart: Date,
    dateRangeEnd: Date
  ): GA4MetricsResult {
    // Get all unique pages across all crawlers
    const allPages = new Set<string>()
    const topCrawlers: CrawlerStats[] = []
    const crawlerList: string[] = []

    for (const [crawlerName, stats] of crawlerData.entries()) {
      crawlerList.push(crawlerName)
      topCrawlers.push(stats)
    }

    // Sort top crawlers by sessions
    topCrawlers.sort((a, b) => b.sessions - a.sessions)

    // Calculate total unique pages visited by AI
    const aiCrawledPages = topCrawlers.reduce((sum, crawler) => sum + crawler.uniquePages, 0)

    // AI Diversity Score: Number of unique AI crawlers (normalized to 0-50)
    // Assume 10+ unique crawlers = max score of 50
    const maxCrawlers = 10
    const aiDiversityScore = Math.min(50, (crawlerList.length / maxCrawlers) * 50)

    // Coverage Percentage: For now, assume we're tracking coverage relative to AI-visited pages
    // In future versions, we could fetch total site pages from sitemap
    // For MVP, coverage is based on how many pages at least one AI visited
    const totalPages = aiCrawledPages // Simplified for MVP
    const coveragePercentage = totalPages > 0 ? 100 : 0 // If any AI visited, 100% of what we track

    // AI Visibility Score: Diversity (50%) + Coverage (50%)
    const coverageScore = Math.min(50, (coveragePercentage / 100) * 50)
    const aiVisibilityScore = Math.round(aiDiversityScore + coverageScore)

    // Build top pages list
    const topPages: PageCrawlerInfo[] = [] // Will be enhanced in future versions

    return {
      aiVisibilityScore,
      aiDiversityScore: crawlerList.length,
      coveragePercentage,
      totalPages,
      aiCrawledPages,
      crawlerList,
      topCrawlers: topCrawlers.slice(0, 10), // Top 10
      topPages: topPages.slice(0, 10), // Top 10
      dateRangeStart,
      dateRangeEnd
    }
  }

  /**
   * Get authenticated Google Analytics Data client
   */
  private async getAuthenticatedClient(userId: string): Promise<BetaAnalyticsDataClient> {
    try {
      // Get stored tokens
      const tokens = await ga4OAuth.getStoredTokens(userId)

      if (!tokens) {
        throw new Error('No Google Analytics connection found. Please connect your account.')
      }

      // Check if token needs refresh
      if (ga4OAuth.shouldRefreshToken(tokens.expiryDate)) {
        console.log('🔄 [GA4 Data] Access token expiring, refreshing...')
        const newTokens = await ga4OAuth.refreshAccessToken(tokens.refreshToken)

        // Update stored tokens
        await ga4OAuth.updateStoredTokens(
          userId,
          newTokens.access_token,
          newTokens.refresh_token,
          newTokens.expiry_date
        )

        tokens.accessToken = newTokens.access_token
      }

      // Create authenticated client using OAuth2
      // We need to use the oauth2Client from the ga4OAuth service
      const oauth2Client = ga4OAuth.getAuthenticatedClient(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiryDate
      )

      // Create Analytics Data client with the authenticated OAuth2 client
      const analyticsClient = new BetaAnalyticsDataClient({
        authClient: oauth2Client
      })

      return analyticsClient
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to get authenticated client:', error)
      throw error
    }
  }

  /**
   * Get cached metrics if available and fresh
   */
  private async getCachedMetrics(
    userId: string,
    propertyId: string,
    dateRangeStart: Date,
    dateRangeEnd: Date
  ): Promise<GA4MetricsResult | null> {
    try {
      // Get mapping for this property
      const mapping = await db.getGA4DomainMappingByProperty(userId, propertyId)

      if (!mapping) {
        return null
      }

      // Get cached metrics
      const cached = await db.getGA4CachedMetrics(
        mapping.id,
        dateRangeStart,
        dateRangeEnd
      )

      if (!cached) {
        return null
      }

      // Check if cache is fresh (less than 24 hours old)
      const cacheAge = Date.now() - cached.refreshedAt.getTime()
      const maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours

      if (cacheAge > maxCacheAge) {
        console.log('⏰ [GA4 Data] Cached metrics expired', {
          ageHours: Math.round(cacheAge / (60 * 60 * 1000))
        })
        return null
      }

      console.log('✅ [GA4 Data] Found fresh cached metrics', {
        ageMinutes: Math.round(cacheAge / (60 * 1000))
      })

      // Convert cached data to result format
      return {
        aiVisibilityScore: cached.aiVisibilityScore || 0,
        aiDiversityScore: cached.aiDiversityScore || 0,
        coveragePercentage: Number(cached.coveragePercentage) || 0,
        totalPages: cached.totalPages || 0,
        aiCrawledPages: cached.aiCrawledPages || 0,
        crawlerList: cached.aiCrawlerList || [],
        topCrawlers: (cached.topCrawlers as any[]) || [],
        topPages: (cached.topPages as any[]) || [],
        dateRangeStart,
        dateRangeEnd
      }
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to get cached metrics:', error)
      return null
    }
  }

  /**
   * Cache metrics in database
   */
  private async cacheMetrics(
    userId: string,
    propertyId: string,
    metrics: GA4MetricsResult
  ): Promise<void> {
    try {
      // Get mapping for this property
      const mapping = await db.getGA4DomainMappingByProperty(userId, propertyId)

      if (!mapping) {
        console.warn('⚠️ [GA4 Data] No mapping found for property, skipping cache')
        return
      }

      console.log('💾 [GA4 Data] Caching metrics', {
        mappingId: mapping.id,
        domain: mapping.domain
      })

      // Store metrics
      await db.storeGA4Metrics({
        userId,
        teamId: mapping.teamId,
        mappingId: mapping.id,
        domain: mapping.domain,
        dateRangeStart: metrics.dateRangeStart,
        dateRangeEnd: metrics.dateRangeEnd,
        aiVisibilityScore: metrics.aiVisibilityScore,
        aiDiversityScore: metrics.aiDiversityScore,
        aiCrawlerList: metrics.crawlerList,
        coveragePercentage: metrics.coveragePercentage,
        totalPages: metrics.totalPages,
        aiCrawledPages: metrics.aiCrawledPages,
        topCrawlers: metrics.topCrawlers,
        topPages: metrics.topPages
      })

      console.log('✅ [GA4 Data] Metrics cached successfully')
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to cache metrics:', error)
      // Don't throw - caching failure shouldn't fail the request
    }
  }

  /**
   * List all GA4 properties accessible with user's credentials
   */
  async listProperties(userId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      console.log('📋 [GA4 Data] Listing GA4 properties for user:', userId)

      const tokens = await ga4OAuth.getStoredTokens(userId)

      if (!tokens) {
        throw new Error('No Google Analytics connection found. Please connect your account.')
      }

      // Check if token needs refresh
      if (ga4OAuth.shouldRefreshToken(tokens.expiryDate)) {
        console.log('🔄 [GA4 Data] Access token expiring, refreshing...')
        const newTokens = await ga4OAuth.refreshAccessToken(tokens.refreshToken)

        await ga4OAuth.updateStoredTokens(
          userId,
          newTokens.access_token,
          newTokens.refresh_token,
          newTokens.expiry_date
        )

        tokens.accessToken = newTokens.access_token
      }

      // Use Admin API to list properties
      const { google } = await import('googleapis')
      const oauth2Client = ga4OAuth.getAuthenticatedClient(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiryDate
      )

      const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })

      // List all accounts first
      const accountsResponse = await analyticsAdmin.accounts.list()
      const accounts = accountsResponse.data.accounts || []

      console.log('✅ [GA4 Data] Found GA4 accounts:', accounts.length)

      // List properties for each account
      const allProperties: Array<{ id: string; name: string; websiteUrl?: string }> = []

      for (const account of accounts) {
        if (!account.name) continue

        try {
          const propertiesResponse = await analyticsAdmin.properties.list({
            filter: `parent:${account.name}`
          })

          const properties = propertiesResponse.data.properties || []

          for (const property of properties) {
            if (property.name) {
              // Extract property ID from resource name (properties/123456789)
              const propertyId = property.name.split('/')[1]

              allProperties.push({
                id: propertyId,
                name: property.displayName || propertyId
              })
            }
          }
        } catch (error) {
          console.warn(`⚠️ [GA4 Data] Failed to list properties for account ${account.name}:`, error)
        }
      }

      console.log('✅ [GA4 Data] Found total properties:', allProperties.length)
      return allProperties
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to list properties:', error)
      throw new Error('Failed to retrieve Google Analytics properties')
    }
  }
}

// Export singleton instance
export const ga4Data = new GA4DataService()
