import { scraperService } from './scraper.js'
import { openaiService, type SchemaGenerationOptions } from './openai.js'
import { validatorService } from './validator.js'
import { db } from './database.js'
import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'

export interface SchemaGenerationResult {
  success: boolean
  schemas: JsonLdSchema[]
  htmlScriptTags?: string  // HTML-ready script tags for easy copy-pasting
  highlightedChanges?: string[]  // List of changes made during refinement
  validationResults: any[]
  metadata: {
    schemaId?: string  // Schema generation record ID for linking
    url: string
    processingTimeMs: number
    creditsUsed: number
    errorMessage?: string
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
}

class SchemaGeneratorService {
  async generateSchemas(request: GenerationRequest): Promise<SchemaGenerationResult> {
    const startTime = Date.now()
    let generationId: string | null = null

    try {
      // 1. Validate URL accessibility
      const urlValidation = await scraperService.validateUrl(request.url)
      if (!urlValidation.isValid) {
        throw new Error(`URL not accessible: ${urlValidation.error}`)
      }

      // 2. Check if user has sufficient credits (skip in localhost/development)
      const isLocalhost = process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL

      if (!isLocalhost) {
        const user = await db.getUser(request.userId)
        if (!user || user.creditBalance < 1) {
          throw new Error('Insufficient credits')
        }
      } else {
        console.log('🚀 Development mode: Skipping credit check for localhost testing')
      }

      // 3. Create schema generation record
      generationId = await db.createSchemaGeneration(request.userId, request.url, 1)

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

      // 7. Generate schemas using AI
      const schemas = await openaiService.generateSchemas(contentAnalysis, request.options)

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

      // 9. Consume credits only on successful generation (skip in localhost/development)
      if (!isLocalhost) {
        const creditsConsumed = await db.consumeCredits(
          request.userId,
          1,
          `Schema generation for ${request.url}`
        )

        if (!creditsConsumed) {
          throw new Error('Failed to consume credits')
        }
      } else {
        console.log('🚀 Development mode: Skipping credit consumption for localhost testing')
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

      await db.updateSchemaGeneration(generationId, {
        schemas: schemasToUse,
        status: 'success',
        processingTimeMs: processingTime,
        schemaScore: schemaScore
      })

      console.log(`💾 Database update: Saving ${schemasToUse.length} schemas with quality score`)

      // Generate HTML-ready script tags for easy copy-pasting
      const htmlScriptTags = this.generateHtmlScriptTags(schemasToUse)

      return {
        success: true,
        schemas: schemasToUse,
        htmlScriptTags, // Add HTML-ready version for easy copy-paste
        schemaScore, // Add schema quality score
        validationResults,
        metadata: {
          schemaId: generationId, // Include schema ID for linking to library
          url: request.url,
          processingTimeMs: processingTime,
          creditsUsed: isLocalhost ? 0 : 1,
          contentAnalysis: contentAnalysis,
          contentQualitySuggestions: (contentAnalysis as any).contentQualitySuggestions || []
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Update generation record with failure (if record was created)
      if (generationId) {
        await db.updateSchemaGeneration(generationId, {
          status: 'failed',
          errorMessage,
          processingTimeMs: processingTime
        })
      }

      console.error('Schema generation error:', {
        userId: request.userId,
        url: request.url,
        error: errorMessage,
        processingTime
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
      // Use AI to refine the existing schemas
      const { schemas: refinedSchemas, changes } = await openaiService.refineSchemas(schemas, url, options)

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

  // Generate HTML script tags for easy copy-pasting into <head>
  private generateHtmlScriptTags(schemas: JsonLdSchema[]): string {
    // Generate individual script tags for each schema
    const scriptTags = schemas.map(schema => {
      const schemaJson = JSON.stringify(schema, null, 2)
      return `<script type="application/ld+json">
${schemaJson}
</script>`
    }).join('\n\n')

    return scriptTags
  }
}

export const schemaGeneratorService = new SchemaGeneratorService()