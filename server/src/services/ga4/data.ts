/**
 * Google Analytics 4 Data Service
 * Queries GA4 Data API to retrieve AI referral traffic metrics
 *
 * This service handles:
 * - Fetching AI referral traffic data from GA4 properties (human clicks from AI chat interfaces)
 * - Calculating AI Visibility Score (0-100) based on diversity, coverage, and volume
 * - Caching metrics to minimize GA4 API calls
 * - Automatic token refresh
 *
 * AI Visibility Score Calculation (0-100):
 * - Diversity (40%): Number of unique AI platforms detected (0-40 points, max at 8+ platforms)
 * - Coverage (40%): Percentage of site pages visited by AI referrals (0-40 points)
 * - Volume (20%): Engagement level using logarithmic scale (0-20 points, max at 1000+ sessions)
 * - Total Score: Diversity + Coverage + Volume (rounded to 0-100)
 *
 * Note: Detects referral traffic from AI chat interfaces (ChatGPT, Claude, Gemini, Perplexity, etc.)
 * NOT bot crawlers (which GA4 filters out by default)
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { ga4OAuth } from './oauth.js'
import { db } from '../database.js'
import { GA4PathFilter, type ExclusionPattern } from './pathFilter.js'

// Known AI referrer domains to detect in GA4 traffic
// These are human users clicking links FROM AI chat interfaces (not bot crawlers)
// GA4 filters out bot traffic by default, so we detect referral traffic instead
const AI_REFERRER_PATTERNS = {
  'ChatGPT': ['chat.openai.com', 'chatgpt.com', 'openai.com'],
  'Claude': ['claude.ai'],
  'Gemini': ['gemini.google.com', 'bard.google.com'],
  'Perplexity': ['perplexity.ai', 'www.perplexity.ai'],
  'You.com': ['you.com'],
  'Bing Copilot': ['copilot.microsoft.com', 'bing.com/chat'],
  'Meta AI': ['meta.ai'],
  'DuckDuckGo AI': ['duck.ai', 'duckduckgo.com/?q=']
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
  lastCrawled: string // ISO date string of most recent crawl
}

export interface GA4MetricsResult {
  aiVisibilityScore: number
  aiDiversityScore: number
  coveragePercentage: number
  totalPages: number
  aiCrawledPages: number
  ignoredPagesCount: number // Number of pages excluded by filters
  crawlerList: string[]
  topCrawlers: CrawlerStats[]
  topPages: PageCrawlerInfo[]
  nonCrawledPages: string[] // Pages with traffic but no AI referral traffic
  dateRangeStart: Date
  dateRangeEnd: Date
  scoreBreakdown: {
    diversityPoints: number      // 0-40 points
    coveragePoints: number        // 0-40 points
    volumePoints: number          // 0-20 points
    totalAiSessions: number       // Raw count for reference
  }
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

      // Get domain mapping to fetch exclusion patterns and domain
      const domainMapping = await db.getGA4DomainMappingByProperty(userId, propertyId)
      if (!domainMapping) {
        throw new Error('Domain mapping not found for this property')
      }

      // Fetch exclusion patterns for this domain mapping
      const exclusionPatterns = await db.getGA4ExclusionPatterns(domainMapping.id)
      console.log(`🔍 [GA4 Data] Loaded ${exclusionPatterns.length} exclusion patterns for domain ${domainMapping.domain}`)

      // Format dates for GA4 API (YYYY-MM-DD)
      const startDate = dateRangeStart.toISOString().split('T')[0]
      const endDate = dateRangeEnd.toISOString().split('T')[0]

      console.log('🔍 [GA4 Data] Querying GA4 API for AI crawler traffic', {
        propertyId,
        startDate,
        endDate,
        domain: domainMapping.domain,
        exclusionPatternsActive: exclusionPatterns.filter(p => p.isActive).length
      })

      // First, get total unique pages from ALL traffic (for coverage calculation)
      console.log('📊 [GA4 Data] Querying for total unique pages (all traffic)...')
      const [totalPagesResponse] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          { name: 'pagePath' }
        ],
        metrics: [
          { name: 'screenPageViews' }
        ],
        limit: 50000 // Large limit to capture all pages
      })

      // Extract all page paths and apply filtering
      const rawPagePaths = totalPagesResponse.rows?.map(row => row.dimensionValues?.[0]?.value || '') || []
      console.log(`📊 [GA4 Data] Raw page paths from GA4: ${rawPagePaths.length}`)

      // Deduplicate raw page paths BEFORE filtering to get accurate counts
      const uniqueRawPagePaths = new Set<string>(rawPagePaths.filter(path => path))
      const totalRawUniquePages = uniqueRawPagePaths.size

      // Create path filter instance
      const pathFilter = new GA4PathFilter(exclusionPatterns, domainMapping.domain)

      // Filter out excluded paths and cross-domain contamination
      const filteredPagePaths = Array.from(uniqueRawPagePaths).filter(path => {
        // Apply domain matching and exclusion patterns
        return !pathFilter.shouldExcludePath(path)
      })

      const allPagePaths = new Set<string>(filteredPagePaths)
      const totalUniquePages = allPagePaths.size
      const ignoredPagesCount = totalRawUniquePages - totalUniquePages

      console.log('✅ [GA4 Data] Filtered page paths', {
        rawCount: rawPagePaths.length,
        uniqueRawCount: totalRawUniquePages,
        filteredCount: totalUniquePages,
        ignoredCount: ignoredPagesCount
      })

      // Run report to get AI crawler traffic
      // Query for sessionSource, pagePath, pageReferrer, and date to identify AI crawlers and track last crawled
      const [response] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          { name: 'date' },
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

      // Log sample rows to debug what GA4 is actually returning
      if (response.rows && response.rows.length > 0) {
        console.log('🔍 [GA4 Data] Sample GA4 rows (first 5):',
          response.rows.slice(0, 5).map(row => ({
            date: row.dimensionValues?.[0]?.value,
            sessionSource: row.dimensionValues?.[1]?.value,
            pagePath: row.dimensionValues?.[2]?.value,
            pageReferrer: row.dimensionValues?.[3]?.value,
            sessions: row.metricValues?.[0]?.value,
            pageViews: row.metricValues?.[1]?.value
          }))
        )
      }

      // Process response to identify AI crawlers and page-level data
      const { crawlerStats, pageStats } = this.processGA4Response(response)

      // Calculate metrics with real total page count and all page paths
      const metrics = this.calculateMetrics(crawlerStats, pageStats, totalUniquePages, totalRawUniquePages, ignoredPagesCount, allPagePaths, dateRangeStart, dateRangeEnd)

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
  private processGA4Response(response: any): {
    crawlerStats: Map<string, CrawlerStats>
    pageStats: Map<string, PageCrawlerInfo>
  } {
    const crawlerStatsMap = new Map<string, CrawlerStats>()
    const pageStatsMap = new Map<string, PageCrawlerInfo>()
    const pagesVisitedByCrawler = new Map<string, Set<string>>()
    const crawlersByPage = new Map<string, Set<string>>()
    const pageLastCrawled = new Map<string, string>() // Track most recent crawl date per page

    if (!response.rows || response.rows.length === 0) {
      console.log('⚠️ [GA4 Data] No data returned from GA4 API')
      return { crawlerStats: crawlerStatsMap, pageStats: pageStatsMap }
    }

    // Process each row to identify AI crawlers
    for (const row of response.rows) {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      const sessionSource = row.dimensionValues?.[1]?.value || ''
      const pagePath = row.dimensionValues?.[2]?.value || ''
      const pageReferrer = row.dimensionValues?.[3]?.value || ''
      const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const pageViews = parseInt(row.metricValues?.[1]?.value || '0', 10)

      // Convert GA4 date format (YYYYMMDD) to ISO format (YYYY-MM-DD)
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr

      // Check if this traffic is from an AI crawler
      const crawlerName = this.identifyAICrawler(sessionSource, pageReferrer)

      if (crawlerName) {
        // Initialize crawler stats if not exists
        if (!crawlerStatsMap.has(crawlerName)) {
          console.log(`✅ [GA4 Data] Detected AI traffic: ${crawlerName}`, {
            source: sessionSource,
            referrer: pageReferrer
          })
          crawlerStatsMap.set(crawlerName, {
            name: crawlerName,
            sessions: 0,
            pageViews: 0,
            uniquePages: 0
          })
          pagesVisitedByCrawler.set(crawlerName, new Set())
        }

        // Update crawler stats
        const stats = crawlerStatsMap.get(crawlerName)!
        stats.sessions += sessions
        stats.pageViews += pageViews

        // Track unique pages for each crawler
        if (pagePath) {
          pagesVisitedByCrawler.get(crawlerName)!.add(pagePath)

          // Initialize page stats if not exists
          if (!pageStatsMap.has(pagePath)) {
            pageStatsMap.set(pagePath, {
              path: pagePath,
              crawlerCount: 0,
              crawlers: [],
              sessions: 0,
              lastCrawled: formattedDate
            })
            crawlersByPage.set(pagePath, new Set())
            pageLastCrawled.set(pagePath, formattedDate)
          }

          // Update page stats
          const pageStats = pageStatsMap.get(pagePath)!
          pageStats.sessions += sessions
          crawlersByPage.get(pagePath)!.add(crawlerName)

          // Track most recent crawl date
          const currentLastCrawled = pageLastCrawled.get(pagePath)!
          if (formattedDate > currentLastCrawled) {
            pageLastCrawled.set(pagePath, formattedDate)
            pageStats.lastCrawled = formattedDate
          }
        }
      }
    }

    // Update unique page counts for crawlers
    for (const [crawlerName, pages] of pagesVisitedByCrawler.entries()) {
      const stats = crawlerStatsMap.get(crawlerName)!
      stats.uniquePages = pages.size
    }

    // Update crawler counts and lists for pages
    for (const [pagePath, crawlers] of crawlersByPage.entries()) {
      const pageStats = pageStatsMap.get(pagePath)!
      pageStats.crawlerCount = crawlers.size
      pageStats.crawlers = Array.from(crawlers).sort() // Sort alphabetically for consistency
    }

    console.log('🤖 [GA4 Data] Identified AI crawlers:', {
      crawlerCount: crawlerStatsMap.size,
      crawlers: Array.from(crawlerStatsMap.keys()),
      pagesWithAITraffic: pageStatsMap.size
    })

    return { crawlerStats: crawlerStatsMap, pageStats: pageStatsMap }
  }

  /**
   * Identify if traffic is from an AI referrer based on source/referrer
   * Focuses on detecting referral traffic from AI chat interfaces
   */
  private identifyAICrawler(source: string, referrer: string): string | null {
    if (!source && !referrer) {
      return null
    }

    const lowerSource = source.toLowerCase()
    const lowerReferrer = referrer.toLowerCase()

    // Check against all AI referrer patterns
    for (const [aiName, patterns] of Object.entries(AI_REFERRER_PATTERNS)) {
      for (const pattern of patterns) {
        const lowerPattern = pattern.toLowerCase()

        // Check both source and referrer for domain matches
        if (lowerSource.includes(lowerPattern) || lowerReferrer.includes(lowerPattern)) {
          return aiName
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
    pageData: Map<string, PageCrawlerInfo>,
    totalUniquePages: number,
    totalRawUniquePages: number,
    ignoredPagesCount: number,
    allPagePaths: Set<string>,
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

    // Calculate total unique pages visited by AI (using pageData which tracks unique pages)
    const aiCrawledPages = pageData.size

    // Calculate total sessions and pageviews for volume score
    const totalAISessions = topCrawlers.reduce((sum, crawler) => sum + crawler.sessions, 0)
    const totalAIPageViews = topCrawlers.reduce((sum, crawler) => sum + crawler.pageViews, 0)

    // AI Diversity Score: Number of unique AI crawlers (normalized to 40 points)
    // Assume 8+ unique crawlers = max score of 40
    const maxCrawlers = 8
    const diversityScore = Math.min(40, (crawlerList.length / maxCrawlers) * 40)

    // Calculate non-crawled pages first (needed for coverage calculation)
    const aiCrawledPagePaths = new Set(pageData.keys())
    const nonCrawledPages: string[] = Array.from(allPagePaths)
      .filter(path => !aiCrawledPagePaths.has(path))
      .sort() // Alphabetical order

    // Coverage Score: Percentage of active pages crawled by AI (normalized to 40 points)
    // Formula: AI Crawled / (AI Crawled + Not Yet Discovered)
    const totalActivePages = aiCrawledPages + nonCrawledPages.length
    const coveragePercentage = totalActivePages > 0
      ? (aiCrawledPages / totalActivePages) * 100
      : 0
    const coverageScore = Math.min(40, (coveragePercentage / 100) * 40)

    // Volume Score: AI engagement level (normalized to 20 points)
    // Use logarithmic scale for sessions: log10(sessions + 1) / log10(1000) * 20
    // This gives: 1 session = ~0 points, 10 sessions = ~10 points, 100 sessions = ~16 points, 1000+ sessions = 20 points
    const volumeScore = totalAISessions > 0
      ? Math.min(20, (Math.log10(totalAISessions + 1) / Math.log10(1000)) * 20)
      : 0

    // AI Visibility Score: Diversity (40%) + Coverage (40%) + Volume (20%) = 0-100
    const aiVisibilityScore = Math.round(diversityScore + coverageScore + volumeScore)

    // Build top pages list sorted by crawler diversity (most crawlers first)
    const topPages: PageCrawlerInfo[] = Array.from(pageData.values())
      .sort((a, b) => {
        // Primary sort: crawler count (descending)
        if (b.crawlerCount !== a.crawlerCount) {
          return b.crawlerCount - a.crawlerCount
        }
        // Secondary sort: sessions (descending)
        return b.sessions - a.sessions
      })

    console.log('📊 [GA4 Data] Calculated metrics:', {
      aiVisibilityScore,
      diversityScore,
      coverageScore,
      volumeScore,
      crawlerCount: crawlerList.length,
      aiCrawledPages,
      totalPages: totalUniquePages,
      ignoredPages: ignoredPagesCount,
      nonCrawledPages: nonCrawledPages.length,
      coveragePercentage: coveragePercentage.toFixed(2) + '%',
      totalAISessions
    })

    // Total Pages = AI Crawled + Ignored + Not Yet Discovered
    const totalPages = aiCrawledPages + ignoredPagesCount + nonCrawledPages.length

    return {
      aiVisibilityScore,
      aiDiversityScore: crawlerList.length,
      coveragePercentage,
      totalPages,
      aiCrawledPages,
      ignoredPagesCount,
      crawlerList,
      topCrawlers: topCrawlers.slice(0, 10), // Still limit top crawlers to 10 for summary
      topPages, // Return ALL pages (no limit)
      nonCrawledPages, // NEW: Pages not yet discovered by AI
      dateRangeStart,
      dateRangeEnd,
      scoreBreakdown: {
        diversityPoints: Math.round(diversityScore),
        coveragePoints: Math.round(coverageScore),
        volumePoints: Math.round(volumeScore),
        totalAiSessions: totalAISessions
      }
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
          tokens.connectionId,
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

      // Validate cache has all required fields (invalidate old cache missing nonCrawledPages)
      if (!cached.nonCrawledPages) {
        console.log('⚠️ [GA4 Data] Cache missing nonCrawledPages field, invalidating cache', {
          ageMinutes: Math.round(cacheAge / (60 * 1000))
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
        ignoredPagesCount: cached.ignoredPagesCount || 0,
        crawlerList: cached.aiCrawlerList || [],
        topCrawlers: (cached.topCrawlers as any[]) || [],
        topPages: (cached.topPages as any[]) || [],
        nonCrawledPages: (cached.nonCrawledPages as any[]) || [],
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
        ignoredPagesCount: metrics.ignoredPagesCount,
        topCrawlers: metrics.topCrawlers,
        topPages: metrics.topPages,
        nonCrawledPages: metrics.nonCrawledPages
      })

      console.log('✅ [GA4 Data] Metrics cached successfully')
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to cache metrics:', error)
      // Don't throw - caching failure shouldn't fail the request
    }
  }

  /**
   * Get AI Visibility Score trend over time
   * Returns daily AI Visibility Scores for the specified date range
   */
  async getAIVisibilityTrend(
    userId: string,
    propertyId: string,
    dateRangeStart: Date,
    dateRangeEnd: Date
  ): Promise<Array<{ date: string; score: number; crawlerCount: number }>> {
    try {
      console.log('📈 [GA4 Data] Getting AI Visibility trend', {
        userId,
        propertyId,
        dateRangeStart: dateRangeStart.toISOString().split('T')[0],
        dateRangeEnd: dateRangeEnd.toISOString().split('T')[0]
      })

      // Get authenticated client
      const analyticsClient = await this.getAuthenticatedClient(userId)

      // Format dates for GA4 API (YYYY-MM-DD)
      const startDate = dateRangeStart.toISOString().split('T')[0]
      const endDate = dateRangeEnd.toISOString().split('T')[0]

      console.log('🔍 [GA4 Data] Querying GA4 API for daily AI crawler traffic')

      // First, get total unique pages from ALL traffic
      const [totalPagesResponse] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          { name: 'pagePath' }
        ],
        metrics: [
          { name: 'screenPageViews' }
        ],
        limit: 50000
      })

      const totalUniquePages = totalPagesResponse.rows?.length || 0
      console.log('✅ [GA4 Data] Total unique pages for trend:', totalUniquePages)

      // Get domain mapping to access exclusion patterns
      const mappings = await db.getGA4DomainMappings(userId)
      const mapping = mappings.find(m => m.propertyId === propertyId)

      if (!mapping) {
        throw new Error('Domain mapping not found')
      }

      if (!mapping.domain) {
        throw new Error(`Domain mapping ${mapping.id} is missing domain value. Please reconnect your GA4 property.`)
      }

      console.log('🔍 [GA4 Data] Trend mapping details:', {
        mappingId: mapping.id,
        domain: mapping.domain,
        domainType: typeof mapping.domain,
        domainValue: JSON.stringify(mapping.domain),
        propertyId: mapping.propertyId
      })

      // Get exclusion patterns for this mapping
      const exclusionPatterns = await db.getGA4ExclusionPatterns(mapping.id)
      console.log('🔍 [GA4 Data] Exclusion patterns loaded:', exclusionPatterns.length)

      // Extra defensive: Ensure domain is a string before passing to pathFilter
      const safeDomain = mapping.domain || ''
      console.log('🔍 [GA4 Data] Safe domain value:', { safeDomain, type: typeof safeDomain })
      const pathFilter = new GA4PathFilter(exclusionPatterns.filter(p => p.isActive), safeDomain)

      // Extract and filter all page paths
      const rawPagePaths = (totalPagesResponse.rows || [])
        .map(row => row.dimensionValues?.[0]?.value)
        .filter((path): path is string => !!path) // Remove undefined/null values

      // Filter out excluded paths
      const filteredPagePaths = rawPagePaths.filter(path => !pathFilter.shouldExcludePath(path))
      const allPagePaths = new Set(filteredPagePaths)

      // Run report with date dimension to get daily data
      const [response] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          { name: 'date' }, // Daily granularity
          { name: 'sessionSource' },
          { name: 'pagePath' },
          { name: 'pageReferrer' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        limit: 50000 // Larger limit for daily data
      })

      console.log('✅ [GA4 Data] Received GA4 API response for trend', {
        rowCount: response.rows?.length || 0
      })

      // Group data by date and calculate daily scores
      const dailyData = this.processDailyTrendData(response, allPagePaths, startDate, endDate)

      console.log('📊 [GA4 Data] Processed trend data', {
        days: dailyData.length,
        dateRange: `${startDate} to ${endDate}`
      })

      return dailyData
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to get AI Visibility trend:', error)
      throw new Error('Failed to fetch trend data from Google Analytics')
    }
  }

  /**
   * Process daily trend data from GA4 response
   * Uses same 3-component formula as main metrics: Diversity (40%) + Coverage (40%) + Volume (20%)
   * Generates data points for ALL days in the date range, with score=0 for days without AI crawler activity
   */
  private processDailyTrendData(
    response: any,
    allPagePaths: Set<string>,
    startDate: string,
    endDate: string
  ): Array<{ date: string; score: number; crawlerCount: number }> {

    // Group AI crawler data by date
    interface DailyStats {
      crawlers: Set<string>
      aiPages: Set<string> // Pages crawled by AI
      allPages: Set<string> // All pages with traffic (AI or not)
      sessions: number
      pageViews: number
    }
    const dailyStats = new Map<string, DailyStats>()

    // First pass: collect all traffic (both AI and non-AI) to know which pages had activity each day
    for (const row of response.rows) {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      const pagePath = row.dimensionValues?.[2]?.value || ''

      // Convert GA4 date format (YYYYMMDD) to YYYY-MM-DD
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr

      if (!dailyStats.has(formattedDate)) {
        dailyStats.set(formattedDate, {
          crawlers: new Set(),
          aiPages: new Set(),
          allPages: new Set(),
          sessions: 0,
          pageViews: 0
        })
      }

      const stats = dailyStats.get(formattedDate)!
      if (pagePath) {
        stats.allPages.add(pagePath)
      }
    }

    // Second pass: identify AI crawler traffic
    for (const row of response.rows) {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      const sessionSource = row.dimensionValues?.[1]?.value || ''
      const pagePath = row.dimensionValues?.[2]?.value || ''
      const pageReferrer = row.dimensionValues?.[3]?.value || ''
      const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const pageViews = parseInt(row.metricValues?.[1]?.value || '0', 10)

      // Convert GA4 date format (YYYYMMDD) to YYYY-MM-DD
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr

      // Check if this traffic is from an AI crawler
      const crawlerName = this.identifyAICrawler(sessionSource, pageReferrer)

      if (crawlerName) {
        const stats = dailyStats.get(formattedDate)!
        stats.crawlers.add(crawlerName)
        if (pagePath) {
          stats.aiPages.add(pagePath)
        }
        stats.sessions += sessions
        stats.pageViews += pageViews
      }
    }

    // Generate data points for ALL days in the date range
    const trendData: Array<{ date: string; score: number; crawlerCount: number }> = []
    const maxCrawlers = 8

    // Parse start and end dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Generate data point for each day in range
    for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateStr = currentDate.toISOString().split('T')[0] // YYYY-MM-DD format

      // Get stats for this day (or use empty stats if no traffic at all)
      const stats = dailyStats.get(dateStr) || {
        crawlers: new Set(),
        aiPages: new Set(),
        allPages: new Set(),
        sessions: 0,
        pageViews: 0
      }

      const crawlerCount = stats.crawlers.size
      const aiCrawledPages = stats.aiPages.size

      // Diversity Score (40 points max)
      const diversityScore = Math.min(40, (crawlerCount / maxCrawlers) * 40)

      // Coverage Score (40 points max)
      // Use pages with traffic ON THIS SPECIFIC DAY (not all pages across entire date range)
      const pagesWithTrafficToday = stats.allPages.size
      const nonCrawledPagesToday = pagesWithTrafficToday - aiCrawledPages

      // Use same formula as main metrics: AI Crawled / (AI Crawled + Not Yet Discovered)
      const totalActivePages = aiCrawledPages + nonCrawledPagesToday
      const coveragePercentage = totalActivePages > 0
        ? (aiCrawledPages / totalActivePages) * 100
        : 0
      const coverageScore = Math.min(40, (coveragePercentage / 100) * 40)

      // Volume Score (20 points max) - logarithmic scale
      const volumeScore = stats.sessions > 0
        ? Math.min(20, (Math.log10(stats.sessions + 1) / Math.log10(1000)) * 20)
        : 0

      // Total Score (0-100)
      const score = Math.round(diversityScore + coverageScore + volumeScore)

      trendData.push({
        date: dateStr,
        score,
        crawlerCount
      })
    }

    return trendData
  }

  /**
   * Record daily activity snapshots from GA4 data
   * Stores raw metrics (sessions, crawlers, pages) for each day in the date range
   * Used by the trend chart to display activity over time
   */
  async recordDailyActivitySnapshots(
    userId: string,
    propertyId: string,
    dateRangeStart: Date,
    dateRangeEnd: Date
  ): Promise<void> {
    try {
      console.log('📸 [GA4 Data] Recording daily activity snapshots', {
        userId,
        propertyId,
        dateRangeStart: dateRangeStart.toISOString().split('T')[0],
        dateRangeEnd: dateRangeEnd.toISOString().split('T')[0]
      })

      // Get authenticated client
      const analyticsClient = await this.getAuthenticatedClient(userId)

      // Format dates for GA4 API (YYYY-MM-DD)
      const startDate = dateRangeStart.toISOString().split('T')[0]
      const endDate = dateRangeEnd.toISOString().split('T')[0]

      // Get domain mapping to access exclusion patterns
      const mappings = await db.getGA4DomainMappings(userId)
      const mapping = mappings.find(m => m.propertyId === propertyId)

      if (!mapping) {
        throw new Error('Domain mapping not found')
      }

      if (!mapping.domain) {
        throw new Error(`Domain mapping ${mapping.id} is missing domain value. Please reconnect your GA4 property.`)
      }

      // Get exclusion patterns for this mapping
      const exclusionPatterns = await db.getGA4ExclusionPatterns(mapping.id)
      const safeDomain = mapping.domain || ''
      const pathFilter = new GA4PathFilter(exclusionPatterns.filter(p => p.isActive), safeDomain)

      // Create hash of exclusion patterns for cache invalidation
      const patternsHash = this.hashExclusionPatterns(exclusionPatterns.filter(p => p.isActive))

      // Run report with date dimension to get daily data
      const [response] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          { name: 'date' },
          { name: 'sessionSource' },
          { name: 'pagePath' },
          { name: 'pageReferrer' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        limit: 50000
      })

      console.log('✅ [GA4 Data] Received GA4 API response for snapshots', {
        rowCount: response.rows?.length || 0
      })

      // Group data by date
      interface DailyStats {
        crawlers: Set<string>
        aiPages: Set<string>
        allPages: Set<string>
        sessions: number
      }
      const dailyStats = new Map<string, DailyStats>()

      // First pass: collect all traffic to know which pages had activity each day
      for (const row of response.rows) {
        const dateStr = row.dimensionValues?.[0]?.value || ''
        const pagePath = row.dimensionValues?.[2]?.value || ''

        // Convert GA4 date format (YYYYMMDD) to YYYY-MM-DD
        const formattedDate = dateStr.length === 8
          ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
          : dateStr

        if (!dailyStats.has(formattedDate)) {
          dailyStats.set(formattedDate, {
            crawlers: new Set(),
            aiPages: new Set(),
            allPages: new Set(),
            sessions: 0
          })
        }

        const stats = dailyStats.get(formattedDate)!
        if (pagePath && !pathFilter.shouldExcludePath(pagePath)) {
          stats.allPages.add(pagePath)
        }
      }

      // Second pass: identify AI crawler traffic
      for (const row of response.rows) {
        const dateStr = row.dimensionValues?.[0]?.value || ''
        const sessionSource = row.dimensionValues?.[1]?.value || ''
        const pagePath = row.dimensionValues?.[2]?.value || ''
        const pageReferrer = row.dimensionValues?.[3]?.value || ''
        const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10)

        // Convert GA4 date format (YYYYMMDD) to YYYY-MM-DD
        const formattedDate = dateStr.length === 8
          ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
          : dateStr

        // Check if this traffic is from an AI crawler
        const crawlerName = this.identifyAICrawler(sessionSource, pageReferrer)

        if (crawlerName && pagePath && !pathFilter.shouldExcludePath(pagePath)) {
          const stats = dailyStats.get(formattedDate)!
          stats.crawlers.add(crawlerName)
          stats.aiPages.add(pagePath)
          stats.sessions += sessions
        }
      }

      // Store snapshots for each day
      const start = new Date(startDate)
      const end = new Date(endDate)

      for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
        const dateStr = currentDate.toISOString().split('T')[0]

        // Get stats for this day (or use empty stats if no traffic)
        const stats = dailyStats.get(dateStr) || {
          crawlers: new Set(),
          aiPages: new Set(),
          allPages: new Set(),
          sessions: 0
        }

        await db.storeGA4DailySnapshot({
          mappingId: mapping.id,
          snapshotDate: dateStr,
          aiSessions: stats.sessions,
          uniqueCrawlers: stats.crawlers.size,
          aiCrawledPages: stats.aiPages.size,
          totalActivePages: stats.allPages.size,
          crawlerList: Array.from(stats.crawlers),
          exclusionPatternsHash: patternsHash
        })
      }

      console.log('✅ [GA4 Data] Recorded daily snapshots', {
        days: dailyStats.size,
        dateRange: `${startDate} to ${endDate}`
      })
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to record daily snapshots:', error)
      throw new Error('Failed to record daily activity snapshots')
    }
  }

  /**
   * Get activity snapshots from database (for trend chart)
   * Returns empty array if no snapshots exist, allowing fallback to on-demand calculation
   * Updated: Force reload debug
   */
  async getActivitySnapshots(
    userId: string,
    propertyId: string,
    dateRangeStart: Date,
    dateRangeEnd: Date
  ): Promise<Array<{
    date: string
    aiSessions: number
    uniqueCrawlers: number
    aiCrawledPages: number
    totalActivePages: number
    crawlerList: string[]
  }>> {
    try {
      const startDate = dateRangeStart.toISOString().split('T')[0]
      const endDate = dateRangeEnd.toISOString().split('T')[0]

      console.log('🔍 [GA4 Data] getActivitySnapshots - Fetching snapshots', {
        userId,
        propertyId,
        startDate,
        endDate
      })

      // Get domain mapping
      const mappings = await db.getGA4DomainMappings(userId)
      const mapping = mappings.find(m => m.propertyId === propertyId)

      console.log('🔍 [GA4 Data] getActivitySnapshots - Mapping lookup', {
        mappingsCount: mappings.length,
        mappingPropertyIds: mappings.map(m => m.propertyId),
        foundMapping: mapping ? { id: mapping.id, domain: mapping.domain } : null
      })

      if (!mapping) {
        throw new Error('Domain mapping not found')
      }

      const snapshots = await db.getGA4DailySnapshots(mapping.id, startDate, endDate)

      console.log('🔍 [GA4 Data] getActivitySnapshots - Retrieved from DB', {
        mappingId: mapping.id,
        snapshotsCount: snapshots.length,
        firstSnapshot: snapshots[0] || null,
        lastSnapshot: snapshots[snapshots.length - 1] || null
      })

      return snapshots.map(s => ({
        date: s.snapshotDate,
        aiSessions: s.aiSessions,
        uniqueCrawlers: s.uniqueCrawlers,
        aiCrawledPages: s.aiCrawledPages,
        totalActivePages: s.totalActivePages,
        crawlerList: s.crawlerList || []
      }))
    } catch (error) {
      console.error('❌ [GA4 Data] Failed to get activity snapshots:', error)
      return [] // Return empty array on error to allow fallback
    }
  }

  /**
   * Create a hash of exclusion patterns for cache invalidation
   */
  private hashExclusionPatterns(patterns: ExclusionPattern[]): string {
    const sortedPatterns = patterns
      .map(p => `${p.pattern}:${p.patternType}:${p.isActive}`)
      .sort()
      .join('|')

    // Simple hash function (could use crypto.createHash for production)
    let hash = 0
    for (let i = 0; i < sortedPatterns.length; i++) {
      const char = sortedPatterns.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
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
          tokens.connectionId,
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
