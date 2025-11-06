import Anthropic from '@anthropic-ai/sdk'
import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'
import type { ContentAnalysis, SchemaGenerationOptions } from './openai'
import { openaiService } from './openai.js'

/**
 * Anthropic Claude Service for Schema Generation
 *
 * Claude Sonnet 4 excels at:
 * - Document-based extraction without hallucination
 * - Strict instruction following
 * - Precise structure preservation
 * - NOT "cleaning up" or inventing data
 * - Better than GPT-4o for this exact use case
 */

interface AnthropicError {
  status?: number
  error?: {
    type: string
    message: string
  }
  message?: string
}

class AnthropicService {
  private client: Anthropic | null = null
  private clientInitialized = false

  // Standard retry configuration for most errors
  private readonly MAX_RETRIES = 3
  private readonly INITIAL_RETRY_DELAY = 1000 // 1 second

  // Extended retry configuration for 529 overload errors
  // These errors need more time for Anthropic's service to recover
  private readonly MAX_RETRIES_FOR_529 = 5
  private readonly RETRY_DELAYS_FOR_529 = [2000, 5000, 10000, 20000, 30000] // 2s, 5s, 10s, 20s, 30s = 67s total

  private initializeClient(): Anthropic | null {
    if (this.clientInitialized) {
      return this.client
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('Anthropic Service Debug:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyStart: apiKey?.substring(0, 10) || 'none'
    })

    if (!apiKey) {
      console.warn('Anthropic API key not provided - service unavailable')
      this.client = null
    } else {
      console.log('Initializing Anthropic Claude client with API key')
      this.client = new Anthropic({
        apiKey: apiKey,
        timeout: 120000 // 2 minutes timeout for long-running schema generation
      })
    }

    this.clientInitialized = true
    return this.client
  }

