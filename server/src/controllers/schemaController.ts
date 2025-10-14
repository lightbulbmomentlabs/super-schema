import { Response, Request } from 'express'
import { schemaGeneratorService } from '../services/schemaGenerator.js'
import { validatorService } from '../services/validator.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import {
  schemaGenerationRequestSchema,
  schemaValidationRequestSchema,
  paginationSchema
} from 'aeo-schema-generator-shared/schemas'
import { extractPath, calculatePathDepth, extractBaseDomain } from '../utils/urlHelpers.js'
import { db } from '../services/database.js'
import { MAX_REFINEMENTS } from 'aeo-schema-generator-shared/config'
import { scraperService } from '../services/scraper.js'

export const generateSchema = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Log incoming request for debugging
  console.log('🔵 Schema generation request received:', {
    userId,
    url: req.body?.url,
    schemaType: req.body?.schemaType,
    options: req.body?.options,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Validate request body
  const validatedData = schemaGenerationRequestSchema.parse(req.body)
  const schemaType = req.body?.schemaType || 'Auto'

  try {
    // Extract domain and check if URL exists with schemas
    const baseDomain = extractBaseDomain(validatedData.url)
    const path = extractPath(validatedData.url)
    const depth = calculatePathDepth(path)

    // Check if URL exists in library
    let existingUrl = await db.getDiscoveredUrlByUrl(userId, validatedData.url)
    let existingSchemas: any[] = []

    if (existingUrl) {
      // Get all existing schemas for this URL
      existingSchemas = await db.getSchemasByDiscoveredUrlId(existingUrl.id)
      console.log(`📚 Found ${existingSchemas.length} existing schemas for URL`)

      // Validate max 10 schema types per URL
      if (existingSchemas.length >= 10) {
        throw createError('Maximum 10 schema types per URL reached', 400)
      }

      // Check if this schema type already exists
      const existingType = existingSchemas.find(s => s.schemaType === schemaType)
      if (existingType) {
        // Check if it was deleted and can be regenerated
        if (existingType.deletionCount === 0) {
          throw createError(`Schema type "${schemaType}" already exists for this URL`, 400)
        } else if (existingType.deletionCount >= 1) {
          throw createError(`Schema type "${schemaType}" has already been regenerated once`, 400)
        }
      }
    }

    const isFirstSchemaForUrl = existingSchemas.length === 0

    const result = await schemaGeneratorService.generateSchemas({
      url: validatedData.url,
      userId,
      options: validatedData.options,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      schemaType,
      shouldChargeCredits: isFirstSchemaForUrl  // Only charge for first schema
    })

    if (result.success) {
      // Save URL to library (background operation, don't fail if it errors)
      console.log('📚 Saving URL to library...', { url: validatedData.url, userId, hasSchemaId: !!result.metadata.schemaId })
      let urlId: string | undefined = existingUrl?.id

      try {
        // Extract domain and create/get domain record
        const baseDomain = extractBaseDomain(validatedData.url)
        const domain = await db.saveOrUpdateDomain(userId, baseDomain)
        console.log('🌐 Domain saved/updated:', { domainId: domain.id, domain: baseDomain })

        const path = extractPath(validatedData.url)
        const depth = calculatePathDepth(path)
        console.log('📍 Extracted path info:', { path, depth })

        const discoveredUrl = await db.saveSingleUrlToLibrary(
          userId,
          validatedData.url,
          path,
          depth,
          domain.id // Pass the domain ID
        )
        urlId = discoveredUrl.id
        console.log('✅ URL saved to library:', urlId)

        // Link the schema generation to the discovered URL
        if (result.metadata.schemaId) {
          await db.linkSchemaToDiscoveredUrl(result.metadata.schemaId, urlId)
          console.log('🔗 Linked schema to URL:', { schemaId: result.metadata.schemaId, urlId })
        } else {
          console.warn('⚠️ No schemaId in metadata, cannot link')
        }
      } catch (error) {
        console.error('❌ Failed to save URL to library:', error)
        // Don't fail the request if library save fails
      }

      res.json({
        success: true,
        data: {
          schemas: result.schemas,
          htmlScriptTags: result.htmlScriptTags, // Add HTML-ready script tags
          metadata: result.metadata,
          validationResults: result.validationResults,
          schemaScore: result.schemaScore,
          urlId // Add URL ID for multi-schema support
        },
        message: `Successfully generated ${result.schemas.length} schema(s)`
      })
    } else {
      console.error('🔴 Schema generation failed:', {
        userId,
        url: validatedData.url,
        errorMessage: result.metadata.errorMessage,
        processingTime: result.metadata.processingTimeMs
      })

      res.status(400).json({
        success: false,
        error: result.metadata.errorMessage || 'Schema generation failed',
        data: {
          metadata: result.metadata
        }
      })
    }
  } catch (error) {
    console.error('🔴 Schema generation exception:', {
      userId,
      url: req.body?.url,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    throw createError(
      error instanceof Error ? error.message : 'Schema generation failed',
      500
    )
  }
})

export const refineSchema = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { schemas, url, options, schemaId } = req.body

  if (!Array.isArray(schemas) || schemas.length === 0) {
    throw createError('Request body must contain an array of schemas', 400)
  }

  if (!url) {
    throw createError('URL is required for schema refinement', 400)
  }

  try {
    // If schemaId is provided, check refinement count
    let currentRefinements = 0
    let schemaRecord = null

    if (schemaId) {
      schemaRecord = await db.getSchemaById(schemaId)
      if (schemaRecord) {
        currentRefinements = schemaRecord.refinementCount || 0

        // Check if refinement limit has been reached
        if (currentRefinements >= MAX_REFINEMENTS) {
          throw createError(`Maximum of ${MAX_REFINEMENTS} refinements reached for this schema`, 400)
        }

        console.log(`✅ Refinement allowed: ${currentRefinements}/${MAX_REFINEMENTS}`)
      }
    }

    const result = await schemaGeneratorService.refineSchemas({
      schemas,
      url,
      userId,
      options,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    if (result.success) {
      // If we have a schema record, update it with refined version and increment refinement count
      if (schemaRecord) {
        await db.updateSchemaContent(schemaRecord.id, result.schemas)
        await db.incrementRefinementCount(schemaRecord.id)
        currentRefinements++

        // Also update the schema score
        if (result.schemaScore) {
          await db.updateSchemaGeneration(schemaRecord.id, {
            schemas: result.schemas,
            schemaScore: result.schemaScore
          })
        }

        console.log(`💾 Schema updated in database with ${currentRefinements} refinements`)
      }

      // Update URL in library (updates timestamp via UPSERT)
      try {
        const path = extractPath(url)
        const depth = calculatePathDepth(path)

        await db.saveSingleUrlToLibrary(
          userId,
          url,
          path,
          depth
        )
      } catch (error) {
        console.error('Failed to update URL in library:', error)
        // Don't fail the request if library update fails
      }

      res.json({
        success: true,
        data: {
          schemas: result.schemas,
          htmlScriptTags: result.htmlScriptTags,
          metadata: result.metadata,
          schemaScore: result.schemaScore,
          highlightedChanges: result.highlightedChanges,
          refinementCount: currentRefinements,
          remainingRefinements: MAX_REFINEMENTS - currentRefinements
        },
        message: `Successfully refined schema with score: ${result.schemaScore?.overallScore || 0}`
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.metadata?.errorMessage || 'Schema refinement failed'
      })
    }
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Schema refinement failed',
      500
    )
  }
})

export const refineLibrarySchema = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { schemaId, schemas, url, options } = req.body

  console.log('🔧 Library schema refinement request:', { userId, schemaId, url })

  if (!schemaId) {
    throw createError('Schema ID is required for library schema refinement', 400)
  }

  if (!Array.isArray(schemas) || schemas.length === 0) {
    throw createError('Request body must contain an array of schemas', 400)
  }

  if (!url) {
    throw createError('URL is required for schema refinement', 400)
  }

  try {
    // Get the schema generation record to check refinement count
    const schemaRecord = await db.getSchemaById(schemaId)

    if (!schemaRecord) {
      throw createError('Schema not found', 404)
    }

    // Check if refinement limit has been reached
    const currentRefinements = schemaRecord.refinementCount || 0
    if (currentRefinements >= MAX_REFINEMENTS) {
      throw createError(`Maximum of ${MAX_REFINEMENTS} refinements reached for this schema`, 400)
    }

    console.log(`✅ Refinement allowed: ${currentRefinements}/${MAX_REFINEMENTS}`)

    // Perform refinement
    const result = await schemaGeneratorService.refineSchemas({
      schemas,
      url,
      userId,
      options,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    if (result.success) {
      // Update the schema in the database with refined version and increment refinement count
      await db.updateSchemaContent(schemaRecord.id, result.schemas)
      await db.incrementRefinementCount(schemaRecord.id)

      // Also update the schema score
      if (result.schemaScore) {
        await db.updateSchemaGeneration(schemaRecord.id, {
          schemas: result.schemas,
          schemaScore: result.schemaScore
        })
      }

      console.log(`💾 Schema updated in database with ${currentRefinements + 1} refinements`)

      res.json({
        success: true,
        data: {
          schemas: result.schemas,
          htmlScriptTags: result.htmlScriptTags,
          metadata: result.metadata,
          schemaScore: result.schemaScore,
          highlightedChanges: result.highlightedChanges,
          refinementCount: currentRefinements + 1,
          remainingRefinements: MAX_REFINEMENTS - (currentRefinements + 1)
        },
        message: `Successfully refined schema (${currentRefinements + 1}/${MAX_REFINEMENTS} refinements used)`
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.metadata?.errorMessage || 'Schema refinement failed'
      })
    }
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Library schema refinement failed',
      500
    )
  }
})

