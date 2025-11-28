import OpenAI from 'openai'
import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'
import { validateRefinedSchema } from './schemaValidator.js'
import { sanitizeSchemaProperties } from './schemaPropertyWhitelist.js'

// Enhanced interfaces for comprehensive AEO metadata
export interface AuthorInfo {
  name: string
  url?: string
  email?: string
  jobTitle?: string
  worksFor?: string
  image?: string
  bio?: string
  socialProfiles?: string[]
}

export interface BusinessInfo {
  name: string
  type?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  contactPoint?: {
    telephone?: string
    email?: string
    contactType?: string
  }
  url?: string
  logo?: string
  sameAs?: string[]
}

export interface FAQ {
  question: string
  answer: string
}

export interface ContentAnalysis {
  title?: string
  description?: string
  content: string
  url: string
  metadata?: {
    // Core metadata (existing)
    author?: string | AuthorInfo
    publishDate?: string
    modifiedDate?: string
    images?: string[]
    videos?: string[] | Array<{
      url: string
      embedUrl?: string
      provider?: string
      title?: string
      description?: string
      thumbnailUrl?: string
      duration?: string
      width?: number
      height?: number
    }>
    breadcrumbs?: Array<{ name: string; url?: string }>
    contactInfo?: any
    businessInfo?: BusinessInfo
    productInfo?: any
    eventInfo?: any

    // Enhanced AEO metadata
    language?: string
    wordCount?: number
    articleSection?: string
    articleSections?: string[]  // Array of H2 headings
    keywords?: string[]
    entities?: string[]
    mentions?: string[]
    categories?: string[]
    tags?: string[]

    // Structured content
    faqContent?: FAQ[]
    headings?: string[]
    jsonLdData?: any[]

    // Image metadata
    imageInfo?: {
      featuredImage?: string
      featuredImageAlt?: string
      imageCount?: number
      allImages?: Array<{
        url: string
        alt?: string
        caption?: string
      }>
    }

    // Content analysis
    contentType?: 'article' | 'blog' | 'news' | 'product' | 'service' | 'about' | 'contact' | 'home'
    readingTime?: number
    socialUrls?: string[]

    // Technical metadata
    canonicalUrl?: string
    alternateLanguages?: Array<{
      lang: string
      url: string
    }>

    // Business/Organization specific
    openingHours?: string
    priceRange?: string

    // Review/Rating data
    reviews?: Array<{
      rating: number
      author: string
      text: string
      date?: string
    }>
    aggregateRating?: {
      ratingValue: number
      reviewCount: number
      bestRating?: number
      worstRating?: number
    }

    // Enhanced HTML processing metrics (from new HTML cleaning service)
    originalLength?: number
    processedLength?: number
    tokenEstimate?: number
    contentHierarchy?: any[]

    // Enhanced metadata from HTML cleaning service
    openGraph?: any
    twitterCard?: any
    existingJsonLd?: any[]
    technical?: any

    // Content analysis for pre-validation (hasVideoContent, hasFaqContent, etc.)
    contentAnalysis?: {
      type: 'article' | 'product' | 'homepage' | 'about' | 'contact' | 'blog' | 'news' | 'faq' | 'unknown'
      wordCount: number
      readingTime: number
      hasVideoContent: boolean
      hasFaqContent: boolean
      hasProductContent: boolean
      hasContactInfo: boolean
    }
  }
}

export interface SchemaGenerationOptions {
  includeImages?: boolean
  includeVideos?: boolean
  includeProducts?: boolean
  includeEvents?: boolean
  includeArticles?: boolean
  includeOrganization?: boolean
  includeLocalBusiness?: boolean
  requestedSchemaTypes?: string[]
}

// Schema property requirements for AEO optimization
export interface SchemaPropertyRequirements {
  required: string[]
  recommended: string[]
  advanced: string[]
  description: string
}

export const SCHEMA_PROPERTY_TEMPLATES: Record<string, SchemaPropertyRequirements> = {
  BlogPosting: {
    required: ['@context', '@type', 'headline', 'datePublished', 'dateModified', 'author', 'publisher', 'mainEntityOfPage'],
    recommended: ['description', 'image', 'keywords', 'articleSection', 'inLanguage', 'wordCount', 'timeRequired', 'isPartOf'],
    advanced: ['potentialAction', 'interactionStatistic', 'review', 'about', 'mentions'],
    description: 'Blog post content optimized for AI search engines (ChatGPT quality)'
  },
  Article: {
    required: ['@context', '@type', 'headline', 'datePublished', 'author', 'publisher', 'mainEntityOfPage'],
    recommended: ['description', 'dateModified', 'image', 'keywords', 'articleSection', 'inLanguage', 'articleBody', 'about', 'mentions'],
    advanced: ['potentialAction', 'interactionStatistic', 'review', 'isPartOf', 'wordCount'],
    description: 'General article content with comprehensive metadata'
  },
  WebPage: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['description', 'inLanguage', 'image', 'keywords', 'isPartOf', 'mainEntity', 'breadcrumb', 'publisher', 'dateModified'],
    advanced: ['potentialAction', 'significantLink', 'relatedLink', 'about', 'mentions'],
    description: 'Web page with rich metadata for better discovery'
  },
  Organization: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['logo', 'description', 'contactPoint', 'address', 'sameAs', 'founder'],
    advanced: ['brand', 'parentOrganization', 'subOrganization', 'award', 'knowsAbout'],
    description: 'Business or organization information'
  },
  LocalBusiness: {
    required: ['@context', '@type', 'name', 'address', 'telephone'],
    recommended: ['url', 'description', 'openingHours', 'priceRange', 'image', 'geo'],
    advanced: ['aggregateRating', 'review', 'paymentAccepted', 'currenciesAccepted', 'areaServed'],
    description: 'Local business with location and contact information'
  },
  FAQPage: {
    required: ['@context', '@type', 'mainEntity'],
    recommended: ['name', 'description'],
    advanced: ['about', 'audience', 'keywords'],
    description: 'Frequently asked questions page'
  },
  BreadcrumbList: {
    required: ['@context', '@type', 'itemListElement'],
    recommended: ['name', 'description'],
    advanced: ['numberOfItems'],
    description: 'Navigation breadcrumb trail'
  },
  ImageObject: {
    required: ['@context', '@type', 'url'],
    recommended: ['description', 'name', 'contentUrl', 'width', 'height'],
    advanced: ['caption', 'exifData', 'representativeOfPage'],
    description: 'Image with metadata'
  },
  Person: {
    required: ['@context', '@type', 'name'],
    recommended: ['url', 'image', 'jobTitle', 'worksFor', 'description'],
    advanced: ['sameAs', 'knowsAbout', 'alumniOf', 'award'],
    description: 'Person or author information'
  },
  VideoObject: {
    required: ['@context', '@type', 'name', 'description', 'contentUrl'],
    recommended: ['thumbnailUrl', 'duration', 'uploadDate', 'publisher'],
    advanced: ['transcript', 'caption', 'interactionStatistic'],
    description: 'Video content with metadata'
  }
}

class OpenAIService {
  private client: OpenAI | null = null
  private clientInitialized = false

  private initializeClient(): OpenAI | null {
    if (this.clientInitialized) {
      return this.client
    }

    const apiKey = process.env.OPENAI_API_KEY
    console.log('OpenAI Service Debug:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyStart: apiKey?.substring(0, 10) || 'none'
    })

    if (!apiKey) {
      console.warn('OpenAI API key not provided - using mock responses for development')
      this.client = null
    } else {
      console.log('Initializing OpenAI client with API key')
      this.client = new OpenAI({
        apiKey: apiKey
      })
    }