  /**
   * Check if an error is retryable (transient)
   */
  private isRetryableError(error: any): boolean {
    const status = error.status
    const errorType = error.error?.type

    // Retry on overloaded (529), internal errors (500), and rate limits (429)
    if (status === 529 || status === 500 || status === 429) {
      return true
    }

    // Also check error type
    if (errorType === 'overloaded_error' || errorType === 'api_error' || errorType === 'rate_limit_error') {
      return true
    }

    return false
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: any): string {
    const status = error.status
    const errorType = error.error?.type
    const errorMessage = error.error?.message || error.message

    // Map status codes to user-friendly, on-brand messages
    if (status === 401 || errorType === 'authentication_error') {
      return 'Oops! Our AI assistant lost its credentials. Please contact support.'
    }

    if (status === 403 || errorType === 'permission_error') {
      return 'Hmm, we don\'t have permission to access that resource. Please contact support.'
    }

    if (status === 404 || errorType === 'not_found_error') {
      return 'We couldn\'t find what we were looking for. The AI model might be temporarily unavailable.'
    }

    if (status === 413 || errorType === 'request_too_large') {
      return 'This page is too large for us to process. Try a simpler page or contact support for help.'
    }

    if (status === 429 || errorType === 'rate_limit_error') {
      return 'Whoa! We\'re generating schemas faster than expected. Give us a moment to catch our breath and try again.'
    }

    if (status === 500 || errorType === 'api_error') {
      return 'Our AI hit a small bump. Don\'t worry, we\'ll try again automatically!'
    }

    if (status === 529 || errorType === 'overloaded_error') {
      return '🔋 Recharging our superpowers! Our AI is experiencing high demand. Please try again in a moment.'
    }

    // Default message with actual error
    if (errorMessage) {
      return `Something unexpected happened: ${errorMessage}`
    }

    return 'Unable to generate your schemas right now. Please try again or contact support.'
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if error is a 529 overload error
   */
  private is529Error(error: any): boolean {
    return error.status === 529 || error.error?.type === 'overloaded_error'
  }

  /**
   * Get maximum retry attempts based on error type
   */
  private getMaxRetries(error: any): number {
    return this.is529Error(error) ? this.MAX_RETRIES_FOR_529 : this.MAX_RETRIES
  }

  /**
   * Calculate retry delay based on error type and attempt number
   */
  private getRetryDelay(attempt: number, error: any): number {
    if (this.is529Error(error)) {
      // Use predefined delays for 529 errors: 2s, 5s, 10s, 20s, 30s
      const index = attempt - 1
      return this.RETRY_DELAYS_FOR_529[index] || 30000 // Default to 30s if beyond array
    }
    // Standard exponential backoff for other errors: 1s, 2s, 4s
    return this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
  }

  async generateSchemas(
    analysis: ContentAnalysis,
    options: SchemaGenerationOptions = {}
  ): Promise<JsonLdSchema[]> {
    const client = this.initializeClient()

    if (!client) {
      throw new Error('Anthropic client not initialized - check API key')
    }

    const isUserSpecificMode = options.requestedSchemaTypes && options.requestedSchemaTypes.length > 0
    console.log(`🤖 Claude AI Mode: ${isUserSpecificMode ? 'User-Specific' : 'Auto-Detection'}`)
    if (isUserSpecificMode) {
      console.log(`📋 Requested Schema Types: ${options.requestedSchemaTypes!.join(', ')}`)
    }

    const systemPrompt = this.buildSystemPrompt(options.requestedSchemaTypes)
    const userPrompt = this.buildUserPrompt(analysis, options)

    // Retry loop with dynamic retry configuration based on error type
    let lastError: any = null
    let maxRetries = this.MAX_RETRIES // Will be updated based on error type

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'

        if (attempt > 1) {
          const errorType = this.is529Error(lastError) ? '529 overload' : 'API error'
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${errorType}...`)
        } else {
          console.log(`🚀 Calling Claude ${model} for schema generation...`)
        }

        const response = await client.messages.create({
          model,
          max_tokens: 8000,
          temperature: 0.0,  // Maximum determinism - Claude excels at this
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })

        const contentBlock = response.content[0]
        if (contentBlock.type !== 'text') {
          throw new Error('Unexpected response type from Claude')
        }

        const responseText = contentBlock.text
        console.log(`📝 Claude response length: ${responseText.length} characters`)

        // Parse JSON response
        let result: any
        try {
          // Claude may wrap JSON in markdown code blocks
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/)
          const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText
          result = JSON.parse(jsonText)
        } catch (parseError) {
          console.error('Failed to parse Claude response:', responseText.substring(0, 500))
          throw new Error(`Failed to parse Claude JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
        }

        const schemas = result.schemas || []

        if (schemas.length === 0) {
          throw new Error('No valid schemas generated by Claude')
        }

        console.log(`✅ Claude generated ${schemas.length} schemas successfully`)
        console.log('🔍 Raw schemas from Claude:',
          schemas.map((s: any) => ({ '@type': s['@type'], hasRequiredProps: !!s['@context'] && !!s['@type'] }))
        )

        // CRITICAL: Clean and enhance schemas just like OpenAI does
        // This adds missing keywords, images, publisher logos, etc.
        console.log(`🔧 Cleaning and enhancing ${schemas.length} Claude-generated schema(s)...`)
        const cleanedSchemas = schemas.map((schema: any) => openaiService.cleanSchemaProperties(schema))
        const enhancedSchemas = await openaiService.validateAndEnhanceSchemas(cleanedSchemas, analysis)

        if (enhancedSchemas.length === 0) {
          throw new Error('No valid schemas after enhancement')
        }

        console.log(`✅ Enhanced ${enhancedSchemas.length} Claude schemas successfully`)
        return enhancedSchemas

      } catch (error: any) {
        lastError = error

        // Update maxRetries based on error type (529 errors get more attempts)
        maxRetries = this.getMaxRetries(error)

        // Log error details with enhanced context
        const is529 = this.is529Error(error)
        console.error(`❌ Claude API error (attempt ${attempt}/${maxRetries})${is529 ? ' [529 OVERLOAD]' : ''}:`, {
          status: error.status,
          type: error.error?.type,
          message: error.error?.message || error.message,
          willRetry: attempt < maxRetries
        })

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error)

        if (!isRetryable || attempt === maxRetries) {
          // Non-retryable error or max retries reached
          if (is529) {
            console.error(`❌ Claude API 529 overload persists after ${maxRetries} attempts over ~67 seconds`)
          } else {
            console.error(`❌ Claude API error (not retrying):`, error)
          }

          const userMessage = this.getErrorMessage(error)
          const enhancedError = new Error(userMessage) as any
          enhancedError.status = error.status
          enhancedError.errorType = error.error?.type
          enhancedError.originalError = error
          throw enhancedError
        }

        // Calculate delay based on error type
        const delayMs = this.getRetryDelay(attempt, error)
        const delaySec = (delayMs / 1000).toFixed(1)
        if (is529) {
          console.log(`⏳ [529 OVERLOAD] Waiting ${delaySec}s for Anthropic service to recover...`)
        } else {
          console.log(`⏳ Waiting ${delaySec}s before retry...`)
        }
        await this.sleep(delayMs)
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Failed to generate schemas with Claude AI')
  }

