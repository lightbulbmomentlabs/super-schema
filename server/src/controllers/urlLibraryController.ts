import { Response } from 'express'
import { db } from '../services/database.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { z } from 'zod'
import { normalizeUrl } from '@shared/utils'

// Validation schemas
const saveUrlsSchema = z.object({
  domain: z.string().url(),
  urls: z.array(z.object({
    url: z.string().url(),
    path: z.string(),
    depth: z.number().int().min(0)
  }))
})

const urlFiltersSchema = z.object({
  domainId: z.string().uuid().optional(),
  hasSchema: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  search: z.string().optional()
})

// Get user's saved domains
export const getUserDomains = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  const domains = await db.getUserDomains(userId)

  res.json({
    success: true,
    data: domains
  })
})

// Save discovered URLs
export const saveDiscoveredUrls = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const validatedData = saveUrlsSchema.parse(req.body)

  // First, save or update the domain
  const domain = await db.saveOrUpdateDomain(userId, validatedData.domain)

  // Then save the URLs
  await db.saveDiscoveredUrls(userId, domain.id, validatedData.urls)

  res.json({
    success: true,
    data: {
      domain,
      urlCount: validatedData.urls.length
    },
    message: `Successfully saved ${validatedData.urls.length} URLs`
  })
})

// Get user's discovered URLs
export const getUserUrls = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Parse and validate query parameters
  const filters = urlFiltersSchema.parse({
    domainId: req.query.domainId,
    hasSchema: req.query.hasSchema === 'true' ? true : req.query.hasSchema === 'false' ? false : undefined,
    isHidden: req.query.isHidden === 'true' ? true : req.query.isHidden === 'false' ? false : undefined,
    search: req.query.search
  })

  const urls = await db.getUserUrls(userId, filters)

  res.json({
    success: true,
    data: urls
  })
})

// Hide a URL
export const hideUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { urlId } = req.params

  if (!urlId) {
    throw createError('URL ID is required', 400)
  }

  await db.hideUrl(urlId)

  res.json({
    success: true,
    message: 'URL hidden successfully'
  })
})

// Unhide a URL
export const unhideUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { urlId } = req.params

  if (!urlId) {
    throw createError('URL ID is required', 400)
  }

  await db.unhideUrl(urlId)

  res.json({
    success: true,
    message: 'URL unhidden successfully'
  })
})

// Delete a domain and all its URLs
export const deleteDomain = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { domainId } = req.params

  if (!domainId) {
    throw createError('Domain ID is required', 400)
  }

  // This will cascade delete all discovered_urls due to ON DELETE CASCADE
  await db.deleteDomain(domainId)

  res.json({
    success: true,
    message: 'Domain and all associated URLs deleted successfully'
  })
})

// Get schema for a discovered URL
export const getUrlSchema = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { urlId } = req.params

  if (!urlId) {
    throw createError('URL ID is required', 400)
  }

  const schema = await db.getSchemaByDiscoveredUrlId(urlId)

  if (!schema) {
    res.json({
      success: true,
      data: null,
      message: 'No schema found for this URL'
    })
    return
  }

  res.json({
    success: true,
    data: schema
  })
})

// Update schema for a discovered URL
export const updateUrlSchema = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { urlId } = req.params
  const { schemas } = req.body

  if (!urlId) {
    throw createError('URL ID is required', 400)
  }

  if (!Array.isArray(schemas)) {
    throw createError('Schemas must be an array', 400)
  }

  // Get the schema generation record
  const schemaRecord = await db.getSchemaByDiscoveredUrlId(urlId)

  if (!schemaRecord) {
    throw createError('No schema found for this URL', 404)
  }

  // Update the schemas
  await db.updateSchemaGeneration(schemaRecord.id, schemas)

  res.json({
    success: true,
    message: 'Schema updated successfully'
  })
})

// Delete a discovered URL
export const deleteUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { urlId } = req.params

  if (!urlId) {
    throw createError('URL ID is required', 400)
  }

  await db.deleteDiscoveredUrl(urlId, userId)

  res.json({
    success: true,
    message: 'URL deleted successfully'
  })
})

// Check if a URL exists in the user's library
export const checkUrlExists = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    throw createError('URL parameter is required', 400)
  }

  // Normalize the URL for consistent comparison
  const normalizedUrl = normalizeUrl(url)

  // Check if URL exists with schema
  const result = await db.checkUrlExists(userId, normalizedUrl)

  res.json({
    success: true,
    data: result
  })
})