export const validateSchema = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Validate request body
  const { schema: schemaToValidate, strict } = schemaValidationRequestSchema.parse(req.body)

  try {
    const validationResult = validatorService.validateSchema(schemaToValidate)

    res.json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        schema: validationResult.schema,
        strictMode: strict
      },
      message: validationResult.isValid ? 'Schema is valid' : 'Schema validation failed'
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Schema validation failed',
      400
    )
  }
})

export const validateMultipleSchemas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { schemas } = req.body

  if (!Array.isArray(schemas)) {
    throw createError('Request body must contain an array of schemas', 400)
  }

  try {
    const result = await schemaGeneratorService.validateSchemas(schemas)

    res.json({
      success: true,
      data: result,
      message: `Validated ${schemas.length} schema(s)`
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Batch validation failed',
      400
    )
  }
})

export const getGenerationHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Validate query parameters
  const { page, limit } = paginationSchema.parse(req.query)

  try {
    const history = await schemaGeneratorService.getGenerationHistory(userId, page, limit)

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to get generation history',
      500
    )
  }
})

export const getGenerationStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  try {
    const stats = await schemaGeneratorService.getGenerationStats(userId)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to get generation statistics',
      500
    )
  }
})

export const getGenerationInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { timeframe } = req.query

  const validTimeframes = ['day', 'week', 'month']
  const selectedTimeframe = typeof timeframe === 'string' && validTimeframes.includes(timeframe)
    ? timeframe as 'day' | 'week' | 'month'
    : 'week'

  try {
    const insights = await schemaGeneratorService.getGenerationInsights(userId, selectedTimeframe)

    res.json({
      success: true,
      data: insights
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to get generation insights',
      500
    )
  }
})

