import { Router } from 'express'
import {
  getUserDomains,
  saveDiscoveredUrls,
  getUserUrls,
  hideUrl,
  unhideUrl,
  deleteDomain,
  getUrlSchema,
  getAllUrlSchemas,
  updateUrlSchema,
  deleteUrl,
  checkUrlExists
} from '../controllers/urlLibraryController.js'

const router = Router()

// GET /api/library/domains - Get user's saved domains
router.get('/domains', getUserDomains)

// GET /api/library/check-url - Check if a URL exists in user's library
router.get('/check-url', checkUrlExists)

// POST /api/library/urls - Save discovered URLs
router.post('/urls', saveDiscoveredUrls)

// GET /api/library/urls - Get user's discovered URLs with optional filters
router.get('/urls', getUserUrls)

// GET /api/library/urls/:urlId/schema - Get schema for a URL (backward compatible - returns first schema)
router.get('/urls/:urlId/schema', getUrlSchema)

// GET /api/library/urls/:urlId/schemas - Get ALL schemas for a URL (multi-schema support)
router.get('/urls/:urlId/schemas', getAllUrlSchemas)

// PUT /api/library/urls/:urlId/schema - Update schema for a URL
router.put('/urls/:urlId/schema', updateUrlSchema)

// PUT /api/library/urls/:urlId/hide - Hide a URL
router.put('/urls/:urlId/hide', hideUrl)

// PUT /api/library/urls/:urlId/unhide - Unhide a URL
router.put('/urls/:urlId/unhide', unhideUrl)

// DELETE /api/library/urls/:urlId - Delete a discovered URL
router.delete('/urls/:urlId', deleteUrl)

// DELETE /api/library/domains/:domainId - Delete a domain and all its URLs
router.delete('/domains/:domainId', deleteDomain)

export default router
