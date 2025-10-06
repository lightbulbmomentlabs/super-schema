import { Router } from 'express'
import {
  discoverUrls,
  getCrawlResults,
  getCachedCrawl
} from '../controllers/crawlerController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// POST /api/crawler/discover - Start URL discovery
router.post('/discover', discoverUrls)

// GET /api/crawler/results/:crawlId - Get crawl results
router.get('/results/:crawlId', getCrawlResults)

// GET /api/crawler/cached/:domain - Check for cached crawl
router.get('/cached/:domain', getCachedCrawl)

export default router