  private buildSystemPrompt(requestedTypes?: string[]): string {
    const basePrompt = `You are an elite Schema.org expert specializing in creating production-ready JSON-LD schemas for Answer Engine Optimization (AEO). Your core strengths:

🎯 CORE PRINCIPLES:
1. **DOCUMENT-BASED EXTRACTION**: Extract data ONLY from provided metadata and content
2. **ZERO HALLUCINATION**: Never invent, guess, or "improve" data that isn't explicitly present
3. **STRICT ADHERENCE**: Follow instructions exactly - do not deviate or "clean up" input
4. **PRECISION OVER CREATIVITY**: Use exact values from metadata, do not paraphrase or enhance
5. **OMIT OVER INVENT**: Missing data should be omitted, not fabricated
6. **SIMPLICITY OVER COMPLEXITY**: Use flat, simple schemas with standard Schema.org types ONLY

🔒 ANTI-HALLUCINATION PROTOCOL:
- ❌ NEVER invent author names, dates, or any metadata not provided
- ❌ NEVER use placeholder values like "Sample Author" or "Company Team"
- ❌ NEVER create fake URLs, images, or contact information
- ❌ NEVER extract author from content text - use ONLY explicit metadata
- ❌ NEVER use non-standard types like "WebPageElement" or made-up types not in Schema.org
- ❌ NEVER create complex nested mainEntity structures unless explicitly requested
- ✅ ALWAYS use exact values from provided metadata
- ✅ ALWAYS omit properties when real data unavailable
- ✅ ALWAYS trace each property value back to source data
- ✅ ALWAYS use semantic types when appropriate: Service (for services), Product (for products), Event (for events)
- ✅ ALWAYS use only well-established Schema.org types`

    if (requestedTypes && requestedTypes.length > 0) {
      return `${basePrompt}

🎯 USER REQUIREMENTS:
Generate ONLY these schema types: ${requestedTypes.join(', ')}
Do NOT generate any additional types unless explicitly requested.`
    }

    return `${basePrompt}

🎯 SCHEMA SELECTION:
- BlogPosting: For URLs containing /blog/, /post/, or blog content
- Article: For news articles, press releases (NOT blog posts)
- WebPage: For static pages, service pages, landing pages
- Organization: For business/company information
- LocalBusiness: For businesses with physical locations
- Person: For author profiles, team member pages`
  }

