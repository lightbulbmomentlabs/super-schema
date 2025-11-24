import { scraperService } from './scraper.js'
import { openaiService, type SchemaGenerationOptions, type ContentAnalysis } from './openai.js'
import { anthropicService } from './anthropic.js'
import { validatorService } from './validator.js'
import { db } from './database.js'
import { extractSchemaType } from '../utils/schemaTypeDetector.js'
import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'

// Content compatibility check result interface
interface CompatibilityResult {
  isCompatible: boolean
  reason: string
  suggestions: string[]
}

// AI Model Provider Selection
// Set AI_MODEL_PROVIDER=anthropic (recommended) or AI_MODEL_PROVIDER=openai
const AI_PROVIDER = (process.env.AI_MODEL_PROVIDER || 'anthropic').toLowerCase()
console.log(`🤖 AI Model Provider: ${AI_PROVIDER.toUpperCase()}`)

const aiService = AI_PROVIDER === 'anthropic' ? anthropicService : openaiService

export interface SchemaGenerationResult {
  success: boolean
  schemas: JsonLdSchema[]
  htmlScriptTags?: string  // HTML-ready script tags for easy copy-pasting
  highlightedChanges?: string[]  // List of changes made during refinement
  validationResults: any[]
  scrapedMetadata?: any  // Original scraped metadata for refinement verification
  schemaScore?: any  // Schema quality score
  metadata: {
    schemaId?: string  // Schema generation record ID for linking
    url: string
    processingTimeMs: number
    creditsUsed: number
    errorMessage?: string
    errorCode?: string  // Error code for frontend handling (e.g., 'CONTENT_MISMATCH')
    suggestedAlternatives?: string[]  // Alternative schema types when content mismatch
    requestedType?: string  // The schema type that was requested
    contentAnalysis?: {
      isValid: boolean
      suggestions: string[]
      detectedTypes: string[]
    }
  }
}

export interface GenerationRequest {
  url: string
  userId: string
  options?: SchemaGenerationOptions
  ipAddress?: string
  userAgent?: string
  schemaType?: string
  shouldChargeCredits?: boolean
}