export const batchGenerateSchemas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { urls, options } = req.body

  if (!Array.isArray(urls) || urls.length === 0) {
    throw createError('Request must contain an array of URLs', 400)
  }

  if (urls.length > 10) {
    throw createError('Maximum 10 URLs allowed per batch request', 400)
  }

  try {
    const requests = urls.map((url: string) => ({
      url,
      userId,
      options,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }))

    const results = await schemaGeneratorService.generateBatchSchemas(requests)

    const successCount = results.filter(r => r.success).length
    const totalCreditsUsed = results.reduce((sum, r) => sum + r.metadata.creditsUsed, 0)

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
          creditsUsed: totalCreditsUsed
        }
      },
      message: `Batch generation completed: ${successCount}/${results.length} successful`
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Batch generation failed',
      500
    )
  }
})

// Extract schema from URL - public endpoint for schema grader tool
export const extractSchemaFromUrl = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    throw createError('URL is required', 400)
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    throw createError('Invalid URL format', 400)
  }

  console.log('🔍 Extracting schema from URL:', url)

  try {
    // Scrape the URL to get page content
    const analysis = await scraperService.scrapeUrl(url)

    // Extract any existing JSON-LD schemas from the page
    const existingSchemas = analysis.metadata?.existingJsonLd || []

    if (existingSchemas.length === 0) {
      return res.json({
        success: false,
        message: 'No schema markup found on this page',
        data: {
          url,
          schemasFound: 0
        }
      })
    }

    console.log(`✅ Found ${existingSchemas.length} schema(s) on page`)

    res.json({
      success: true,
      data: {
        url,
        schemas: existingSchemas,
        schemasFound: existingSchemas.length,
        metadata: {
          title: analysis.title,
          description: analysis.description
        }
      },
      message: `Found ${existingSchemas.length} schema(s) on the page`
    })
  } catch (error) {
    console.error('❌ Schema extraction failed:', error)
    throw createError(
      error instanceof Error ? error.message : 'Failed to extract schema from URL',
      500
    )
  }
})

// Delete a schema type (soft delete by incrementing deletion_count)
// Allows 1 regeneration per schema type
export const deleteSchemaType = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { schemaId } = req.params

  if (!schemaId) {
    throw createError('Schema ID is required', 400)
  }

  try {
    // Get the schema to verify ownership and check deletion count
    const schema = await db.getSchemaById(schemaId)

    if (!schema) {
      throw createError('Schema not found', 404)
    }

    if (schema.userId !== userId) {
      throw createError('Unauthorized', 403)
    }

    if (schema.deletionCount >= 1) {
      throw createError('This schema type has already been deleted once and cannot be deleted again', 400)
    }

    // Soft delete by incrementing deletion_count
    await db.incrementDeletionCount(schemaId)

    console.log(`🗑️ Schema type "${schema.schemaType}" soft deleted for URL: ${schema.url}`)

    res.json({
      success: true,
      message: `Schema type "${schema.schemaType}" deleted. You can regenerate this type one more time.`
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to delete schema type',
      500
    )
  }
})