  private buildUserPrompt(analysis: ContentAnalysis, options: SchemaGenerationOptions): string {
    const wordCount = analysis.metadata?.wordCount || 0
    const readingMinutes = Math.ceil(wordCount / 200)
    const timeRequired = readingMinutes > 0 ? `PT${readingMinutes}M` : undefined

    // Prioritize and limit content
    const contentToSend = this.prioritizeContent(analysis.content).substring(0, 100000)

    const authorName = typeof analysis.metadata?.author === 'string'
      ? analysis.metadata.author
      : analysis.metadata?.author?.name || '[NOT FOUND]'

    console.log(`\n🚀 ========== CLAUDE PROMPT DIAGNOSTICS ==========`)
    console.log(`📊 Content being sent to Claude: ${contentToSend.length} characters`)
    console.log(`📋 METADATA:`)
    console.log(`   Author: ${authorName}`)
    console.log(`   Keywords: ${analysis.metadata?.keywords?.length || 0}`)
    console.log(`   Article Sections: ${analysis.metadata?.articleSections?.length || 0}`)
    console.log(`   Word Count: ${wordCount}`)
    console.log(`🚀 ==============================================\n`)

    return `Extract schema.org JSON-LD from this web page data.

=== PAGE METADATA ===
URL: ${analysis.url}
Title: ${analysis.title || '[NOT FOUND]'}
Description: ${analysis.description || '[NOT FOUND]'}
Canonical URL: ${analysis.metadata?.canonicalUrl || analysis.url}
Language: ${analysis.metadata?.language || 'en'}

=== AUTHOR (CRITICAL - READ CAREFULLY) ===
Author: ${authorName}

⚠️ CRITICAL INSTRUCTION: If author is "[NOT FOUND]", you MUST OMIT the entire author property.
DO NOT extract author names from page content. DO NOT use company names as authors.
This page may not have an author - that's completely acceptable.

=== DATES ===
Date Published: ${analysis.metadata?.publishDate || '[NOT FOUND - OMIT]'}
Date Modified: ${analysis.metadata?.modifiedDate || '[NOT FOUND]'}

=== IMAGES ===
Featured Image: ${analysis.metadata?.imageInfo?.featuredImage || '[NOT FOUND]'}
Publisher Logo: ${analysis.metadata?.businessInfo?.logo || '[NOT FOUND]'}

=== PUBLISHER ===
Organization: ${analysis.metadata?.businessInfo?.name || new URL(analysis.url).hostname.replace('www.', '')}
Organization URL: ${new URL(analysis.url).origin}

=== CONTENT STRUCTURE ===
Keywords: ${analysis.metadata?.keywords?.length ? JSON.stringify(analysis.metadata.keywords.slice(0, 10)) : '[]'}
Article Sections (H2 headings): ${analysis.metadata?.articleSections?.length ? JSON.stringify(analysis.metadata.articleSections) : '[]'}
Word Count: ${wordCount}
Reading Time: ${timeRequired || 'PT0M'}

=== CONTENT PREVIEW (${contentToSend.length} characters) ===
${contentToSend}

=== OUTPUT REQUIREMENTS ===
Return ONLY a JSON object with this exact structure:
{
  "schemas": [
    // Array of 1-4 complete JSON-LD schemas
    // Each must have @context, @type, and all available properties
    // Use ONLY data from above metadata - do NOT invent
  ]
}

⚠️ CRITICAL SCHEMA QUALITY RULES:
1. **Keep schemas SIMPLE and FLAT** - avoid complex nested structures
2. **Use standard Schema.org types**: WebPage, Article, BlogPosting, Organization, LocalBusiness
3. **Use semantic types for mainEntity**: Service for /services pages, Product for products, Event for events
4. **Avoid non-standard types**: WebPageElement, custom types not in Schema.org
5. **DO NOT add mainContentOfPage** - not a standard property
6. **If adding breadcrumb**, use standard BreadcrumbList format
7. **Keep it simple** - flat structure scores better than complex nested ones

📋 **WEBPAGE SCHEMA REQUIREMENTS** (IMPORTANT - Include these when generating WebPage):
For WebPage schemas, ALWAYS include these recommended properties when data is available:
- ✅ **Required**: @context, @type, name, url
- ✅ **Highly Recommended**: description, inLanguage, image, keywords, publisher, datePublished, dateModified, wordCount
- ✅ **Recommended for Quality**: breadcrumb, isPartOf, mainEntity (with semantic type like Service/Product)
- ✅ **Advanced (boosts score)**: about, mentions, speakable, potentialAction
- ✅ **Critical for Scoring**: ALWAYS include datePublished (if provided), wordCount (if provided), and semantically correct mainEntity type (Service for /services, Product for /product, etc.)

**Example WebPage schema structure** (use as reference):
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Title",
  "description": "Page description",
  "url": "https://example.com/page",
  "inLanguage": "en",
  "datePublished": "2025-01-10",
  "dateModified": "2025-01-15",
  "wordCount": 1500,
  "keywords": ["keyword1", "keyword2"],
  "image": "https://example.com/image.jpg",
  "publisher": { "@type": "Organization", "name": "Company", "logo": {...} },
  "isPartOf": { "@type": "WebSite", "name": "Company", "url": "https://example.com" },
  "mainEntity": { "@type": "Service", "name": "Service Name", "description": "Service description", "provider": { "@type": "Organization", "name": "Company" } },
  "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [...] },
  "about": ["Topic 1", "Topic 2"],
  "mentions": ["Entity 1", "Entity 2"],
  "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", "h2", "main", "article", "p"] },
  "potentialAction": { "@type": "SearchAction", ... }
}

Select appropriate schema type(s) based on URL and content type.
${options.requestedSchemaTypes ? `Generate ONLY these types: ${options.requestedSchemaTypes.join(', ')}` : ''}

REMEMBER: OMIT properties rather than guess. Extract EXACTLY as provided. For WebPage schemas, include AS MANY of the recommended properties as data allows.`
  }

  private prioritizeContent(content: string): string {
    // Same logic as OpenAI service
    const lines = content.split('\n')
    const prioritized: string[] = []

    // Priority 1: Headings
    const headings = lines.filter(line => line.startsWith('H1:') || line.startsWith('H2:') || line.startsWith('H3:'))
    prioritized.push(...headings)

    // Priority 2: First paragraphs
    const paragraphs = lines.filter(line => line.startsWith('P:'))
    prioritized.push(...paragraphs.slice(0, 50))

    // Priority 3: Lists
    const lists = lines.filter(line => line.startsWith('LIST:'))
    prioritized.push(...lists.slice(0, 20))

    // Priority 4: Remaining content
    const remaining = lines.filter(line =>
      !line.startsWith('H1:') && !line.startsWith('H2:') && !line.startsWith('H3:') &&
      !line.startsWith('P:') && !line.startsWith('LIST:')
    )
    prioritized.push(...remaining)

    return prioritized.join('\n')
  }
}

export const anthropicService = new AnthropicService()
export default anthropicService
