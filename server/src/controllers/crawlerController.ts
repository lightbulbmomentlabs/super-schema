import { Request, Response } from 'express'
import { siteCrawlerService, type DiscoveredUrl, type CrawlResult } from '../services/siteCrawler.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export interface AuthenticatedRequest extends Request {
  userId?: string
}

// In-memory storage for crawl results (will be replaced with database in production)
const crawlCache = new Map<string, CrawlResult>()

/**
 * Start URL discovery for a domain
 * POST /api/crawler/discover
 */
export const discoverUrls = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { domain } = req.body
  const userId = req.userId || 'test-user-id'

  if (!domain) {
    res.status(400).json({
      success: false,
      error: 'Domain is required'
    })
    return
  }

  console.log(`🔍 Starting URL discovery for domain: ${domain}`)

  try {
    // Generate unique crawl ID
    const crawlId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Initialize crawl result
    const crawlResult: CrawlResult = {
      domain,
      urls: [],
      totalFound: 0,
      status: 'in_progress'
    }

    crawlCache.set(crawlId, crawlResult)

    // Start async generator to discover URLs and continue in background
    const continueDiscovery = async () => {
      try {
        const urlGenerator = siteCrawlerService.discoverUrls(domain)

        for await (const url of urlGenerator) {
          crawlResult.urls.push(url)
          crawlResult.totalFound++
          crawlCache.set(crawlId, crawlResult)
        }

        crawlResult.status = 'completed'
        crawlCache.set(crawlId, crawlResult)
        console.log(`✅ Crawl ${crawlId} completed with ${crawlResult.totalFound} URLs`)
      } catch (error) {
        crawlResult.status = 'failed'
        crawlResult.error = error instanceof Error ? error.message : 'Unknown error'
        crawlCache.set(crawlId, crawlResult)
        console.error(`❌ Crawl ${crawlId} failed:`, error)
      }
    }

    // Start discovery in background
    continueDiscovery()

    // Wait for at least 20 URLs or completion
    const waitForInitialUrls = async () => {
      const maxWaitTime = 10000 // 10 seconds max wait
      const startTime = Date.now()

      while (crawlResult.totalFound < 20 && crawlResult.status === 'in_progress') {
        if (Date.now() - startTime > maxWaitTime) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    await waitForInitialUrls()

    // Return response with current URLs
    const hasMore = crawlResult.status === 'in_progress'

    res.json({
      success: true,
      data: {
        crawlId,
        urls: crawlResult.urls,
        totalFound: crawlResult.totalFound,
        status: hasMore ? 'in_progress' : 'completed',
        hasMore
      }
    })

  } catch (error) {
    console.error('❌ URL discovery failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    res.status(500).json({
      success: false,
      error: errorMessage
    })
  }
})

/**
 * Get crawl status and results
 * GET /api/crawler/results/:crawlId
 */
export const getCrawlResults = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { crawlId } = req.params

  if (!crawlId) {
    res.status(400).json({
      success: false,
      error: 'Crawl ID is required'
    })
    return
  }

  const crawlResult = crawlCache.get(crawlId)

  if (!crawlResult) {
    res.status(404).json({
      success: false,
      error: 'Crawl not found'
    })
    return
  }

  res.json({
    success: true,
    data: {
      crawlId,
      urls: crawlResult.urls,
      totalFound: crawlResult.totalFound,
      status: crawlResult.status,
      error: crawlResult.error,
      hasMore: crawlResult.status === 'in_progress'
    }
  })
})

/**
 * Check if cached crawl exists for domain
 * GET /api/crawler/cached/:domain
 */
export const getCachedCrawl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { domain } = req.params

  if (!domain) {
    res.status(400).json({
      success: false,
      error: 'Domain is required'
    })
    return
  }

  // Search cache for matching domain (within last 24 hours)
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000

  for (const [crawlId, crawlResult] of crawlCache.entries()) {
    if (crawlResult.domain === domain && crawlResult.status === 'completed') {
      // Check if crawl is within 24 hours
      const crawlTime = parseInt(crawlId.split('_')[1])
      if (now - crawlTime < twentyFourHours) {
        res.json({
          success: true,
          data: {
            crawlId,
            urls: crawlResult.urls,
            totalFound: crawlResult.totalFound,
            status: crawlResult.status,
            cached: true
          }
        })
        return
      }
    }
  }

  res.json({
    success: true,
    data: null
  })
})

/**
 * Clean up old crawl results from cache (keep last 24 hours only)
 */
setInterval(() => {
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000

  for (const [crawlId, crawlResult] of crawlCache.entries()) {
    const crawlTime = parseInt(crawlId.split('_')[1])
    if (now - crawlTime > twentyFourHours) {
      crawlCache.delete(crawlId)
      console.log(`🗑️ Cleaned up old crawl: ${crawlId}`)
    }
  }
}, 60 * 60 * 1000) // Run every hour