    this.clientInitialized = true
    return this.client
  }

  async generateSchemas(
    analysis: ContentAnalysis,
    options: SchemaGenerationOptions = {}
  ): Promise<JsonLdSchema[]> {
    // Initialize client lazily
    const client = this.initializeClient()

    // Return mock schemas for development when no API key is provided
    if (!client) {
      return this.getMockSchemas(analysis, options)
    }

    // Check if user has requested specific schema types
    const isUserSpecificMode = options.requestedSchemaTypes && options.requestedSchemaTypes.length > 0
    console.log(`🤖 AI Mode: ${isUserSpecificMode ? 'User-Specific' : 'Auto-Detection'}`)
    if (isUserSpecificMode) {
      console.log(`📋 Requested Schema Types: ${options.requestedSchemaTypes!.join(', ')}`)
    }

    const prompt = this.buildPrompt(analysis, options)
    const systemPrompt = isUserSpecificMode
      ? this.getUserSpecificSystemPrompt(options.requestedSchemaTypes!)
      : this.getExpertSystemPrompt()

    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o'

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 6000,
        temperature: 0.0,  // Deterministic output for consistent schema generation
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const result = JSON.parse(content)
      const schemas = result.schemas || []

      if (schemas.length === 0) {
        throw new Error('No valid schemas generated')
      }

      console.log(`Generated ${schemas.length} schemas successfully`)
      console.log('🔍 Raw schemas from OpenAI (before enhancement):',
        schemas.map(s => ({ '@type': s['@type'], hasRequiredProps: !!s['@context'] && !!s['@type'] }))
      )

      // Clean schemas first to remove HTML and fix malformed properties
      const cleanedSchemas = schemas.map(schema => this.cleanSchemaProperties(schema))

      // Validate and enhance schemas using the property completion engine
      const enhancedSchemas = await this.validateAndEnhanceSchemas(cleanedSchemas, analysis)

      if (enhancedSchemas.length === 0) {
        throw new Error('No valid schemas generated after enhancement')
      }

      const schemaTypes = enhancedSchemas.map(s => s['@type']).join(', ')
      console.log(`✅ Generated ${enhancedSchemas.length} enhanced AEO schemas: ${schemaTypes}`)

      // Validate user-specific mode compliance
      if (isUserSpecificMode) {
        const requestedTypes = options.requestedSchemaTypes!
        const generatedTypes = enhancedSchemas.map(s => s['@type'])
        const unauthorizedTypes = generatedTypes.filter(type => !requestedTypes.includes(type))

        if (unauthorizedTypes.length > 0) {
          console.warn(`⚠️ AI generated unauthorized schema types: ${unauthorizedTypes.join(', ')}`)
          console.warn(`📋 User requested: ${requestedTypes.join(', ')}`)
          console.warn(`🤖 AI generated: ${generatedTypes.join(', ')}`)
        } else {
          console.log(`✅ User-specific mode compliance: Generated only requested types`)
        }
      }

      return enhancedSchemas

    } catch (error) {
      console.error('OpenAI schema generation error:', error)
      throw new Error(`Failed to generate schemas: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildPrompt(analysis: ContentAnalysis, options: SchemaGenerationOptions): string {
    // Apply intelligent content prioritization for token optimization
    const prioritizedContent = this.prioritizeContent(analysis.content)

    // Calculate reading time for timeRequired property
    const wordCount = analysis.metadata?.wordCount || 0
    const readingMinutes = Math.ceil(wordCount / 200) // 200 WPM average reading speed
    const timeRequired = readingMinutes > 0 ? `PT${readingMinutes}M` : undefined

    // Use up to 100,000 characters of content for better context (was 3000)
    const contentLimit = 100000
    const contentToSend = prioritizedContent.substring(0, contentLimit)

    console.log(`\n🚀 ========== OPENAI PROMPT DIAGNOSTICS ==========`)
    console.log(`📊 Content being sent to OpenAI: ${contentToSend.length} characters (limit: ${contentLimit})`)
    console.log(`📝 Total content available: ${prioritizedContent.length} characters`)
    console.log(`✂️ Content truncated: ${prioritizedContent.length > contentLimit ? 'YES' : 'NO'}`)
    console.log(`\n📋 METADATA BEING SENT:`)
    const authorName = typeof analysis.metadata?.author === 'string'
      ? analysis.metadata.author
      : analysis.metadata?.author?.name || '[NOT FOUND]'
    console.log(`   Author: ${authorName}`)
    console.log(`   Author object: ${JSON.stringify(analysis.metadata?.author)}`)
    console.log(`   Keywords: ${analysis.metadata?.keywords?.length || 0} keywords`)
    console.log(`   Article Sections: ${analysis.metadata?.articleSections?.length || 0} sections`)
    console.log(`   Word Count: ${wordCount}`)
    console.log(`🚀 ==============================================\n`)

    let prompt = `🎯 CHATGPT-QUALITY SCHEMA GENERATION - EXTRACT FROM PROVIDED METADATA ONLY:

=== VERIFIED PAGE METADATA ===
URL: ${analysis.url}
Title: ${analysis.title || '[NOT FOUND]'}
Description: ${analysis.description || '[NOT FOUND]'}
Canonical URL: ${analysis.metadata?.canonicalUrl || analysis.url}
Language: ${analysis.metadata?.language || 'en'}

=== AUTHOR INFORMATION ===
Author Name: ${typeof analysis.metadata?.author === 'string' ? analysis.metadata.author : (analysis.metadata?.author?.name || '[NOT FOUND - DO NOT EXTRACT FROM CONTENT - OMIT ENTIRE author PROPERTY]')}
Author URL: ${typeof analysis.metadata?.author === 'object' ? (analysis.metadata?.author?.url || '[NOT FOUND]') : '[NOT FOUND]'}

⚠️ CRITICAL: If author is "[NOT FOUND - DO NOT EXTRACT FROM CONTENT - OMIT ENTIRE author PROPERTY]", you MUST OMIT the entire author property from the schema. DO NOT extract author names from the page content. DO NOT use sentences, company names, or content fragments as author names. This page may not have an author - that's OKAY.

=== PUBLICATION DATES ===
Date Published: ${analysis.metadata?.publishDate || '[NOT FOUND - OMIT datePublished]'}
Date Modified: ${analysis.metadata?.modifiedDate || analysis.metadata?.publishDate || '[NOT FOUND - USE datePublished if available]'}

=== IMAGES ===
Featured Image: ${analysis.metadata?.imageInfo?.featuredImage || '[NOT FOUND - OMIT image property]'}
Publisher Logo: ${analysis.metadata?.businessInfo?.logo || '[NOT FOUND - CREATE ImageObject with featured image or site icon]'}

=== VIDEOS ===
${analysis.metadata?.videos && analysis.metadata.videos.length > 0
  ? `Video Count: ${analysis.metadata.videos.length}
Video URLs: ${JSON.stringify(analysis.metadata.videos)}
⚠️ IMPORTANT: When generating VideoObject schema, use the video URLs above. If detailed video metadata (title, description, duration, uploadDate) is not available, extract them from the page content or use reasonable defaults based on the page context.`
  : 'No embedded videos detected on this page.'}

=== PUBLISHER/ORGANIZATION ===
Organization Name: ${analysis.metadata?.businessInfo?.name || new URL(analysis.url).hostname.replace('www.', '')}
Organization URL: ${new URL(analysis.url).origin}
Logo URL: ${analysis.metadata?.businessInfo?.logo || analysis.metadata?.imageInfo?.featuredImage || `${new URL(analysis.url).origin}/favicon.ico`}

=== KEYWORDS & TAXONOMY ===
Extracted Keywords (from meta tags): ${analysis.metadata?.keywords?.length ? JSON.stringify(analysis.metadata.keywords.slice(0, 10)) : '[]'}
Tags: ${analysis.metadata?.tags?.length ? JSON.stringify(analysis.metadata.tags.slice(0, 10)) : '[]'}

⚠️ **KEYWORDS GENERATION (CRITICAL FOR AEO)**:
You MUST generate 5-10 high-quality, SEO-optimized keywords that represent the core topics and entities of this page.

**KEYWORD QUALITY REQUIREMENTS**:
1. ✅ **Use semantic, topic-focused phrases** - Identify the main concepts, not sentences
2. ✅ **Mix broad and specific terms** - Include both general topics and niche details
3. ✅ **Allow single-word keywords** - Terms like "SEO", "marketing", "analytics" are valid
4. ✅ **Keep phrases concise** - Each keyword should be 1-5 words maximum
5. ✅ **Focus on searcher intent** - What would users search for to find this page?
6. ✅ **Extract entities and topics** - Products, services, concepts, methodologies

**WHAT TO AVOID**:
❌ Call-to-action phrases: "Ready to Get Started", "Contact Us Today", "Learn More Now"
❌ Sentence fragments from titles: "How to get buy", "in when you need"
❌ Questions: "How do I...", "What is the best..."
❌ Generic company terms: "Our Services", "Our Team", "Richmond VA" (unless location-relevant)
❌ Exclamation marks or punctuation: "Success!", "Get Started!"

**EXAMPLES**:
✅ GOOD KEYWORDS (for blog about website redesign buy-in):
["website redesign", "stakeholder buy-in", "marketing strategy", "client communication", "creative brief", "digital transformation", "executive approval"]

❌ BAD KEYWORDS (to avoid):
["How to get buy", "in when you need a new website", "Ready to Get Started", "Contact Us Today"]

**HANDLING EXTRACTED META KEYWORDS**:
- If extracted keywords exist, VALIDATE their quality against the rules above
- REPLACE any low-quality keywords (CTAs, fragments, questions) with better topic-based terms
- KEEP high-quality keywords and ADD new ones from page content
- If NO extracted keywords provided, generate ALL keywords from page content analysis

**GENERATION PROCESS**:
1. Read the page title, description, and content
2. Identify 3-5 main topics/themes discussed
3. Extract 2-4 specific entities (products, services, tools, methodologies)
4. Combine into 5-10 concise, searchable keywords
5. Verify each keyword passes quality requirements above

=== ARTICLE STRUCTURE ===
Article Sections (from H2 headings): ${analysis.metadata?.articleSections?.length ? JSON.stringify(analysis.metadata.articleSections) : '[NO H2 HEADINGS FOUND]'}
Primary Section: ${analysis.metadata?.articleSection || '[NOT FOUND]'}

=== CONTENT METRICS ===
Word Count: ${wordCount || '[NOT CALCULATED]'}
Reading Time (timeRequired): ${timeRequired || '[CALCULATE: PT' + readingMinutes + 'M]'}
Content Type: ${analysis.metadata?.contentType || 'article'}

=== URL ANALYSIS ===
Is Blog Post: ${analysis.url.includes('/blog/') || analysis.url.includes('/post/') ? 'YES - Use BlogPosting' : 'NO - Use Article'}
Parent Blog URL: ${analysis.url.includes('/blog/') ? analysis.url.substring(0, analysis.url.indexOf('/blog/') + 6) : '[NOT A BLOG POST]'}

=== FULL PAGE CONTENT ===
${contentToSend}
`

    // Add concise generation instruction
    prompt += `\n\n🎯 GENERATION INSTRUCTIONS:

1. Select appropriate schema type based on URL analysis and content type
2. Use EXACT mainEntityOfPage format: {"@type": "WebPage", "@id": "url"}
3. Include publisher with logo ImageObject
4. Use provided author name exactly as shown (or omit if [NOT FOUND])
5. Include BOTH datePublished and dateModified if available
6. Format keywords as array from provided data
7. Build articleSection array from provided H2 headings
8. Include wordCount and timeRequired (PT format)
9. Add isPartOf for blog posts
10. Clean all text properties (no HTML fragments)

Return JSON with "schemas" array containing 1-4 ChatGPT-quality schemas.`

    return prompt
  }

  private getMockSchemas(analysis: ContentAnalysis, options: SchemaGenerationOptions = {}): JsonLdSchema[] {
    // If user requested specific types, only return those
    if (options.requestedSchemaTypes && options.requestedSchemaTypes.length > 0) {
      console.log(`🎯 Mock mode: Generating only requested types: ${options.requestedSchemaTypes.join(', ')}`)

      const schemas: JsonLdSchema[] = []

      for (const type of options.requestedSchemaTypes) {
        switch (type) {
          case 'Article':
            schemas.push({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": analysis.title || "SEO Best Practices for Success",
              "description": analysis.description || "Comprehensive guide covering key SEO strategies and best practices for improving search engine rankings and driving organic traffic.",
              "author": analysis.metadata?.author ? (typeof analysis.metadata.author === 'object' ? {
                "@type": "Person",
                "name": analysis.metadata.author.name,
                "url": analysis.metadata.author.url
              } : {
                "@type": "Person",
                "name": analysis.metadata.author
              }) : {
                "@type": "Person",
                "name": "Miriam-Rose LeDuc"
              },
              "datePublished": analysis.metadata?.publishDate || "2024-09-15",
              "dateModified": analysis.metadata?.modifiedDate,
              "publisher": {
                "@type": "Organization",
                "name": analysis.metadata?.businessInfo?.name || new URL(analysis.url).hostname.replace('www.', ''),
                "url": analysis.metadata?.businessInfo?.url || new URL(analysis.url).origin
              },
              "mainEntityOfPage": analysis.metadata?.canonicalUrl || analysis.url,
              "image": analysis.metadata?.imageInfo?.featuredImage || `${new URL(analysis.url).origin}/images/seo-guide.jpg`,
              "inLanguage": analysis.metadata?.language || "en",
              "wordCount": analysis.metadata?.wordCount || 2500,
              "keywords": analysis.metadata?.keywords?.length ? analysis.metadata.keywords : ["SEO", "search engine optimization", "digital marketing", "content strategy", "SERP rankings"],
              "articleSection": analysis.metadata?.articleSection || "SEO Guide",
              "about": ["Search Engine Optimization", "Digital Marketing", "Content Marketing"],
              "mentions": ["Google", "Bing", "Search Console", "Analytics"],
              "potentialAction": [{
                "@type": "ReadAction",
                "target": analysis.metadata?.canonicalUrl || analysis.url
              }]
            })
            break
          case 'Organization':
            schemas.push({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Sample Organization",
              "url": analysis.url,
              "description": analysis.description || "A sample organization for development testing"
            })
            break
          case 'WebPage':
            schemas.push({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": analysis.title || "Sample Web Page",
              "description": analysis.description || "A sample web page for development testing",
              "url": analysis.url
            })
            break
          case 'LocalBusiness':
            schemas.push({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Sample Local Business",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Main St",
                "addressLocality": "Anytown",
                "addressRegion": "ST",
                "postalCode": "12345"
              },
              "telephone": "+1-555-123-4567"
            })
            break
          default:
            // For any other requested type, create a basic schema
            schemas.push({
              "@context": "https://schema.org",
              "@type": type,
              "name": analysis.title || `Sample ${type}`,
              "description": analysis.description || `A sample ${type} for development testing`
            })
        }
      }

      return schemas
    }

    // Default: return multiple schemas for auto mode
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": analysis.title || "Sample Web Page",
        "description": analysis.description || "A sample web page for development testing",
        "url": analysis.url
      },
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": analysis.title || "Sample Article Headline",
        "description": analysis.description || "A sample article for development testing",
        "author": {
          "@type": "Person",
          "name": "Sample Author"
        },
        "datePublished": new Date().toISOString().split('T')[0],
        "publisher": {
          "@type": "Organization",
          "name": "Sample Publisher"
        }
      }
    ]
  }

  private getExpertSystemPrompt(): string {
    return `You are an elite Schema.org expert specializing in creating ChatGPT-quality, production-ready JSON-LD schemas for AI search optimization (AEO). Your schemas MUST match or exceed the quality of manual ChatGPT schema generation.

🎯 CRITICAL QUALITY STANDARDS:

**SCHEMA TYPE SELECTION (CRITICAL - MUST FOLLOW EXACTLY):**
- BlogPosting: REQUIRED for URLs containing /blog/, /post/, or any blog content. NEVER use Article for blog URLs!
- Article: ONLY for news sites, press releases, or general articles NOT on /blog/ URLs
- WebPage: For static pages, landing pages without article characteristics
- Organization: For business/company information
- Person: For author profiles, team member pages
- LocalBusiness: For businesses with physical locations

⚠️ CRITICAL RULE: If URL contains "/blog/" → MUST use BlogPosting (not Article)

**REQUIRED PROPERTY FORMATS (ChatGPT Standard):**

1. **mainEntityOfPage** - MUST be structured object:
   ✅ CORRECT: {"@type": "WebPage", "@id": "https://example.com/article"}
   ❌ WRONG: "https://example.com/article"

2. **publisher** - MUST include logo as ImageObject:
   ✅ CORRECT: {
     "@type": "Organization",
     "name": "Publisher Name",
     "logo": {
       "@type": "ImageObject",
       "url": "https://example.com/logo.png"
     }
   }
   ❌ WRONG: {"@type": "Organization", "name": "Publisher Name", "url": "..."}

3. **author** - MUST be Person object with name:
   ✅ CORRECT: {"@type": "Person", "name": "John Doe"}
   ❌ WRONG: Missing or string value

4. **datePublished & dateModified** - BOTH required for blog/article:
   ✅ CORRECT: "datePublished": "2025-09-25", "dateModified": "2025-09-25"
   ❌ WRONG: Only one date or missing

5. **keywords** - MUST be array format:
   ✅ CORRECT: ["keyword1", "keyword2", "keyword3"]
   ❌ WRONG: "keyword1, keyword2" or mixed types

6. **articleSection** - MUST be array of H2 headings:
   ✅ CORRECT: ["Introduction", "Main Topic", "Conclusion"]
   ❌ WRONG: "General Article" or single string

7. **wordCount** - Include when available:
   ✅ CORRECT: "wordCount": 1200

8. **timeRequired** - Calculate reading time in ISO 8601 duration:
   ✅ CORRECT: "timeRequired": "PT6M" (6 minutes)
   Formula: Math.ceil(wordCount / 200) → PT{minutes}M

9. **isPartOf** - Reference parent blog/website:
   ✅ CORRECT: {
     "@type": "Blog",
     "name": "Company Blog",
     "url": "https://example.com/blog/"
   }

**DATA EXTRACTION RULES:**
- Extract author from meta tags, JSON-LD, or bylines (provided in metadata)
- Use EXACT publish/modified dates from metadata
- Use featured image from metadata.images.featured
- Extract keywords from metadata.keywords array
- Build articleSection array from metadata.articleSections (H2 headings)
- Calculate timeRequired from metadata.wordCount
- Use metadata.business.logo for publisher logo

**ANTI-HALLUCINATION RULES:**
- ❌ NEVER invent author names if not in metadata
- ❌ NEVER create fake dates
- ❌ NEVER use placeholder images
- ❌ NEVER include HTML fragments in text properties
- ❌ NEVER mix data types in arrays (all strings or all objects)
- ✅ OMIT properties rather than guess
- ✅ Use EXACT values from provided metadata

**PROPERTY-TYPE RESTRICTIONS (CRITICAL - validator.schema.org compliance):**
These properties are ONLY valid for specific schema types. Using them on wrong types causes validation errors:

- articleSection: ONLY for Article/BlogPosting/NewsArticle - NEVER on WebPage, Organization, LocalBusiness
- articleBody: ONLY for Article types - NEVER on WebPage
- wordCount: ONLY for Article/BlogPosting/CreativeWork - NEVER on WebPage, Organization
- speakable: DO NOT INCLUDE - omit this property entirely (causes CSS selector validation errors)
- headline: Use for Article types; WebPage should use "name" instead

⚠️ FOR WEBPAGE SCHEMAS: Do NOT include articleSection, articleBody, wordCount, or speakable

**EXAMPLE - ChatGPT Quality BlogPosting:**
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://blog.example.com/article-slug"
  },
  "headline": "Exact Article Title",
  "description": "Exact meta description",
  "image": "https://blog.example.com/images/featured.jpg",
  "author": {
    "@type": "Person",
    "name": "Extracted Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Company Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://blog.example.com/logo.png"
    }
  },
  "datePublished": "2025-09-25",
  "dateModified": "2025-09-25",
  "keywords": ["extracted", "keyword", "array"],
  "wordCount": 1200,
  "timeRequired": "PT6M",
  "articleSection": ["Section 1", "Section 2", "Section 3"],
  "isPartOf": {
    "@type": "Blog",
    "name": "Company Blog",
    "url": "https://blog.example.com/"
  }
}