class SchemaGeneratorService {
  async generateSchemas(request: GenerationRequest): Promise<SchemaGenerationResult> {
    const startTime = Date.now()
    let generationId: string | null = null

    // Move these outside try block so they're accessible in catch block
    const isLocalhost = process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL
    const shouldChargeCredits = request.shouldChargeCredits !== false  // Default to true
    const useAtomicCredits = process.env.ENABLE_ATOMIC_CREDITS !== 'false'
    let creditsConsumed = false

    try {
      // 1. Validate URL accessibility
      const urlValidation = await scraperService.validateUrl(request.url)
      if (!urlValidation.isValid) {
        throw new Error(`URL not accessible: ${urlValidation.error}`)
      }

      // 2. Check if user has sufficient credits (skip in localhost/development or if not charging)

      if (!isLocalhost && shouldChargeCredits) {
        // OPTION C: Consume credits BEFORE generation (prevents race condition)
        if (useAtomicCredits) {
          console.log('💰 [Atomic Credits] Consuming credits BEFORE generation')
          creditsConsumed = await db.consumeCreditsAtomic(
            request.userId,
            1,
            `Schema generation (pre-paid) for ${request.url}`
          )

          if (!creditsConsumed) {
            throw new Error('Insufficient credits or credit system busy')
          }
        } else {
          // Legacy flow: Check credits first
          const user = await db.getUser(request.userId)
          if (!user || user.creditBalance < 1) {
            throw new Error('Insufficient credits')
          }
        }
      } else {
        if (isLocalhost) {
          console.log('🚀 Development mode: Skipping credit check for localhost testing')
        } else {
          console.log('💰 Additional schema for URL: Skipping credit check (URL already paid for)')
        }
      }

      // 3. Create schema generation record with schema type
      const schemaType = request.schemaType || 'Auto'
      const creditsCost = (!isLocalhost && shouldChargeCredits) ? 1 : 0
      generationId = await db.createSchemaGeneration(request.userId, request.url, creditsCost, schemaType)

      // 4. Track usage analytics
      await db.trackUsage(
        request.userId,
        'schema_generation',
        {
          url: request.url,
          options: request.options,
          generationId
        },
        request.ipAddress,
        request.userAgent
      )

      // 5. Scrape the website content
      const contentAnalysis = await scraperService.scrapeUrl(request.url, {
        timeout: 30000,
        userAgent: request.userAgent
      })

      // 6. Skip content validation for now (it's too strict and blocking valid content)
      // TODO: Re-implement content validation with better logic
      console.log('⚠️ Skipping content validation to allow schema generation')

      // 6.5 PRE-VALIDATION: Check if requested schema type is compatible with page content
      // This prevents wasted AI calls and provides better user experience
      if (schemaType !== 'Auto') {
        const compatibility = this.checkSchemaTypeCompatibility(schemaType, contentAnalysis)

        if (!compatibility.isCompatible) {
          console.log(`❌ Content mismatch detected: ${schemaType} not compatible with page content`)
          console.log(`   Reason: ${compatibility.reason}`)
          console.log(`   Suggestions: ${compatibility.suggestions.join(', ')}`)

          // Refund credits since we're not making an AI call
          if (!isLocalhost && shouldChargeCredits && useAtomicCredits && creditsConsumed) {
            try {
              await db.refundCredits(
                request.userId,
                1,
                `Refund: Content mismatch - ${schemaType} not found on page`
              )
              console.log('💰 [Atomic Credits] Refunded 1 credit - content mismatch detected pre-AI')
            } catch (refundError) {
              console.error('❌ Failed to refund credits:', refundError)
            }
          }

          // Update generation record with mismatch info
          if (generationId) {
            await db.updateSchemaGeneration(generationId, {
              status: 'failed',
              errorMessage: compatibility.reason,
              processingTimeMs: Date.now() - startTime,
              failureReason: 'content_mismatch',
              failureStage: 'pre_validation'
            })
          }

          return {
            success: false,
            schemas: [],
            validationResults: [],
            metadata: {
              url: request.url,
              processingTimeMs: Date.now() - startTime,
              creditsUsed: 0,
              errorMessage: compatibility.reason,
              errorCode: 'CONTENT_MISMATCH',
              suggestedAlternatives: compatibility.suggestions,
              requestedType: schemaType
            }
          }
        }
      }

      // 7. Generate schemas using AI with requested schema type
      const optionsToPass = {
        ...request.options,
        // Only pass requestedSchemaTypes if user explicitly requested a specific type (not Auto)
        requestedSchemaTypes: schemaType !== 'Auto' ? [schemaType] : undefined
      }

      console.log('🎯 Calling OpenAI with options:', {
        schemaType,
        isAutoMode: schemaType === 'Auto',
        requestedSchemaTypes: optionsToPass.requestedSchemaTypes,
        fullOptions: optionsToPass
      })

      const schemas = await aiService.generateSchemas(contentAnalysis, optionsToPass)

      if (!schemas || schemas.length === 0) {
        throw new Error('No schemas could be generated from the provided content')
      }

      // 8. Validate generated schemas
      const validationResults = validatorService.validateMultipleSchemas(schemas)

      // Debug logging for validation issues
      console.log(`🔍 Validation Results: ${validationResults.length} schemas checked`)
      validationResults.forEach((result, index) => {
        const schemaType = schemas[index]['@type']
        console.log(`Schema ${index + 1} (${schemaType}): ${result.isValid ? '✅ Valid' : '❌ Invalid'}`)
        if (!result.isValid && result.errors.length > 0) {
          console.log(`  ❌ Errors: ${result.errors.map(e => e.message).join(', ')}`)
        }
        if (result.warnings.length > 0) {
          console.log(`  ⚠️ Warnings: ${result.warnings.map(w => w.message).join(', ')}`)
        }
      })

      const validSchemas = validationResults
        .filter(result => result.isValid)
        .map(result => result.schema!)

      console.log(`📊 Schema filtering: ${schemas.length} generated → ${validSchemas.length} valid`)

      // In development mode, be more permissive with validation
      // Use all schemas if we have any generated, regardless of strict validation
      const schemasToUse = process.env.NODE_ENV === 'development' ? schemas : validSchemas

      if (schemasToUse.length === 0) {
        throw new Error('No schemas could be generated or passed validation')
      }

      // Log what we're actually using
      if (process.env.NODE_ENV === 'development' && validSchemas.length !== schemas.length) {
        console.warn(`🚨 Development mode: Using all ${schemasToUse.length} schemas (${validSchemas.length} passed strict validation)`)
      }

      // 9. Credits already consumed (moved to step 2 for atomic operation)
      // Legacy mode (useAtomicCredits=false): Consume credits AFTER generation
      if (!isLocalhost && shouldChargeCredits && !useAtomicCredits) {
        const legacyCreditsConsumed = await db.consumeCredits(
          request.userId,
          1,
          `Schema generation (${schemaType}) for ${request.url}`
        )

        if (!legacyCreditsConsumed) {
          throw new Error('Failed to consume credits')
        }
        console.log('💰 [Legacy Mode] Credits consumed AFTER successful generation')
      } else if (!isLocalhost && shouldChargeCredits && useAtomicCredits) {
        console.log('💰 [Atomic Credits] Credits already consumed at start - no additional charge')
      }

      // 10. Schema quality calculation removed for simplified version

      console.log(`✅ Final schemas being returned: ${schemasToUse.length}`)
      schemasToUse.forEach((schema, index) => {
        console.log(`  ${index + 1}. ${schema['@type']}`)
      })

      // 11. Update generation record with success
      const processingTime = Date.now() - startTime

      // Calculate schema quality score
      const schemaScore = this.calculateBasicScore(schemasToUse)

      // Detect actual schema type from generated schemas ONLY if request was "Auto"
      // Otherwise use the explicitly requested type
      const finalSchemaType = schemaType === 'Auto' ? extractSchemaType(schemasToUse) : schemaType
      console.log(`🔍 Final schema type: "${finalSchemaType}" (original request: "${schemaType}", auto-detected: "${extractSchemaType(schemasToUse)}")`)

      await db.updateSchemaGeneration(generationId, {
        schemas: schemasToUse,
        status: 'success',
        processingTimeMs: processingTime,
        schemaScore: schemaScore,
        schema_type: finalSchemaType  // Store the explicitly requested type or auto-detected type
      })

      console.log(`💾 Database update: Saving ${schemasToUse.length} schemas with quality score and type "${finalSchemaType}"`)

      // Generate HTML-ready script tags for easy copy-pasting
      const htmlScriptTags = this.generateHtmlScriptTags(schemasToUse)

      return {
        success: true,
        schemas: schemasToUse,
        htmlScriptTags, // Add HTML-ready version for easy copy-paste
        schemaScore, // Add schema quality score
        validationResults,
        scrapedMetadata: contentAnalysis, // Include for refinement verification
        metadata: {
          schemaId: generationId, // Include schema ID for linking to library
          url: request.url,
          processingTimeMs: processingTime,
          creditsUsed: (!isLocalhost && shouldChargeCredits) ? 1 : 0,
          schemaType: finalSchemaType, // Return final type (explicitly requested or auto-detected)
          contentAnalysis: contentAnalysis,
          contentQualitySuggestions: (contentAnalysis as any).contentQualitySuggestions || []
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Capture full stack trace for debugging
      const stackTrace = error instanceof Error ? error.stack || '' : ''

      // Categorize the failure reason based on error message and context
      const failureReason = this.categorizeFailureReason(error, errorMessage)

      // Determine which stage of the pipeline failed
      const failureStage = this.determineFailureStage(errorMessage, stackTrace)

      // Get AI model provider being used
      const aiModelProvider = AI_PROVIDER === 'anthropic'
        ? 'claude-sonnet-4-20250514'
        : 'openai-gpt-4o'

      // Build request context for debugging
      const requestContext: any = {
        ipAddress: request.ipAddress || 'unknown',
        userAgent: request.userAgent || 'unknown',
        requestedSchemaType: request.schemaType || 'Auto',
        shouldChargeCredits: shouldChargeCredits,
        isLocalhost: isLocalhost,
        timestamp: new Date().toISOString()
      }

      // Include scraper diagnostics if available (Phase 1.5: Enhanced Scraper Debugging)
      if (error && typeof error === 'object' && 'scraperDiagnostics' in error) {
        requestContext.scraperDiagnostics = (error as any).scraperDiagnostics
      }

      // OPTION C: Refund credits if they were consumed but generation failed (atomic mode only)
      if (!isLocalhost && shouldChargeCredits && useAtomicCredits && creditsConsumed) {
        try {
          await db.refundCredits(
            request.userId,
            1,
            `Refund: Schema generation failed for ${request.url} - ${errorMessage.substring(0, 100)}`
          )
          console.log('💰 [Atomic Credits] Refunded 1 credit due to generation failure')
          requestContext.creditRefunded = true
        } catch (refundError) {
          console.error('❌ [Atomic Credits] Failed to refund credits:', refundError)
          requestContext.creditRefundFailed = true
        }
      }

      // Update generation record with detailed failure information (if record was created)
      if (generationId) {
        await db.updateSchemaGeneration(generationId, {
          status: 'failed',
          errorMessage,
          processingTimeMs: processingTime,
          failureReason,
          failureStage,
          aiModelProvider,
          stackTrace,
          requestContext
        })
      }

      console.error('Schema generation error:', {
        userId: request.userId,
        url: request.url,
        error: errorMessage,
        failureReason,
        failureStage,
        processingTime,
        aiModelProvider
      })

      return {
        success: false,
        schemas: [],
        validationResults: [],
        metadata: {
          url: request.url,
          processingTimeMs: processingTime,
          creditsUsed: 0, // No credits consumed on failure
          errorMessage
        }
      }
    }
  }

  async validateSchemas(schemas: any[]): Promise<{
    isValid: boolean
    results: any[]
    summary: any
  }> {
    try {
      const validationResults = validatorService.validateMultipleSchemas(schemas)
      const summary = validatorService.getValidationSummary(validationResults)

      return {
        isValid: summary.errorRate === 0,
        results: validationResults,
        summary
      }
    } catch (error) {
      console.error('Schema validation error:', error)
      throw new Error('Failed to validate schemas')
    }
  }

  async getGenerationHistory(userId: string, page: number = 1, limit: number = 10) {
    try {
      return await db.getSchemaGenerations(userId, page, limit)
    } catch (error) {
      console.error('Failed to get generation history:', error)
      throw new Error('Failed to retrieve generation history')
    }
  }

  async getGenerationStats(userId: string) {
    try {
      return await db.getUserStats(userId)
    } catch (error) {
      console.error('Failed to get generation stats:', error)
      throw new Error('Failed to retrieve generation statistics')
    }
  }

  // Batch generation for multiple URLs (for enterprise users)
  async generateBatchSchemas(requests: GenerationRequest[]): Promise<SchemaGenerationResult[]> {
    const results: SchemaGenerationResult[] = []

    for (const request of requests) {
      try {
        const result = await this.generateSchemas(request)
        results.push(result)

        // Add small delay between requests to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        results.push({
          success: false,
          schemas: [],
          validationResults: [],
          metadata: {
            url: request.url,
            processingTimeMs: 0,
            creditsUsed: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    return results
  }

  // Get schema generation insights
  async getGenerationInsights(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
    try {
      const stats = await db.getUserStats(userId)
      const recentGenerations = await db.getSchemaGenerations(userId, 1, 50)

      // Calculate success rate
      const totalGenerations = recentGenerations.data.length
      const successfulGenerations = recentGenerations.data.filter(g => g.status === 'success').length
      const successRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 0

      // Calculate average processing time
      const successfulTimes = recentGenerations.data
        .filter(g => g.status === 'success' && g.processingTimeMs)
        .map(g => g.processingTimeMs!)
      const avgProcessingTime = successfulTimes.length > 0
        ? successfulTimes.reduce((sum, time) => sum + time, 0) / successfulTimes.length
        : 0

      // Detect most common schema types
      const schemaTypes: Record<string, number> = {}
      recentGenerations.data.forEach(generation => {
        generation.schemas.forEach(schema => {
          const type = schema['@type']
          if (type) {
            schemaTypes[type] = (schemaTypes[type] || 0) + 1
          }
        })
      })

      return {
        ...stats,
        successRate: Math.round(successRate),
        avgProcessingTime: Math.round(avgProcessingTime),
        commonSchemaTypes: Object.entries(schemaTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
        recentActivity: recentGenerations.data.slice(0, 10)
      }
    } catch (error) {
      console.error('Failed to get generation insights:', error)
      throw new Error('Failed to retrieve generation insights')
    }
  }

  async refineSchemas(params: {
    schemas: JsonLdSchema[]
    url: string
    userId: string
    options?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<SchemaGenerationResult> {
    const { schemas, url, userId, options } = params
    console.log('🔧 Refining schemas for URL:', url)

    try {
      // Scrape the URL to get original metadata for verification
      console.log('🔍 Re-scraping URL to get original metadata for anti-hallucination verification')
      const scrapedMetadata = await scraperService.scrapeUrl(url, {
        timeout: 30000,
        userAgent: params.userAgent
      })

      // Use AI to refine the existing schemas with metadata for verification
      // Note: Refinement always uses OpenAI (gpt-4o-mini) for cost efficiency
      // The critical initial generation uses the configured AI provider (Claude/OpenAI)
      const refinementCount = options?.refinementCount || 1
      console.log(`🔧 Passing refinement count to OpenAI service: ${refinementCount}`)

      const { schemas: refinedSchemas, changes } = await openaiService.refineSchemas(schemas, url, {
        ...options,
        originalMetadata: scrapedMetadata,
        refinementCount
      })

      // Calculate new score
      const schemaScore = this.calculateBasicScore(refinedSchemas)

      // Generate HTML script tags
      const htmlScriptTags = this.generateHtmlScriptTags(refinedSchemas)

      return {
        success: true,
        schemas: refinedSchemas,
        htmlScriptTags,
        schemaScore,
        highlightedChanges: changes, // Add the changes list
        validationResults: [],
        metadata: {
          url,
          processingTimeMs: 0,
          creditsUsed: 0, // Included in original generation
          message: 'Schema refined successfully'
        }
      }
    } catch (error) {
      console.error('❌ Schema refinement failed:', error)
      return {
        success: false,
        schemas: [],
        validationResults: [],
        metadata: {
          url,
          processingTimeMs: 0,
          creditsUsed: 0,
          errorMessage: error instanceof Error ? error.message : 'Refinement failed'
        }
      }
    }
  }

  // Categorize failure reason based on error type and message
  private categorizeFailureReason(error: unknown, errorMessage: string): string {
    // Check for timeout errors
    if (errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out') ||
        errorMessage.toLowerCase().includes('econnaborted')) {
      return 'timeout'
    }

    // Check for scraper/content fetching errors
    if (errorMessage.includes('URL not accessible') ||
        errorMessage.includes('scrape') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Waiting for selector') ||
        errorMessage.toLowerCase().includes('waiting for') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('getaddrinfo')) {
      return 'scraper_error'
    }

    // Check for AI service errors
    if (errorMessage.includes('AI') ||
        errorMessage.includes('anthropic') ||
        errorMessage.includes('openai') ||
        errorMessage.includes('generate') ||
        errorMessage.toLowerCase().includes('model')) {
      return 'ai_error'
    }

    // Check for validation errors
    if (errorMessage.includes('validation') ||
        errorMessage.includes('invalid schema') ||
        errorMessage.includes('No schemas could be generated or passed validation')) {
      return 'validation_error'
    }

    // Check for insufficient content
    if (errorMessage.includes('No schemas could be generated') ||
        errorMessage.includes('insufficient content') ||
        errorMessage.includes('no content')) {
      return 'insufficient_content'
    }

    // Check for network errors
    if (errorMessage.includes('network') ||
        errorMessage.includes('ENETUNREACH') ||
        errorMessage.includes('EHOSTUNREACH')) {
      return 'network_error'
    }

    // Check for rate limiting
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429')) {
      return 'rate_limit'
    }

    // Check for credit/authorization issues
    if (errorMessage.includes('credits') ||
        errorMessage.includes('Insufficient credits') ||
        errorMessage.includes('Failed to consume credits') ||
        errorMessage.includes('credit system busy')) {
      return 'insufficient_credits'
    }

    // Default to unknown
    return 'unknown'
  }

  // Determine which stage of the pipeline failed based on error context
  private determineFailureStage(errorMessage: string, stackTrace: string): string {
    // Check stack trace and error message for clues about failure stage
    const combinedContext = `${errorMessage} ${stackTrace}`.toLowerCase()

    // Credit consumption stage indicators (check FIRST before generic post_processing)
    if (errorMessage.includes('credits') ||
        errorMessage.includes('Insufficient credits') ||
        errorMessage.includes('Failed to consume credits') ||
        errorMessage.includes('credit system busy') ||
        combinedContext.includes('consumecredits')) {
      return 'post_processing'
    }

    // Scraping stage indicators
    if (combinedContext.includes('scrapeurl') ||
        combinedContext.includes('validateurl') ||
        combinedContext.includes('scraper') ||
        errorMessage.includes('URL not accessible')) {
      return 'scraping'
    }

    // AI generation stage indicators
    if (combinedContext.includes('generateschemas') ||
        combinedContext.includes('anthropic') ||
        combinedContext.includes('openai') ||
        combinedContext.includes('aiservice')) {
      return 'ai_generation'
    }

    // Validation stage indicators
    if (combinedContext.includes('validate') ||
        combinedContext.includes('validatemultipleschemas') ||
        errorMessage.includes('No schemas could be generated or passed validation')) {
      return 'validation'
    }

    // Post-processing stage indicators (generic)
    if (combinedContext.includes('updateschemageneration') ||
        combinedContext.includes('database')) {
      return 'post_processing'
    }

    // Default to unknown stage
    return 'unknown'
  }

  // Public method to calculate schema score
  calculateSchemaScore(schemas: JsonLdSchema[]): any {
    return this.calculateBasicScore(schemas)
  }

  // Calculate a comprehensive score for schemas
  private calculateBasicScore(schemas: JsonLdSchema[]): any {
    const schema = schemas[0] // For now, score the first schema
    const schemaType = schema['@type']

    let requiredProps = 0
    let recommendedProps = 0
    let advancedAEOFeatures = 0
    let contentQuality = 0

    // REQUIRED PROPERTIES (Max 100 points)
    if (schema['@context']) requiredProps += 33
    if (schema['@type']) requiredProps += 33
    if (schema['name'] || schema['headline']) requiredProps += 34

    // RECOMMENDED PROPERTIES (Max 100 points)
    let recommendedCount = 0
    const recommendedProperties = [
      'description', 'url', 'image', 'author', 'publisher',
      'datePublished', 'dateModified'
    ]

    recommendedProperties.forEach(prop => {
      if (schema[prop]) recommendedCount++
    })
    recommendedProps = Math.round((recommendedCount / recommendedProperties.length) * 100)

    // ADVANCED AEO FEATURES (Max 100 points)
    let aeoCount = 0
    const aeoProperties = [
      'keywords', 'about', 'mentions', 'sameAs', 'speakable',
      'inLanguage', 'articleSection', 'wordCount', 'isPartOf',
      'mainEntityOfPage', 'aggregateRating', 'review'
    ]

    aeoProperties.forEach(prop => {
      if (schema[prop]) aeoCount++
    })
    advancedAEOFeatures = Math.round((aeoCount / aeoProperties.length) * 100)

    // CONTENT QUALITY (Max 100 points)
    let qualityScore = 0

    // Check description quality
    if (schema['description']) {
      const descLength = schema['description'].length
      if (descLength >= 50 && descLength <= 160) qualityScore += 20
      else if (descLength > 0) qualityScore += 10
    }

    // Check for structured author
    if (schema['author'] && typeof schema['author'] === 'object') {
      qualityScore += 15
      if (schema['author'].sameAs) qualityScore += 10
    } else if (schema['author']) {
      qualityScore += 10
    }

    // Check for structured publisher
    if (schema['publisher'] && typeof schema['publisher'] === 'object') {
      qualityScore += 15
      if (schema['publisher'].logo) qualityScore += 10
    }

    // Check for image with details
    if (schema['image']) {
      qualityScore += 10
      if (typeof schema['image'] === 'object' || Array.isArray(schema['image'])) {
        qualityScore += 10
      }
    }

    // Check for keywords
    if (schema['keywords']) {
      if (Array.isArray(schema['keywords']) && schema['keywords'].length > 0) {
        qualityScore += 10
      } else if (typeof schema['keywords'] === 'string' && schema['keywords'].length > 0) {
        qualityScore += 5
      }
    }

    contentQuality = Math.min(qualityScore, 100)

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (requiredProps * 0.35) +        // 35% weight on required properties
      (recommendedProps * 0.25) +     // 25% weight on recommended properties
      (advancedAEOFeatures * 0.25) +  // 25% weight on AEO features
      (contentQuality * 0.15)         // 15% weight on content quality
    )

    console.log(`📊 Schema Score Breakdown:`)
    console.log(`   Required: ${requiredProps}/100`)
    console.log(`   Recommended: ${recommendedProps}/100`)
    console.log(`   Advanced AEO: ${advancedAEOFeatures}/100`)
    console.log(`   Content Quality: ${contentQuality}/100`)
    console.log(`   Overall: ${overallScore}/100`)

    return {
      overallScore,
      breakdown: {
        requiredProperties: requiredProps,
        recommendedProperties: recommendedProps,
        advancedAEOFeatures: advancedAEOFeatures,
        contentQuality: contentQuality
      },
      suggestions: [],
      strengths: [],
      actionItems: []
    }
  }

  // Check if requested schema type is compatible with page content
  // This prevents wasted AI calls when content clearly doesn't match
  private checkSchemaTypeCompatibility(
    requestedType: string,
    analysis: ContentAnalysis
  ): CompatibilityResult {
    const metadata = analysis.metadata

    // Get content analysis which includes hasVideoContent from enhanced video detection
    const contentAnalysis = (metadata as any)?.contentAnalysis

    // Debug logging for video detection
    console.log('🔍 [Pre-validation] Content analysis check:', {
      requestedType,
      hasMetadataVideos: metadata?.videos && metadata.videos.length > 0,
      videosCount: metadata?.videos?.length || 0,
      hasVideoContent: contentAnalysis?.hasVideoContent,
      contentAnalysisType: contentAnalysis?.type
    })

    switch (requestedType) {
      case 'VideoObject':
        // Check for video content: embedded videos from multiple providers
        // Uses enhanced detection: YouTube, Vimeo, Wistia, HubSpot, Vidyard, Brightcove, etc.
        const hasVideos = (metadata?.videos && metadata.videos.length > 0) || contentAnalysis?.hasVideoContent
        console.log('🎬 [VideoObject check] hasVideos:', hasVideos)
        if (!hasVideos) {
          return {
            isCompatible: false,
            reason: 'This page does not contain video content. No video embeds (YouTube, Vimeo, Wistia, HubSpot, Vidyard, etc.) were detected.',
            suggestions: ['WebPage', 'Organization', 'Service']
          }
        }
        break

      case 'FAQPage':
        // Check for FAQ content: Q&A pairs or FAQ class patterns
        const hasFAQ = (metadata?.faqContent && metadata.faqContent.length > 0) || contentAnalysis?.hasFaqContent
        if (!hasFAQ) {
          return {
            isCompatible: false,
            reason: 'This page does not contain FAQ-formatted content. No question/answer pairs were detected in the page structure.',
            suggestions: ['Article', 'WebPage', 'BlogPosting']
          }
        }
        break

      case 'Product':
        // Check for product content: prices, product info
        const hasProduct = metadata?.productInfo
        if (!hasProduct) {
          return {
            isCompatible: false,
            reason: 'This page does not appear to be a product page. No product information, pricing, or e-commerce elements were detected.',
            suggestions: ['WebPage', 'Service', 'Organization']
          }
        }
        break

      case 'Event':
        // Check for event content: dates, times, locations
        const hasEvent = metadata?.eventInfo
        if (!hasEvent) {
          return {
            isCompatible: false,
            reason: 'This page does not contain event information. No event dates, times, or venue details were detected.',
            suggestions: ['WebPage', 'Article', 'Organization']
          }
        }
        break

      case 'Recipe':
        // Check for recipe content via URL patterns
        const isRecipeUrl = analysis.url.toLowerCase().includes('/recipe')
        if (!isRecipeUrl) {
          return {
            isCompatible: false,
            reason: 'This page does not appear to be a recipe page. Recipe schema requires structured cooking instructions, ingredients, and preparation details.',
            suggestions: ['Article', 'HowTo', 'WebPage']
          }
        }
        break

      case 'LocalBusiness':
        // Check for business contact info
        const hasBusinessInfo = metadata?.businessInfo?.address || metadata?.contactInfo
        if (!hasBusinessInfo) {
          return {
            isCompatible: false,
            reason: 'This page does not contain local business information. No physical address or contact details were detected.',
            suggestions: ['Organization', 'WebPage', 'Service']
          }
        }
        break

      case 'ImageObject':
        // Check for images
        const hasImages = (metadata?.images && metadata.images.length > 0) || metadata?.imageInfo?.featuredImage
        if (!hasImages) {
          return {
            isCompatible: false,
            reason: 'This page does not contain meaningful image content for ImageObject schema.',
            suggestions: ['WebPage', 'Article', 'Organization']
          }
        }
        break

      // These types are generally safe for any page
      case 'WebPage':
      case 'Organization':
      case 'Article':
      case 'BlogPosting':
      case 'Service':
      case 'Person':
      case 'BreadcrumbList':
      case 'Auto':
        // These are always compatible
        break

      default:
        // For unknown types, allow the AI to try
        console.log(`⚠️ No compatibility check defined for type: ${requestedType}`)
        break
    }

    return { isCompatible: true, reason: '', suggestions: [] }
  }

  // Generate HTML script tags for easy copy-pasting into <head>
  private generateHtmlScriptTags(schemas: JsonLdSchema[]): string {
    // Generate individual script tags for each schema
    const scriptTags = schemas.map(schema => {
      const schemaJson = JSON.stringify(schema, null, 2)
      return `<script type="application/ld+json">
${schemaJson}
</script>`
    }).join('\n\n')

    return `<!-- Add this to your website's <head> section - Generated by SuperSchema.ai -->\n${scriptTags}`
  }
}

export const schemaGeneratorService = new SchemaGeneratorService()