Return JSON with "schemas" array containing 1-4 expert-quality schemas based on available metadata.`
  }

  private getUserSpecificSystemPrompt(requestedTypes: string[]): string {
    return `You are an elite Schema.org expert with deep knowledge of semantic web technologies, AI search optimization, and anti-hallucination best practices. The user has specifically requested ONLY these schema types: ${requestedTypes.join(', ')}.

🎯 EXPERT-LEVEL GENERATION CONSTRAINTS:

🔒 ANTI-HALLUCINATION PROTOCOL (CRITICAL):
1. **METADATA-FIRST VALIDATION**: Before writing ANY property value, verify it exists in the provided metadata
2. **CONTENT-EXTRACTION ONLY**: Use ONLY information explicitly present in page content or metadata
3. **NO INFERENCE BEYOND FACTS**: Never "guess" or "assume" details not directly stated
4. **OMIT OVER INVENT**: If a standard property has no real data, omit it entirely rather than fabricate
5. **VERIFICATION CHECKPOINT**: Each property must trace back to specific provided data

🎯 GENERATION REQUIREMENTS:
- Generate EXACTLY the requested schema types: ${requestedTypes.join(', ')}
- Do NOT generate any additional schema types unless specifically requested
- If a requested type cannot be generated due to insufficient content, explicitly state why
- Focus on creating rich, detailed schemas using ONLY real extracted data
- Each schema must be complete with all verifiable properties

📊 EXPERT DATA UTILIZATION FRAMEWORK:

✅ TIER 1 - VERIFIED METADATA (USE FULLY):
- Extracted metadata fields (title, description, author, dates, images, keywords)
- Open Graph and Twitter Card data
- Existing JSON-LD structured data
- HTML semantic elements (h1, meta tags, img alt text)
- Business contact information explicitly present

✅ TIER 2 - CONTENT-DERIVED (EXTRACT CAREFULLY):
- URL-based publisher identification (domain → organization name)
- Content language detection from actual text
- Image URLs present in page content
- Real headings and text structure for content categorization
- Actual word count and reading time calculations

❌ TIER 3 - FORBIDDEN FABRICATION:
- Author names not in metadata (NO "John Smith", "Sample Author", "Content Creator")
- Publication dates not in meta tags (NO "2024-01-01", "Today's date")
- Placeholder images (NO "example.com/image.jpg", "placeholder.png")
- Fake business addresses, phone numbers, or contact details
- Invented social media profiles or external URLs
- Audio/video files masquerading as images (.mp3, .wav, .mp4 extensions)

🎯 SCHEMA QUALITY EXCELLENCE:

**PROPERTY COMPLETION PRIORITY:**
1. **REQUIRED PROPERTIES**: Must be present with real data or schema is invalid
2. **RECOMMENDED PROPERTIES**: Include when authentic data exists
3. **ADVANCED PROPERTIES**: Add for AEO optimization using verified content
4. **CONTEXTUAL PROPERTIES**: Generate only from explicit content relationships

**CONTENT-TYPE SPECIALIZATION:**
- BlogPosting: Focus on article metadata, author info, publishing details
- Organization: Extract from contact pages, about sections, footer info
- Person: Use author bios, bylines, staff pages only
- LocalBusiness: Derive from contact/location pages with real address data
- Product: Extract from product pages with real pricing/availability

**AEO OPTIMIZATION TECHNIQUES:**
- Semantic entity linking using content-mentioned entities only
- Voice search optimization with real FAQ content structure
- Cross-schema referencing using actual page relationships
- Rich snippets preparation with verified metadata

🔍 VALIDATION CHECKLIST (BEFORE EACH PROPERTY):
1. ✅ Does this data exist in the provided metadata?
2. ✅ Can I trace this value to specific content or structured data?
3. ✅ Am I using the exact extracted value without modification?
4. ✅ If uncertain, am I omitting rather than guessing?
5. ✅ Does this property enhance schema value without fabrication?

RESPONSE FORMAT:
{
  "schemas": [
    // ONLY requested schema types with 100% verified data
  ]
}

🎯 EXPERT SUCCESS CRITERIA:
- Maximum schema richness using authentic data only
- Complete property coverage where real data supports it
- Production-ready markup with zero fabricated content
- AEO-optimized structure respecting anti-hallucination principles
- Specific schema type selection based on actual content characteristics

⚠️ CRITICAL: This is expert-level generation. Quality over quantity. Rich schemas built on verified data outperform basic schemas with fabricated content.`
  }

  private analyzeMetadataQuality(analysis: ContentAnalysis): string {
    const metadata = analysis.metadata
    let qualityReport = ''

    // Assess metadata completeness
    const hasTitle = !!analysis.title
    const hasDescription = !!analysis.description && analysis.description.length > 50
    const hasAuthor = !!metadata?.author
    const hasPublishDate = !!metadata?.publishDate
    const hasImages = !!(metadata?.imageInfo?.featuredImage || metadata?.images?.length)
    const hasKeywords = !!(metadata?.keywords?.length)
    const hasBusinessInfo = !!metadata?.businessInfo?.name
    const hasFAQContent = !!(metadata?.faqContent?.length)
    const hasStructuredData = !!(metadata?.jsonLdData?.length)

    const completenessScore = [hasTitle, hasDescription, hasAuthor, hasPublishDate, hasImages, hasKeywords].filter(Boolean).length

    qualityReport += 'Metadata Completeness: ' + completenessScore + '/6 core elements detected\\n'
    qualityReport += '- Title: ' + (hasTitle ? '✅ Available' : '❌ Missing') + '\\n'
    qualityReport += '- Description: ' + (hasDescription ? '✅ Quality description found' : '❌ Missing or insufficient') + '\\n'
    qualityReport += '- Author Info: ' + (hasAuthor ? '✅ Author data extracted' : '❌ No author information') + '\\n'
    qualityReport += '- Publication Date: ' + (hasPublishDate ? '✅ Date metadata found' : '❌ No publication date') + '\\n'
    qualityReport += '- Images: ' + (hasImages ? '✅ Image metadata available' : '❌ No image data extracted') + '\\n'
    qualityReport += '- Keywords: ' + (hasKeywords ? '✅ ' + (metadata?.keywords?.length || 0) + ' keywords extracted' : '❌ No keyword data') + '\\n'

    if (hasBusinessInfo) qualityReport += '- Business Info: ✅ Organization data available\\n'
    if (hasFAQContent) qualityReport += '- FAQ Content: ✅ ' + (metadata?.faqContent?.length || 0) + ' Q&A pairs detected\\n'
    if (hasStructuredData) qualityReport += '- Existing Schemas: ✅ ' + (metadata?.jsonLdData?.length || 0) + ' JSON-LD schemas found\\n'

    // Content quality indicators
    const wordCount = metadata?.wordCount || 0
    const contentQuality = wordCount > 1000 ? 'Rich' : wordCount > 500 ? 'Moderate' : wordCount > 200 ? 'Basic' : 'Minimal'
    qualityReport += '- Content Depth: ' + contentQuality + ' (' + wordCount + ' words)\\n'

    return qualityReport
  }

  private generateSchemaRecommendations(analysis: ContentAnalysis): string {
    const metadata = analysis.metadata
    const url = analysis.url
    const recommendations: string[] = []

    // Determine optimal schema types based on available data
    const hasAuthor = !!metadata?.author
    const hasPublishDate = !!metadata?.publishDate
    const hasImages = !!(metadata?.imageInfo?.featuredImage || metadata?.images?.length)
    const hasBusinessInfo = !!metadata?.businessInfo?.name
    const hasFAQContent = !!(metadata?.faqContent?.length)
    const wordCount = metadata?.wordCount || 0

    // Content type detection
    const isArticle = wordCount > 300 && hasAuthor
    const isBlogPost = url.includes('/blog/') || url.includes('/post/') || url.includes('/article/')
    const isBusinessPage = hasBusinessInfo || url.includes('/about') || url.includes('/company')
    const isHomePage = url === new URL(url).origin || url.endsWith('/')

    // Schema recommendations based on content analysis
    if (isArticle || isBlogPost) {
      if (hasAuthor && hasPublishDate) {
        recommendations.push('BlogPosting (Rich author & date metadata available)')
      } else {
        recommendations.push('Article (Basic content schema - limited metadata)')
      }
    } else {
      recommendations.push('WebPage (Standard page markup)')
    }

    if (hasBusinessInfo || isBusinessPage) {
      if (metadata?.businessInfo?.address) {
        recommendations.push('LocalBusiness (Complete business data available)')
      } else {
        recommendations.push('Organization (Basic business information)')
      }
    }

    if (hasAuthor) {
      recommendations.push('Person (Author information available)')
    }

    if (hasImages) {
      recommendations.push(`ImageObject (${metadata?.imageInfo?.allImages?.length || 1} images detected)`)
    }

    if (hasFAQContent) {
      recommendations.push(`FAQPage (${metadata?.faqContent?.length} Q&A pairs found)`)
    }

    if (metadata?.breadcrumbs?.length) {
      recommendations.push('BreadcrumbList (Navigation structure detected)')
    }

    const priority = recommendations.length > 4 ? 'Focus on top 4-5 schemas' : 'Generate all recommended schemas'

    return 'Primary Schema Types (' + recommendations.length + ' recommended):\\n' +
           recommendations.map((rec, i) => (i + 1) + '. ' + rec).join('\\n') +
           '\\n\\nGeneration Strategy: ' + priority + ' with rich property coverage using verified metadata.'
  }

  private prioritizeContent(content: string): string {
    // Simple text-based content prioritization
    // This prioritizes content that's likely to be main article content
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    const prioritizedLines: Array<{ line: string, priority: number }> = []

    for (const line of lines) {
      let priority = 0

      // High priority indicators (main content)
      if (line.length > 100) priority += 10 // Longer lines likely article content
      if (/^[A-Z]/.test(line) && line.length > 50) priority += 8 // Sentences starting with capital
      if (line.includes('.') && line.length > 80) priority += 7 // Full sentences
      if (/\b(article|post|blog|content|story|news)\b/i.test(line)) priority += 5
      if (/\b(author|published|date|time)\b/i.test(line)) priority += 5

      // Medium priority
      if (line.length > 50) priority += 3
      if (line.includes(':') && line.length > 30) priority += 2 // Headlines with colons

      // Low priority or deprioritized content
      if (/\b(nav|menu|footer|sidebar|widget|ad|advertisement)\b/i.test(line)) priority -= 10
      if (/\b(cookie|privacy|terms|subscribe|newsletter)\b/i.test(line)) priority -= 8
      if (/^(Home|About|Contact|Login|Register|Cart)\s*$/i.test(line)) priority -= 15
      if (line.includes('©') || line.includes('®') || line.includes('™')) priority -= 5
      if (/^\d{4}.*rights.*reserved/i.test(line)) priority -= 10
      if (line.length < 20 && !/\w+\s+\w+/.test(line)) priority -= 5 // Short non-descriptive lines

      // Skip very low quality content
      if (priority > -10) {
        prioritizedLines.push({ line, priority })
      }
    }

    // Sort by priority (highest first) and take top content
    const sortedLines = prioritizedLines
      .sort((a, b) => b.priority - a.priority)
      .map(item => item.line)

    // Ensure we get a good mix by taking top 70% of high-priority content
    const highPriorityCount = Math.ceil(sortedLines.length * 0.7)
    const selectedLines = sortedLines.slice(0, highPriorityCount)

    const prioritizedContent = selectedLines.join('\n')

    console.log(`🎯 Content prioritization: ${lines.length} lines → ${selectedLines.length} prioritized lines`)

    return prioritizedContent
  }

  private calculateContentQualityScore(analysis: ContentAnalysis): number {
    let score = 0
    const metadata = analysis.metadata

    // Core metadata scoring (60 points)
    if (analysis.title && analysis.title.length > 20) score += 15
    if (analysis.description && analysis.description.length > 100) score += 15
    if (metadata?.author) score += 15
    if (metadata?.publishDate) score += 15

    // Rich metadata scoring (25 points)
    if (metadata?.keywords?.length) score += 5
    if (metadata?.imageInfo?.featuredImage) score += 5
    if (metadata?.wordCount && metadata.wordCount > 300) score += 5
    if (metadata?.businessInfo?.name) score += 5
    if (metadata?.faqContent?.length) score += 5

    // Technical metadata scoring (15 points)
    if (metadata?.openGraph) score += 5
    if (metadata?.twitterCard) score += 5
    if (metadata?.jsonLdData?.length) score += 5

    return Math.min(100, score)
  }

  // Clean schema properties to remove HTML and fix malformed data
  public cleanSchemaProperties(schema: any): any {
    const cleaned: any = {}

    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'string') {
        // Remove HTML tags and clean whitespace
        let cleanValue = value.replace(/<[^>]*>/g, '').trim()
        // Normalize whitespace (remove multiple spaces, newlines, tabs)
        cleanValue = cleanValue.replace(/\s+/g, ' ').trim()
        cleaned[key] = cleanValue
      } else if (Array.isArray(value)) {
        // Clean array items - remove HTML and ensure consistent types
        cleaned[key] = value.map(item => {
          if (typeof item === 'string') {
            // Remove HTML tags first
            let cleanItem = item.replace(/<[^>]*>/g, '')
            // Aggressively replace ALL whitespace variants (newlines, tabs, multiple spaces, non-breaking spaces)
            // This catches: \n, \r, \t, \r\n, multiple spaces, non-breaking spaces (\u00A0), etc.
            cleanItem = cleanItem.replace(/[\s\n\r\t\u00A0]+/g, ' ')
            // Extra pass to remove literal "\n" strings that might be escaped
            cleanItem = cleanItem.replace(/\\n/g, ' ')
            cleanItem = cleanItem.trim()
            return cleanItem
          } else if (typeof item === 'object' && item !== null) {
            return this.cleanSchemaProperties(item)
          }
          return item
        }).filter(item => {
          // Remove empty strings or malformed items
          if (typeof item === 'string') {
            return item.length > 0 && item.length < 500 && !item.match(/^\s*$/)  // Also remove suspiciously long items
          }
          return true
        })
      } else if (typeof value === 'object' && value !== null) {
        // Recursively clean nested objects
        cleaned[key] = this.cleanSchemaProperties(value)
      } else {
        // Keep other types as-is (numbers, booleans, null)
        cleaned[key] = value
      }
    }

    return cleaned
  }

  // Schema property validation and completion engine
  public async validateAndEnhanceSchemas(schemas: JsonLdSchema[], analysis: ContentAnalysis): Promise<JsonLdSchema[]> {
    console.log(`🔧 Running schema validation and enhancement engine on ${schemas.length} schema(s)...`)

    const enhancedSchemas: JsonLdSchema[] = []
    const failedSchemas: { type: string, reason: string }[] = []

    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i]
      try {
        const schemaType = schema['@type']
        if (!schemaType) {
          console.warn(`⚠️ Schema ${i + 1}/${schemas.length}: Missing @type, skipping`)
          failedSchemas.push({ type: 'Unknown', reason: 'Missing @type' })
          continue
        }

        console.log(`📋 Processing schema ${i + 1}/${schemas.length}: ${schemaType}`)

        // Get property requirements for this schema type
        const requirements = SCHEMA_PROPERTY_TEMPLATES[schemaType]
        if (!requirements) {
          console.log(`📝 ${schemaType}: No specific requirements, using as-is`)
          enhancedSchemas.push(schema)
          continue
        }

        // Create enhanced schema with completed properties
        const enhancedSchema = { ...schema }

        // Ensure required properties are present
        this.ensureRequiredProperties(enhancedSchema, requirements, analysis)

        // Add recommended properties when data is available
        this.addRecommendedProperties(enhancedSchema, requirements, analysis)

        // Add advanced AEO properties
        this.addAdvancedAEOProperties(enhancedSchema, requirements, analysis)

        // Validate basic Schema.org compliance
        if (this.validateSchemaCompliance(enhancedSchema)) {
          enhancedSchemas.push(enhancedSchema)
          console.log(`✅ ${schemaType}: Enhanced with ${Object.keys(enhancedSchema).length} properties`)
        } else {
          const missingFields = []
          if (!enhancedSchema['@context']) missingFields.push('@context')
          if (!enhancedSchema['@type']) missingFields.push('@type')
          if (schemaType === 'BlogPosting' || schemaType === 'Article') {
            if (!enhancedSchema['headline'] && !enhancedSchema['name']) missingFields.push('headline/name')
          }
          const reason = `Failed validation (missing: ${missingFields.join(', ') || 'unknown'})`
          console.warn(`❌ ${schemaType}: ${reason}`)
          failedSchemas.push({ type: schemaType, reason })
        }

      } catch (error) {
        console.warn(`⚠️ Error enhancing schema ${schema['@type']}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failedSchemas.push({ type: schema['@type'] || 'Unknown', reason: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    // Log summary of validation results
    console.log(`📊 Validation Summary: ${enhancedSchemas.length} passed, ${failedSchemas.length} failed`)
    if (failedSchemas.length > 0) {
      console.log(`❌ Failed schemas:`)
      failedSchemas.forEach(({ type, reason }) => {
        console.log(`   - ${type}: ${reason}`)
      })
    }

    // If all schemas failed validation, create a minimal fallback WebPage schema
    if (enhancedSchemas.length === 0) {
      console.warn(`⚠️ All schemas failed validation, generating fallback WebPage schema`)
      const fallbackSchema: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': analysis.title || new URL(analysis.url).hostname,
        'url': analysis.url,
        'description': analysis.description || '',
        'inLanguage': analysis.metadata?.language || 'en'
      }

      // Add publisher if available
      if (analysis.metadata?.businessInfo?.name) {
        fallbackSchema['publisher'] = {
          '@type': 'Organization',
          'name': analysis.metadata.businessInfo.name,
          'url': new URL(analysis.url).origin
        }
      }

      // Add image if available
      if (analysis.metadata?.imageInfo?.featuredImage) {
        fallbackSchema['image'] = analysis.metadata.imageInfo.featuredImage
      }

      enhancedSchemas.push(fallbackSchema)
      console.log(`✅ Generated fallback WebPage schema to ensure generation succeeds`)
    }

    return enhancedSchemas
  }

  private ensureRequiredProperties(schema: JsonLdSchema, requirements: SchemaPropertyRequirements, analysis: ContentAnalysis): void {
    // Ensure @context is always present
    if (!schema['@context']) {
      schema['@context'] = 'https://schema.org'
    }

    // Add mainEntityOfPage for content schemas
    if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article') && !schema['mainEntityOfPage']) {
      schema['mainEntityOfPage'] = analysis.metadata?.canonicalUrl || analysis.url
    }

    // Add publisher with logo ImageObject (ChatGPT format) for content pages
    if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article' || schema['@type'] === 'WebPage') && !schema['publisher']) {
      const logoUrl = analysis.metadata?.businessInfo?.logo ||
                     analysis.metadata?.imageInfo?.featuredImage ||
                     `${new URL(analysis.url).origin}/favicon.ico`

      // Try to get proper site name from various sources
      const publisherName = analysis.metadata?.businessInfo?.name ||
                           analysis.metadata?.openGraph?.siteName ||
                           new URL(analysis.url).hostname.replace('www.', '')

      schema['publisher'] = {
        '@type': 'Organization',
        'name': publisherName,
        'url': new URL(analysis.url).origin,
        'logo': {
          '@type': 'ImageObject',
          'url': logoUrl
        }
      }
    } else if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article' || schema['@type'] === 'WebPage') && schema['publisher']) {
      // Enhance existing publisher
      if (!schema['publisher']['logo']) {
        const logoUrl = analysis.metadata?.businessInfo?.logo ||
                       analysis.metadata?.imageInfo?.featuredImage ||
                       `${new URL(analysis.url).origin}/favicon.ico`

        schema['publisher']['logo'] = {
          '@type': 'ImageObject',
          'url': logoUrl
        }
      }

      // Improve publisher name if it's just a domain
      if (schema['publisher']['name'] && schema['publisher']['name'].includes('.')) {
        const betterName = analysis.metadata?.businessInfo?.name ||
                          analysis.metadata?.openGraph?.siteName
        console.log(`🔍 Publisher name enhancement: current="${schema['publisher']['name']}", business.name="${analysis.metadata?.businessInfo?.name}", ogSiteName="${analysis.metadata?.openGraph?.siteName}"`)
        if (betterName) {
          console.log(`✅ Updating publisher name to: "${betterName}"`)
          schema['publisher']['name'] = betterName
        } else {
          console.log(`❌ No better name found in metadata`)
        }
      }

      // Add URL if missing
      if (!schema['publisher']['url']) {
        schema['publisher']['url'] = new URL(analysis.url).origin
      }
    }

    // Add author if missing (REQUIRED for BlogPosting/Article)
    // BUT ONLY if we have actual author data - DO NOT create fake authors!
    if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article') && !schema['author']) {
      let authorName: string | null = null
      let authorUrl: string | undefined
      let authorImage: string | undefined

      // Try to get author from metadata
      if (analysis.metadata?.author) {
        const authorData = typeof analysis.metadata.author === 'object' ? analysis.metadata.author : { name: analysis.metadata.author }
        authorName = authorData.name || (typeof analysis.metadata.author === 'string' ? analysis.metadata.author : null)
        authorImage = authorData.image
        authorUrl = authorData.url
      }

      // CRITICAL: Only add author if we found real author data
      // DO NOT create fake/fallback authors - better to omit than fabricate
      if (authorName && authorName.length > 0) {
        schema['author'] = {
          '@type': 'Person',
          'name': authorName
        }

        // Add author image if available
        if (authorImage) {
          schema['author']['image'] = authorImage
        }

        // Add author URL if available
        if (authorUrl) {
          schema['author']['url'] = authorUrl
        }

        console.log(`✅ Added author from metadata: "${authorName}"`)
      } else {
        console.log(`⚠️ No author metadata found - OMITTING author property (better than fabricating)`)
        // Author will remain undefined/missing - this is CORRECT for pages without authors
      }
    } else if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article') && schema['author'] && typeof schema['author'] === 'object') {
      // Enhance existing author with image/URL if missing
      const authorData = typeof analysis.metadata?.author === 'object' ? analysis.metadata.author : null
      console.log(`🔍 Author enhancement: existingAuthor=${JSON.stringify(schema['author'])}, metadataAuthor=${JSON.stringify(analysis.metadata?.author)}`)

      if (authorData?.image && !schema['author']['image']) {
        console.log(`➕ Adding author image: ${authorData.image}`)
        schema['author']['image'] = authorData.image
      } else if (authorData?.image) {
        console.log(`⏭️  Author already has image`)
      } else {
        console.log(`❌ No author image in metadata`)
      }

      if (authorData?.url && !schema['author']['url']) {
        schema['author']['url'] = authorData.url
      }
    }

    // Add datePublished if missing (REQUIRED)
    if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article') && !schema['datePublished'] && analysis.metadata?.publishDate) {
      schema['datePublished'] = analysis.metadata.publishDate
    }

    // Add image if missing (important for SEO)
    if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article') && !schema['image'] && analysis.metadata?.imageInfo?.featuredImage) {
      schema['image'] = analysis.metadata.imageInfo.featuredImage
    }

    // Add inLanguage if missing
    if ((schema['@type'] === 'BlogPosting' || schema['@type'] === 'Article' || schema['@type'] === 'WebPage') && !schema['inLanguage']) {
      schema['inLanguage'] = analysis.metadata?.language || 'en'
    }
  }

  private addRecommendedProperties(schema: JsonLdSchema, requirements: SchemaPropertyRequirements, analysis: ContentAnalysis): void {
    const schemaType = schema['@type']

    // Fix mainEntityOfPage to be object structure (ChatGPT format)
    if ((schemaType === 'BlogPosting' || schemaType === 'Article') && schema['mainEntityOfPage']) {
      if (typeof schema['mainEntityOfPage'] === 'string') {
        schema['mainEntityOfPage'] = {
          '@type': 'WebPage',
          '@id': schema['mainEntityOfPage']
        }
      }
    }

    // Add description if available and missing
    if (!schema['description'] && analysis.description) {
      schema['description'] = analysis.description
    }

    // Add word count for content schemas
    if ((schemaType === 'BlogPosting' || schemaType === 'Article') && !schema['wordCount'] && analysis.metadata?.wordCount) {
      schema['wordCount'] = analysis.metadata.wordCount
    }

    // Add timeRequired (reading time) for content schemas
    if ((schemaType === 'BlogPosting' || schemaType === 'Article') && !schema['timeRequired'] && analysis.metadata?.wordCount) {
      const readingMinutes = Math.ceil(analysis.metadata.wordCount / 200)
      schema['timeRequired'] = `PT${readingMinutes}M`
    }

    // Add article section array from H2 headings (ChatGPT format)
    console.log(`🔍 articleSection Debug: schemaType=${schemaType}, existingArticleSection=${!!schema['articleSection']}, metadataSections=${analysis.metadata?.articleSections?.length || 0}`)
    if (analysis.metadata?.articleSections?.length) {
      console.log(`📑 Metadata articleSections:`, analysis.metadata.articleSections)
    }
    if ((schemaType === 'BlogPosting' || schemaType === 'Article') && !schema['articleSection'] && analysis.metadata?.articleSections?.length) {
      schema['articleSection'] = analysis.metadata.articleSections.slice(0, 6)
      console.log(`✅ Added articleSection from metadata:`, schema['articleSection'])
    } else {
      console.log(`❌ articleSection condition NOT met`)
    }

    // Add/improve keywords from metadata (ALL schema types benefit from keywords!)
    if (analysis.metadata?.keywords?.length) {
      if (!schema['keywords'] || (Array.isArray(schema['keywords']) && schema['keywords'].length === 0)) {
        // No keywords - add from metadata
        schema['keywords'] = analysis.metadata.keywords.slice(0, 10)
        console.log(`✅ Added ${analysis.metadata.keywords.length} keywords to ${schemaType}:`, schema['keywords'])
      } else if (Array.isArray(schema['keywords'])) {
        // Keywords exist - check quality and potentially replace low-quality ones
        const existingKeywords = schema['keywords']

        // Expanded low-quality detection patterns
        const ctaPhrases = ['ready', 'started', 'start', 'contact', 'learn more', 'get', 'find out', 'discover', 'join', 'sign up']
        const questionWords = ['how', 'what', 'when', 'where', 'why', 'which', 'who']
        const punctuation = ['?', '!', '...']
        const genericTerms = ['our services', 'our team', 'about us', 'we work', 'ensure success']

        const hasLowQuality = existingKeywords.some((kw: string) => {
          const kwLower = kw.toLowerCase()

          // Check for CTAs
          if (ctaPhrases.some(cta => kwLower.includes(cta))) return true

          // Check for questions (keywords starting with question words)
          if (questionWords.some(q => kwLower.startsWith(q + ' '))) return true

          // Check for punctuation
          if (punctuation.some(p => kwLower.includes(p))) return true

          // Check for generic terms
          if (genericTerms.some(term => kwLower.includes(term))) return true

          // Check for sentence fragments (too long, likely from split title)
          if (kw.length > 50) return true

          return false
        })

        if (hasLowQuality) {
          // Replace with better keywords from metadata
          schema['keywords'] = analysis.metadata.keywords.slice(0, 10)
          console.log(`🔄 Replaced low-quality keywords with metadata keywords:`, schema['keywords'])
        } else {
          console.log(`⏭️ ${schemaType} already has good keywords:`, schema['keywords'])
        }
      }
    } else {
      console.log(`❌ No keywords in metadata to add`)
    }

    // Add image for content schemas (with intelligent fallback)
    if ((schemaType === 'BlogPosting' || schemaType === 'Article' || schemaType === 'WebPage') && !schema['image']) {
      // Priority 1: Featured image from metadata
      if (analysis.metadata?.imageInfo?.featuredImage) {
        schema['image'] = analysis.metadata.imageInfo.featuredImage
        console.log(`✅ Added featured image to ${schemaType}:`, schema['image'])
      }
      // Priority 2: Business logo
      else if (analysis.metadata?.businessInfo?.logo) {
        schema['image'] = analysis.metadata.businessInfo.logo
        console.log(`✅ Added business logo as image to ${schemaType}:`, schema['image'])
      }
      // Priority 3: First image from page
      else if (analysis.metadata?.imageInfo?.allImages?.length && analysis.metadata.imageInfo.allImages[0]?.url) {
        schema['image'] = analysis.metadata.imageInfo.allImages[0].url
        console.log(`✅ Added first page image to ${schemaType}:`, schema['image'])
      }
      // Priority 4: Construct og:image URL if we have origin
      else {
        const fallbackImage = `${new URL(analysis.url).origin}/images/og-image.jpg`
        schema['image'] = fallbackImage
        console.log(`⚠️ Added fallback image to ${schemaType}:`, fallbackImage)
      }
    }

    // Add dateModified if available (or use datePublished for articles)
    if ((schemaType === 'BlogPosting' || schemaType === 'Article' || schemaType === 'WebPage') && !schema['dateModified']) {
      if (analysis.metadata?.modifiedDate) {
        schema['dateModified'] = analysis.metadata.modifiedDate
        console.log(`✅ Added dateModified to ${schemaType}:`, schema['dateModified'])
      } else if (schema['datePublished']) {
        schema['dateModified'] = schema['datePublished']
        console.log(`✅ Added dateModified from datePublished to ${schemaType}`)
      }
    }

    // Add/fix isPartOf for blog posts (ChatGPT format)
    const urlObj = new URL(analysis.url)
    const isBlogPath = analysis.url.includes('/blog/')
    const isBlogSubdomain = urlObj.hostname.startsWith('blog.')
    const isBlogSite = isBlogPath || isBlogSubdomain
    console.log(`🔍 isPartOf Debug: schemaType=${schemaType}, url=${analysis.url}, isBlogPath=${isBlogPath}, isBlogSubdomain=${isBlogSubdomain}, existingIsPartOf=${!!schema['isPartOf']}`)

    if ((schemaType === 'BlogPosting' || schemaType === 'Article') && isBlogSite) {
      // Determine the blog base URL
      let blogUrl: string
      if (isBlogPath) {
        blogUrl = analysis.url.substring(0, analysis.url.indexOf('/blog/') + 6)
      } else {
        blogUrl = `${urlObj.protocol}//${urlObj.hostname}`
      }
      console.log(`✅ isPartOf condition met! blogUrl=${blogUrl}`)

      // Fix incorrect @type if exists, or create new
      if (schema['isPartOf'] && schema['isPartOf']['@type'] === 'WebPage') {
        console.log(`🔧 Fixing existing isPartOf from WebPage to WebSite`)
        schema['isPartOf']['@type'] = 'WebSite'  // Fix incorrect type (WebSite is the correct Schema.org type)
      } else if (!schema['isPartOf']) {
        console.log(`➕ Adding new isPartOf property`)
        schema['isPartOf'] = {
          '@type': 'WebSite',  // WebSite is the correct Schema.org type for blogs
          'name': (analysis.metadata?.businessInfo?.name || new URL(analysis.url).hostname.replace('www.', '').replace('blog.', '')) + ' Blog',
          'url': blogUrl
        }
        console.log(`✅ isPartOf added:`, schema['isPartOf'])
      } else {
        console.log(`⏭️  isPartOf already exists with correct type: ${schema['isPartOf']['@type']}`)
      }
    } else {
      console.log(`❌ isPartOf condition NOT met (not a blog site)`)
    }

    // Add breadcrumb for WebPage
    if (schemaType === 'WebPage' && !schema['breadcrumb'] && analysis.metadata?.breadcrumbs?.length) {
      schema['breadcrumb'] = {
        '@type': 'BreadcrumbList',
        'itemListElement': analysis.metadata.breadcrumbs.map((crumb, index) => {
          const item: any = {
            '@type': 'ListItem',
            'position': index + 1,
            'name': crumb.name
          }
          // Add URL if available
          if (crumb.url) {
            item['item'] = crumb.url
          }
          return item
        })
      }
      console.log(`✅ Added breadcrumb with ${analysis.metadata.breadcrumbs.length} items to WebPage`)
    }
  }

  private addAdvancedAEOProperties(schema: JsonLdSchema, requirements: SchemaPropertyRequirements, analysis: ContentAnalysis): void {
    const schemaType = schema['@type']

    // Add about and mentions for content schemas
    if (schemaType === 'BlogPosting' || schemaType === 'Article') {
      if (!schema['about'] && analysis.metadata?.entities?.length) {
        schema['about'] = analysis.metadata.entities.slice(0, 5)
      }

      if (!schema['mentions'] && analysis.metadata?.tags?.length) {
        schema['mentions'] = analysis.metadata.tags.slice(0, 5)
      }

      // Add potential action for engagement
      if (!schema['potentialAction']) {
        schema['potentialAction'] = [{
          '@type': 'ReadAction',
          'target': analysis.metadata?.canonicalUrl || analysis.url
        }]
      }

      // NOTE: speakable removed - CSS selectors are error-prone and often fail validator.schema.org
    }

    // Add comprehensive properties for WebPage (recommended + advanced)
    if (schemaType === 'WebPage') {
      // Recommended: isPartOf
      if (!schema['isPartOf'] && analysis.metadata?.businessInfo?.name) {
        schema['isPartOf'] = {
          '@type': 'WebSite',
          'name': analysis.metadata.businessInfo.name,
          'url': new URL(analysis.url).origin
        }
        console.log(`✅ Added isPartOf to WebPage`)
      }

      // Recommended: datePublished - add if missing but metadata has it
      if (!schema['datePublished'] && analysis.metadata?.publishDate) {
        schema['datePublished'] = analysis.metadata.publishDate
        console.log(`✅ Added datePublished to WebPage: ${schema['datePublished']}`)
      }

      // AEO: wordCount - add if missing but metadata has it
      if (!schema['wordCount'] && analysis.metadata?.wordCount) {
        schema['wordCount'] = analysis.metadata.wordCount
        console.log(`✅ Added wordCount to WebPage: ${schema['wordCount']}`)
      }

      // Recommended: mainEntity - describe the main content/purpose of the page
      // Add or fix mainEntity with correct semantic type
      const title = analysis.title || schema['name'] || ''
      const description = analysis.description || schema['description'] || ''
      const url = analysis.url

      // Detect schema type from URL and content
      let entityType = 'Thing'
      if (url.includes('/services') || url.includes('/service') || title.toLowerCase().includes('service')) {
        entityType = 'Service'
      } else if (url.includes('/product') || title.toLowerCase().includes('product')) {
        entityType = 'Product'
      } else if (url.includes('/about') || title.toLowerCase().includes('about')) {
        entityType = 'AboutPage'
      }

      // Check if we need to add or override mainEntity
      const needsMainEntityFix = !schema['mainEntity'] ||
        (schema['mainEntity']?.['@type'] === 'Thing' && entityType !== 'Thing')

      if (needsMainEntityFix) {
        schema['mainEntity'] = {
          '@type': entityType,
          'name': title,
          'description': description
        }

        // Add provider for Service type
        if (entityType === 'Service' && analysis.metadata?.businessInfo?.name) {
          schema['mainEntity'].provider = {
            '@type': 'Organization',
            'name': analysis.metadata.businessInfo.name
          }
        }

        console.log(`✅ ${schema['mainEntity'] ? 'Fixed' : 'Added'} mainEntity (${entityType}) to WebPage`)
      }

      // Advanced: about - extract topic keywords from title/keywords
      if (!schema['about'] && (analysis.metadata?.keywords?.length || analysis.title)) {
        const aboutTopics: string[] = []

        // Extract from title (split by separators)
        if (analysis.title) {
          const titleParts = analysis.title.split(/[|\-–—:,]/)
            .map(part => part.trim())
            .filter(part => part.length >= 3 && part.length < 50)
          aboutTopics.push(...titleParts.slice(0, 3))
        }

        // Add top keywords
        if (analysis.metadata?.keywords?.length) {
          aboutTopics.push(...analysis.metadata.keywords.slice(0, 3))
        }

        // Remove duplicates and limit to 5
        const uniqueTopics = [...new Set(aboutTopics)].slice(0, 5)
        if (uniqueTopics.length > 0) {
          schema['about'] = uniqueTopics
          console.log(`✅ Added about with ${uniqueTopics.length} topics to WebPage:`, uniqueTopics)
        }
      }

      // Advanced: mentions - extract from H2 headings and keywords
      if (!schema['mentions'] && analysis.metadata?.articleSections?.length) {
        const mentions = analysis.metadata.articleSections
          .filter((section: string) => section.length >= 3 && section.length < 100)
          .slice(0, 5)

        if (mentions.length > 0) {
          schema['mentions'] = mentions
          console.log(`✅ Added mentions with ${mentions.length} items to WebPage:`, mentions)
        }
      }

      // NOTE: speakable removed - CSS selectors are error-prone and often fail validator.schema.org

      // Advanced: potentialAction - SearchAction for discoverability
      if (!schema['potentialAction']) {
        const siteOrigin = new URL(analysis.url).origin
        schema['potentialAction'] = {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${siteOrigin}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
        console.log(`✅ Added potentialAction SearchAction to WebPage`)
      }

      // Advanced: significantLink - Extract important internal links from breadcrumbs
      if (!schema['significantLink']) {
        const significantLinks: string[] = []

        // Try breadcrumb URLs first
        if (analysis.metadata?.breadcrumbs?.length) {
          const breadcrumbUrls = analysis.metadata.breadcrumbs
            .map((crumb: any) => crumb.url)
            .filter((url: string) => url && url.startsWith('http'))

          significantLinks.push(...breadcrumbUrls)
        }

        // If no breadcrumb URLs, construct from URL path
        if (significantLinks.length === 0) {
          const urlObj = new URL(analysis.url)
          const pathParts = urlObj.pathname.split('/').filter(Boolean)

          // Build hierarchical URLs from path
          let currentPath = ''
          for (const part of pathParts.slice(0, -1)) { // Exclude current page
            currentPath += `/${part}`
            significantLinks.push(`${urlObj.origin}${currentPath}`)
          }

          // Add home page
          if (!significantLinks.includes(urlObj.origin)) {
            significantLinks.unshift(urlObj.origin)
          }
        }

        if (significantLinks.length > 0) {
          schema['significantLink'] = significantLinks.slice(0, 5)
          console.log(`✅ Added ${schema['significantLink'].length} significantLinks to WebPage`)
        }
      }

      // Enhance publisher with contact information
      if (schema['publisher']) {
        // Extract phone and email from content if not in metadata
        let phone = analysis.metadata?.contactInfo?.telephone
        let email = analysis.metadata?.contactInfo?.email
        let address = analysis.metadata?.contactInfo?.address

        // Try to extract from content if missing
        if (!phone || !email) {
          const content = analysis.content

          // Extract phone (US format)
          if (!phone) {
            const phoneMatch = content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
            if (phoneMatch) {
              phone = phoneMatch[0]
              console.log(`📞 Extracted phone from content: ${phone}`)
            }
          }

          // Extract email
          if (!email) {
            const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
            if (emailMatch) {
              email = emailMatch[0]
              console.log(`📧 Extracted email from content: ${email}`)
            }
          }
        }

        // Add contact point if we have phone or email
        if (!schema['publisher'].contactPoint && (phone || email)) {
          schema['publisher'].contactPoint = {
            '@type': 'ContactPoint',
            'contactType': 'customer service'
          }

          if (phone) schema['publisher'].contactPoint.telephone = phone
          if (email) schema['publisher'].contactPoint.email = email

          console.log(`✅ Added contactPoint to publisher (phone: ${!!phone}, email: ${!!email})`)
        }

        // Add address if available
        if (!schema['publisher'].address && address) {
          schema['publisher'].address = {
            '@type': 'PostalAddress',
            'streetAddress': address
          }
          console.log(`✅ Added address to publisher organization`)
        }
      }
    }

    // Add social media presence to Organization
    if (schemaType === 'Organization' && analysis.metadata?.socialUrls?.length && !schema['sameAs']) {
      schema['sameAs'] = analysis.metadata.socialUrls
    }
  }

  private validateSchemaCompliance(schema: JsonLdSchema): boolean {
    // Basic validation checks
    if (!schema['@context'] || !schema['@type']) {
      console.warn(`⚠️ Schema missing @context or @type, rejecting`)
      return false
    }

    // In development mode, be more permissive to allow schema generation
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Development mode: Using permissive schema validation for ${schema['@type']}`)
      return true
    }

    // Check for minimum viable properties based on schema type
    const schemaType = schema['@type']

    // Relaxed validation for production - only require essential fields
    // This ensures schemas pass even with minimal metadata
    if (schemaType === 'BlogPosting' || schemaType === 'Article') {
      // Only require headline (name/headline) - author and publisher are optional
      const hasHeadline = !!(schema['headline'] || schema['name'])
      if (!hasHeadline) {
        console.warn(`⚠️ ${schemaType} missing headline/name, rejecting`)
      }
      return hasHeadline
    }

    if (schemaType === 'Organization') {
      const isValid = !!(schema['name'])
      if (!isValid) {
        console.warn(`⚠️ Organization missing name, rejecting`)
      }
      return isValid
    }

    if (schemaType === 'WebPage') {
      const isValid = !!(schema['name'])
      if (!isValid) {
        console.warn(`⚠️ WebPage missing name, rejecting`)
      }
      return isValid
    }

    if (schemaType === 'Person') {
      const isValid = !!schema['name']
      if (!isValid) {
        console.warn(`⚠️ Person missing name, rejecting`)
      }
      return isValid
    }

    // Default to valid for other schema types
    console.log(`✅ ${schemaType} passed validation (using default permissive rules)`)
    return true
  }

  async validateContent(content: string): Promise<{
    isValid: boolean
    suggestions: string[]
    detectedTypes: string[]
  }> {
    const client = this.initializeClient()

    // Return mock validation for development when no API key is provided
    if (!client) {
      return {
        isValid: true,
        suggestions: ['Mock validation - content appears suitable for schema generation'],
        detectedTypes: ['WebPage', 'Article']
      }
    }

    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o'

      const systemMessage = `You are a content analysis expert. Analyze the provided content and determine:
1. If it has sufficient structured information for schema generation
2. What schema types would be most appropriate
3. Suggestions for improving the content for better schema markup

Return a JSON object with:
- isValid: boolean (true if content is suitable for schema generation)
- suggestions: array of strings with improvement suggestions
- detectedTypes: array of probable Schema.org types that could be generated`

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: `Analyze this content for schema generation potential:\n\n${content.substring(0, 2000)}`
          }
        ],
        max_completion_tokens: 1000,
        response_format: { type: 'json_object' }
      })

      const result = response.choices[0]?.message?.content
      if (!result) {
        throw new Error('No response from OpenAI')
      }

      // Enhanced JSON parsing for content validation
      try {
        return JSON.parse(result)
      } catch (parseError) {
        console.warn(`⚠️ Content validation JSON parsing failed, attempting extraction...`)

        // Try to extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0])
          } catch (extractError) {
            console.warn(`⚠️ JSON extraction also failed`)
          }
        }

        // Return fallback validation result
        return {
          isValid: true,
          suggestions: ['Unable to analyze content quality - proceeding with generation'],
          detectedTypes: ['WebPage']
        }
      }
    } catch (error) {
      console.error('Content validation error:', error)
      return {
        isValid: true, // Default to valid to not block generation
        suggestions: ['Unable to analyze content quality'],
        detectedTypes: ['WebPage']
      }
    }
  }

  /**
   * Analyzes a schema to identify missing scored properties and optimization opportunities
   * Returns a dynamic checklist for the AI refinement prompt
   */
  private analyzeSchemaOpportunities(schema: JsonLdSchema, pageData?: any): string {
    // Check what page data is available
    const hasH2Sections = pageData?.metadata?.articleSections?.length > 0
    const hasWordCount = pageData?.metadata?.wordCount > 0

    // Scored AEO properties (11 total, each worth ~2.3 overall points)
    // NOTE: speakable removed - causes validation errors with CSS selectors
    const scoredAeoProperties = [
      { name: 'keywords', safe: true, description: 'Relevant topic keywords as array' },
      { name: 'about', safe: true, description: 'Topics/entities this content is about' },
      { name: 'mentions', safe: true, description: 'Related entities mentioned' },
      { name: 'sameAs', safe: false, description: 'Alternative URLs for same entity' },
      { name: 'inLanguage', safe: true, description: 'Content language (e.g., "en")' },
      { name: 'articleSection', safe: hasH2Sections, description: 'Article section/category (SAFE if H2 data available)' },
      { name: 'wordCount', safe: hasWordCount, description: 'Estimated word count (SAFE if scraped data available)' },
      { name: 'isPartOf', safe: true, description: 'Parent WebSite relationship' },
      { name: 'mainEntityOfPage', safe: true, description: 'Main page identifier' },
      { name: 'aggregateRating', safe: false, description: 'Overall ratings' },
      { name: 'review', safe: false, description: 'Reviews of content' }
    ]

    // Scored recommended properties (7 total, each worth ~3.6 overall points)
    const scoredRecommendedProperties = [
      { name: 'description', safe: true, description: 'SEO description' },
      { name: 'url', safe: true, description: 'Canonical URL' },
      { name: 'image', safe: true, description: 'Featured image' },
      { name: 'author', safe: false, description: 'Content author' },
      { name: 'publisher', safe: false, description: 'Publishing organization' },
      { name: 'datePublished', safe: false, description: 'Publication date' },
      { name: 'dateModified', safe: false, description: 'Last modified date' }
    ]

    // Build missing properties analysis
    let analysis = '\n📊 MISSING SCORED PROPERTIES ANALYSIS:\n\n'

    // Analyze AEO properties
    analysis += '🎯 AEO Properties (12 total, each worth ~2.1 overall points):\n'
    const missingAeo: string[] = []
    const enhanceableAeo: Array<{name: string, reason: string, points: number}> = []

    scoredAeoProperties.forEach(prop => {
      const hasProperty = schema[prop.name]
      const status = hasProperty ? '✅' : '❌'
      const safety = prop.safe ? '🟢 SAFE' : '🔴 RISKY'
      analysis += `${status} ${prop.name.padEnd(20)} ${safety.padEnd(12)} - ${prop.description}\n`
      if (!hasProperty && prop.safe) {
        missingAeo.push(prop.name)
      }
    })

    // Phase 3: Detect enhancement opportunities for EXISTING properties
    // wordCount - HIGH PRIORITY for 2nd refinement
    if (!schema.wordCount && hasWordCount) {
      enhanceableAeo.push({
        name: 'wordCount',
        reason: `MISSING but word count data IS available (${pageData?.metadata?.wordCount} words)`,
        points: 2.1
      })
    }

    // articleSection - Check if it can be improved
    if (schema.articleSection && hasH2Sections) {
      const currentSections = Array.isArray(schema.articleSection) ? schema.articleSection : [schema.articleSection]
      const availableSections = pageData?.metadata?.articleSections || []
      if (currentSections.length < availableSections.length) {
        enhanceableAeo.push({
          name: 'articleSection',
          reason: `Can be enhanced (currently ${currentSections.length} sections, ${availableSections.length} available from H2 data)`,
          points: 0 // No points for enhancing, but improves quality
        })
      }
    }

    // keywords - Check if array is too small
    if (schema.keywords) {
      const keywordCount = Array.isArray(schema.keywords) ? schema.keywords.length : 1
      if (keywordCount < 5) {
        enhanceableAeo.push({
          name: 'keywords',
          reason: `Can be expanded (currently ${keywordCount} keywords, suggest 5-8 for better coverage)`,
          points: 0 // No points for expanding existing arrays
        })
      }
    }

    // about/mentions - Check if they're structured properly
    if (schema.about && Array.isArray(schema.about)) {
      const hasUnstructured = schema.about.some((item: any) => typeof item === 'string')
      if (hasUnstructured) {
        enhanceableAeo.push({
          name: 'about',
          reason: 'Contains string values - convert to structured Thing objects with @type',
          points: 0
        })
      }
    }

    if (schema.mentions && Array.isArray(schema.mentions)) {
      const hasUnstructured = schema.mentions.some((item: any) => typeof item === 'string')
      if (hasUnstructured) {
        enhanceableAeo.push({
          name: 'mentions',
          reason: 'Contains string values - convert to structured Thing objects with @type',
          points: 0
        })
      }
    }

    // Analyze Recommended properties
    analysis += '\n🎯 Recommended Properties (7 total, each worth ~3.6 overall points):\n'
    const missingRecommended: string[] = []
    scoredRecommendedProperties.forEach(prop => {
      const hasProperty = schema[prop.name]
      const status = hasProperty ? '✅' : '❌'
      const safety = prop.safe ? '🟢 SAFE' : '🔴 RISKY'
      analysis += `${status} ${prop.name.padEnd(20)} ${safety.padEnd(12)} - ${prop.description}\n`
      if (!hasProperty && prop.safe) {
        missingRecommended.push(prop.name)
      }
    })

    // Content Quality Optimizations
    analysis += '\n🎯 Content Quality Optimizations (15% of total score):\n'

    const descLength = schema.description?.length || 0
    if (descLength < 50 || descLength > 160) {
      analysis += `❌ Description length: ${descLength} chars (OPTIMIZE to 50-160 for +1.5 points)\n`
    } else {
      analysis += `✅ Description length: ${descLength} chars (optimal range)\n`
    }

    if (typeof schema.image === 'string') {
      analysis += `❌ Image is string (CONVERT to ImageObject for +1.5 points)\n`
    } else if (schema.image?.['@type'] === 'ImageObject') {
      analysis += `✅ Image is ImageObject (optimized)\n`
    }

    if (schema.publisher && !schema.publisher.logo) {
      analysis += `❌ Publisher missing logo (ADD for +1.5 points)\n`
    } else if (schema.publisher?.logo) {
      analysis += `✅ Publisher has logo (optimized)\n`
    }

    // Check author structure and sameAs enhancement
    if (schema.author && typeof schema.author === 'object') {
      if (!schema.author.sameAs) {
        analysis += `❌ Author without sameAs links (ADD social profiles for +1.5 points)\n`
      } else {
        analysis += `✅ Author with sameAs links (optimized)\n`
      }
    } else if (schema.author) {
      analysis += `❌ Author is string (CONVERT to Person object with sameAs for +2.0 points)\n`
    }

    // Phase 3: Enhancement Opportunities Section
    if (enhanceableAeo.length > 0) {
      analysis += '\n🔧 ENHANCEMENT OPPORTUNITIES (Properties that exist but can be improved):\n'
      enhanceableAeo.forEach(enhancement => {
        const pointsInfo = enhancement.points > 0 ? ` [+${enhancement.points} points]` : ''
        analysis += `⚠️  ${enhancement.name}: ${enhancement.reason}${pointsInfo}\n`
      })
    }

    // Priority recommendations
    analysis += '\n⚡ TOP PRIORITY ACTIONS FOR THIS REFINEMENT:\n'
    let priority = 1

    // Phase 3: Prioritize wordCount if it's enhanceable (HIGH VALUE for 2nd refinement)
    const wordCountEnhancement = enhanceableAeo.find(e => e.name === 'wordCount')
    if (wordCountEnhancement) {
      analysis += `${priority++}. 🎯 ADD wordCount property using page data (${pageData?.metadata?.wordCount} words) - Worth ${wordCountEnhancement.points} points [HIGH PRIORITY]\n`
    }

    // Highest value missing properties first
    if (missingRecommended.length > 0) {
      analysis += `${priority++}. Add missing SAFE recommended properties (${missingRecommended.join(', ')}) - Worth ~3.6 points EACH\n`
    }

    if (descLength < 50 || descLength > 160) {
      analysis += `${priority++}. Optimize description to 50-160 characters - Worth ~1.5 points\n`
    }

    if (typeof schema.image === 'string') {
      analysis += `${priority++}. Convert image string to ImageObject - Worth ~1.5 points\n`
    }

    if (missingAeo.length > 0) {
      analysis += `${priority++}. Add missing SAFE AEO properties (${missingAeo.slice(0, 3).join(', ')}) - Worth ~2.1 points EACH\n`
    }

    if (schema.publisher && !schema.publisher.logo) {
      analysis += `${priority++}. Add publisher.logo ImageObject - Worth ~1.5 points\n`
    }

    if (schema.author && typeof schema.author === 'object' && !schema.author.sameAs) {
      analysis += `${priority++}. Add author.sameAs social profile links - Worth ~1.5 points\n`
    }

    // Add specific guidance for high-value properties
    analysis += '\n💡 IMPLEMENTATION GUIDANCE:\n'

    if (!schema.isPartOf && missingAeo.includes('isPartOf')) {
      analysis += `\n📍 isPartOf Structure (~2.1 points):\n`
      analysis += `"isPartOf": {\n`
      analysis += `  "@type": "WebSite",\n`
      analysis += `  "name": "[Site name from page data]",\n`
      analysis += `  "url": "[Base URL without path]"\n`
      analysis += `}\n`
    }

    if (!schema.articleSection && hasH2Sections) {
      analysis += `\n📑 articleSection: Use the FIRST H2 heading from ARTICLE SECTIONS data as the primary category (~2.1 points)\n`
    }

    if (!schema.wordCount && hasWordCount) {
      analysis += `\n📊 wordCount (~2.1 points) - HIGH PRIORITY:\n`
      analysis += `"wordCount": ${pageData?.metadata?.wordCount}\n`
      analysis += `⚠️  This is a SAFE property with verified data - ADD IT!\n`
    }

    if (schema.author && typeof schema.author === 'object' && !schema.author.sameAs) {
      analysis += `\n👤 author.sameAs Enhancement (~1.5 points):\n`
      analysis += `ONLY add if you can infer from page data (social icons, author bio sections).\n`
      analysis += `Never fabricate social URLs. If uncertain, skip this enhancement.\n`
    }

    return analysis
  }

  async refineSchemas(schemas: JsonLdSchema[], url: string, options?: { originalMetadata?: any, refinementCount?: number }): Promise<{ schemas: JsonLdSchema[], changes: string[] }> {
    const refinementCount = options?.refinementCount || 1
    console.log(`🤖 AI refining schemas (refinement #${refinementCount}) with intelligent enhancements...`)

    // Initialize client lazily
    const client = this.initializeClient()

    if (!client) {
      console.error('OpenAI client not initialized')
      throw new Error('OpenAI service is not properly configured')
    }

    try {
      const schemaType = schemas[0]['@type']
      const originalMetadata = options?.originalMetadata

      // Build rich page context from ContentAnalysis
      let pageDataContext = ''
      if (originalMetadata) {
        // Build available page data section with all the rich content
        const availableData: string[] = []

        // Keywords from page content
        if (originalMetadata.metadata?.keywords?.length) {
          availableData.push(`📌 KEYWORDS from page content: ${JSON.stringify(originalMetadata.metadata.keywords)}`)
        }

        // Article sections (H2 headings)
        if (originalMetadata.metadata?.articleSections?.length) {
          availableData.push(`📑 ARTICLE SECTIONS (H2 headings): ${JSON.stringify(originalMetadata.metadata.articleSections)}`)
        }

        // Word count
        if (originalMetadata.metadata?.wordCount) {
          availableData.push(`📊 WORD COUNT: ${originalMetadata.metadata.wordCount} words`)
        }

        // Language
        if (originalMetadata.metadata?.language) {
          availableData.push(`🌐 LANGUAGE: "${originalMetadata.metadata.language}"`)
        }

        // Featured image info
        if (originalMetadata.metadata?.imageInfo?.featuredImage) {
          availableData.push(`🖼️ FEATURED IMAGE: "${originalMetadata.metadata.imageInfo.featuredImage}"${originalMetadata.metadata.imageInfo.featuredImageAlt ? ` (alt: "${originalMetadata.metadata.imageInfo.featuredImageAlt}")` : ''}`)
        }

        // All images available
        if (originalMetadata.metadata?.imageInfo?.allImages?.length) {
          const imageList = originalMetadata.metadata.imageInfo.allImages.slice(0, 5).map((img: any) =>
            `  - ${img.url}${img.alt ? ` (alt: "${img.alt}")` : ''}`
          ).join('\n')
          availableData.push(`📸 AVAILABLE IMAGES (${originalMetadata.metadata.imageInfo.imageCount} total, showing first 5):\n${imageList}`)
        }

        // Entities/topics mentioned
        if (originalMetadata.metadata?.entities?.length) {
          availableData.push(`🏷️ ENTITIES/TOPICS mentioned in content: ${JSON.stringify(originalMetadata.metadata.entities.slice(0, 10))}`)
        }

        // Reading time
        if (originalMetadata.metadata?.readingTime) {
          availableData.push(`⏱️ READING TIME: ${originalMetadata.metadata.readingTime} minutes`)
        }

        // Build verification metadata (small subset for protected properties)
        const verificationData = {
          author: originalMetadata.author || originalMetadata.metadata?.author || '[NOT FOUND - DO NOT ADD]',
          publishDate: originalMetadata.publishDate || originalMetadata.metadata?.publishDate || '[NOT FOUND - DO NOT ADD]',
          modifiedDate: originalMetadata.modifiedDate || originalMetadata.metadata?.modifiedDate || '[NOT FOUND - DO NOT ADD]'
        }

        pageDataContext = `

📦 AVAILABLE PAGE DATA FOR SAFE ENHANCEMENTS:

${availableData.join('\n\n')}

${availableData.length > 0 ? `

✅ SAFE TO USE: All data above was extracted from the actual page content. You can confidently use this data to enhance the schema.

` : ''}
🔒 VERIFICATION-REQUIRED METADATA (use only if present):
${JSON.stringify(verificationData, null, 2)}

⚠️ PROTECTED PROPERTIES RULE: Only add author/dates if they exist in verification metadata above (not "[NOT FOUND]")`
      }

      // Generate dynamic property analysis for this specific schema
      const propertyAnalysis = this.analyzeSchemaOpportunities(schemas[0], originalMetadata)
      console.log(`\n📊 PROPERTY ANALYSIS FOR REFINEMENT #${refinementCount}:\n${propertyAnalysis}\n`)

      // Create a detailed prompt for AI refinement
      const refinementPrompt = `You are an expert in Schema.org structured data and SEO best practices. Your task is to enhance the following JSON-LD schema to achieve the highest possible quality score (aiming for grade A).

CURRENT SCHEMA:
${JSON.stringify(schemas[0], null, 2)}

ORIGINAL URL: ${url}${pageDataContext}

⚡ QUALITY SCORE OPTIMIZATION STRATEGY ⚡

The schema is scored on 4 weighted categories:
- Required Properties (35%): @context, @type, name/headline
- Recommended Properties (25%): description, url, image, author, publisher, datePublished, dateModified (7 properties, each worth ~3.6 points)
- Advanced AEO Features (25%): keywords, about, mentions, sameAs, inLanguage, articleSection, wordCount, isPartOf, mainEntityOfPage, aggregateRating, review (11 properties, each worth ~2.3 points)
- Content Quality (15%): Description length, structured objects, image quality

⚠️ CRITICAL SCORING MECHANIC:
- The score COUNTS UNIQUE PROPERTIES, NOT ARRAY LENGTH
- Adding 5 more keywords to existing "keywords" array = +0 points (property already exists)
- Adding NEW property like "wordCount" = +2.1 points (new AEO property)
- AVOID wasting effort on expanding existing arrays - focus on MISSING properties!
${propertyAnalysis}

🎯 YOUR TASK FOR THIS REFINEMENT:

Follow the "⚡ TOP PRIORITY ACTIONS" list above from the property analysis. These are the HIGHEST VALUE changes you can make for this specific schema.

**GENERAL REFINEMENT GUIDELINES:**

1. **Focus on MISSING SCORED properties** (marked ❌ in analysis above)
   - Each missing AEO property = ~2.1 points when added
   - Each missing Recommended property = ~3.6 points when added
   - PRIORITIZE properties marked 🟢 SAFE (no verification needed)
   - AVOID properties marked 🔴 RISKY unless verified in metadata

2. **Description Length Optimization** (Worth ~1.5 overall points if needed)
   - Current description length: ${schemas[0].description?.length || 0} characters
   - OPTIMAL: 50-160 characters gets 20/100 content quality points
   - TOO SHORT (<50) or TOO LONG (>160): Gets only 10/100 content quality points
   - ACTION: If not in optimal range, rewrite to fit 50-160 chars
   - ⚠️ DO NOT make descriptions longer if they're already 50-160 characters!

3. **Convert Strings to Structured Objects** (Worth ~1.5 points each)
   - If image is a string: Convert to {"@type": "ImageObject", "url": "..."}
   - If publisher exists but no logo: Add {"@type": "ImageObject", "url": "..."} to publisher.logo
   - DO NOT convert author to object (violates anti-hallucination rules unless verified)

⚠️ PROPERTIES THAT ADD +0 POINTS (DO NOT WASTE TIME ON THESE):
- breadcrumb (not scored)
- potentialAction (not scored)
- Expanding existing arrays (e.g., adding more items to existing "keywords" array)
- Properties already marked ✅ in the analysis above (already exist, adding them again = +0)

🚫 ANTI-HALLUCINATION PROTOCOL - CRITICAL RULES:
❌ NEVER add "author" property unless verified in ORIGINAL SCRAPED METADATA above
❌ NEVER add "datePublished" or "dateModified" unless verified in ORIGINAL SCRAPED METADATA above
❌ NEVER add organization "address", "founder", "telephone", "email" unless verified in metadata
❌ NEVER invent person names, social media profiles, or contact information
❌ NEVER use placeholder values like "John Doe", "Jane Doe", "example.com", "[Your Company]"
❌ NEVER add specific factual claims not present in the original schema or metadata
❌ If metadata shows "[NOT FOUND]" for a field, DO NOT ADD that property
❌ DO NOT make descriptions longer if they're already 50-160 characters!

🚨 **PROPERTY-TYPE RESTRICTIONS (CRITICAL - validator.schema.org compliance):**
❌ articleSection: ONLY for Article/BlogPosting/NewsArticle - NEVER add to WebPage
❌ articleBody: ONLY for Article types - NEVER add to WebPage
❌ wordCount: ONLY for Article/BlogPosting/CreativeWork types - NEVER add to WebPage
❌ speakable: DO NOT ADD - causes CSS selector validation errors
❌ headline: Use for Article types; WebPage should use "name" instead

⚠️ FOR WEBPAGE SCHEMAS: Do NOT add articleSection, articleBody, wordCount, or speakable!
These properties will FAIL validation at validator.schema.org for WebPage type.

✅ ALLOWED ENHANCEMENTS:
✅ OPTIMIZE description to 50-160 characters (HIGHEST PRIORITY)
✅ Add inLanguage: "en" (safe, no verification needed)
✅ Add mainEntityOfPage for articles (safe structural property)
✅ Convert image strings to ImageObject (structure improvement)
✅ Add logo to publisher if publisher exists (structure improvement)
✅ Add relevant keywords to keyword/about/mentions arrays
✅ Add Schema.org structural properties: breadcrumb, isPartOf, potentialAction
✅ Add wordCount, articleSection ONLY for Article/BlogPosting types (NOT WebPage!)

IMPORTANT RULES:
1. Return ONLY valid JSON (no markdown, no explanations)
2. Keep the @context and @type unchanged
3. ⚠️ CRITICAL: PRESERVE ALL existing properties - do NOT remove anything from the original schema
4. Only add properties that are valid for this schema type according to Schema.org
5. PRIORITIZE description length optimization - this alone can add 10 content quality points!
6. Focus on high-impact changes first, low-impact changes last
7. When uncertain about NEW factual data you want to ADD, don't add it - but KEEP all existing properties

Return the enhanced schema as a JSON object, followed by a summary of changes made.

FORMAT YOUR RESPONSE AS:
{
  "schema": { enhanced schema here },
  "changes": ["Change 1", "Change 2", ...]
}`

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Schema.org structured data, SEO, and Answer Engine Optimization (AEO). You provide precise, valid JSON-LD schemas that follow all best practices.

🔒 CRITICAL ANTI-HALLUCINATION RULES:
- NEVER invent author names, social profiles, or contact details
- NEVER add factual information not verified in provided metadata
- NEVER use placeholder values like "John Doe" or "example.com"
- ONLY add new factual properties if explicitly provided in the original metadata
- When uncertain about NEW factual data you want to add, don't add it
- ⚠️ CRITICAL: NEVER remove existing properties - only enhance and add to the schema
- Focus on enhancing structure and SEO, not inventing facts

🚨 PROPERTY-TYPE RESTRICTIONS (validator.schema.org compliance):
- articleSection, articleBody, wordCount: ONLY for Article/BlogPosting types - NEVER for WebPage
- speakable: NEVER add this property (causes validation errors)
- For WebPage schemas: use "name" instead of "headline"`
          },
          {
            role: 'user',
            content: refinementPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, accurate output
        response_format: { type: 'json_object' }
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      const result = JSON.parse(responseContent)

      // Extract the refined schema and changes
      let refinedSchema = result.schema || result
      const changes = result.changes || ['Schema enhanced with AI improvements']

      // Validate and sanitize the refined schema to prevent hallucinations
      const originalSchema = schemas[0]
      refinedSchema = validateRefinedSchema(originalSchema, refinedSchema, originalMetadata, refinementCount)

      // Sanitize for Schema.org compliance (remove invalid properties for schema type)
      const sanitizationResult = sanitizeSchemaProperties(refinedSchema as JsonLdSchema)
      if (sanitizationResult.wasModified) {
        console.log(`🧹 [Refinement] Sanitized schema - removed ${sanitizationResult.removedProperties.length} invalid properties:`)
        sanitizationResult.removedProperties.forEach(removal => {
          console.log(`   - ${removal.property}: ${removal.message}`)
        })
        refinedSchema = sanitizationResult.schema
      }

      console.log(`✅ AI refinement completed with ${changes.length} improvements`)
      console.log('📝 Changes made:', changes)

      return {
        schemas: [refinedSchema],
        changes
      }

    } catch (error) {
      console.error('❌ AI refinement failed:', error)

      // Fallback to basic refinement if AI fails
      console.log('⚠️ Falling back to basic refinement')
      const changes: string[] = []
      const refinedSchemas = schemas.map(schema => {
        const refined = { ...schema }
        if (!refined.url) {
          refined.url = url
          changes.push('Added "url" property')
        }
        return refined
      })

      return { schemas: refinedSchemas, changes }
    }
  }
}

export const openaiService = new OpenAIService()