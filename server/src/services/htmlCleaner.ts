import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'

// Enhanced metadata extraction with comprehensive coverage
export interface EnhancedMetadata {
  // Core page metadata
  title: string
  description: string
  canonicalUrl: string
  language: string

  // Open Graph metadata (complete extraction)
  openGraph: {
    title?: string
    description?: string
    image?: string
    imageAlt?: string
    type?: string
    siteName?: string
    url?: string
    locale?: string
  }

  // Twitter Card metadata (complete extraction)
  twitterCard: {
    card?: string
    title?: string
    description?: string
    image?: string
    imageAlt?: string
    site?: string
    creator?: string
  }

  // Author information (enriched from multiple sources)
  author: {
    name?: string
    url?: string
    jobTitle?: string
    worksFor?: string
    image?: string
    bio?: string
    socialProfiles?: string[]
  } | null

  // Publication metadata
  publishDate?: string
  modifiedDate?: string
  articleSection?: string
  articleSections: string[] // Array of H2 headings
  tags: string[]
  keywords: string[]

  // Image metadata (comprehensive)
  images: {
    featured?: {
      url: string
      alt?: string
      caption?: string
      width?: number
      height?: number
    }
    all: Array<{
      url: string
      alt?: string
      caption?: string
      width?: number
      height?: number
    }>
  }

  // Video metadata (comprehensive)
  videos: Array<{
    url: string
    embedUrl?: string
    provider?: string  // youtube, vimeo, wistia, hubspot, etc.
    title?: string
    description?: string
    thumbnailUrl?: string
    duration?: string
    width?: number
    height?: number
  }>

  // Existing JSON-LD structured data
  existingJsonLd: any[]

  // Business/Organization information
  business: {
    name?: string
    type?: string
    logo?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    socialProfiles?: string[]
  } | null

  // Content analysis
  contentAnalysis: {
    type: 'article' | 'product' | 'homepage' | 'about' | 'contact' | 'blog' | 'news' | 'faq' | 'unknown'
    wordCount: number
    readingTime: number
    hasVideoContent: boolean
    hasFaqContent: boolean
    hasProductContent: boolean
    hasContactInfo: boolean
  }

  // Legacy compatibility
  wordCount?: number  // Duplicate of contentAnalysis.wordCount for backwards compatibility

  // SEO and technical metadata
  technical: {
    robots?: string
    viewport?: string
    alternateLanguages: Array<{ lang: string; url: string }>
    breadcrumbs: Array<{ name: string; url?: string }>
  }
}

// Structured content format optimized for LLM processing
export interface StructuredContent {
  hierarchy: ContentNode[]
  cleanText: string
  metadata: EnhancedMetadata
  originalLength: number
  processedLength: number
  tokenEstimate: number
  contentQualitySuggestions?: string[]
}

export interface ContentNode {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code' | 'table' | 'image' | 'video'
  level?: number // for headings (1-6)
  content: string
  attributes?: {
    alt?: string // for images
    caption?: string
    url?: string // for links/images
    items?: string[] // for lists
  }
}

class HtmlCleaningService {

  /**
   * Main processing function that converts raw HTML into optimized structured content
   * Following expert recommendations for token efficiency and LLM optimization
   */
  async processHtml(html: string, url: string): Promise<StructuredContent> {
    console.log('🧹 Starting advanced HTML cleaning and structuring...')

    const startTime = Date.now()
    const originalLength = html.length

    // Load HTML with Cheerio for advanced manipulation
    const $ = cheerio.load(html)

    // Phase 1: Extract comprehensive metadata BEFORE cleaning
    console.log('📊 Phase 1: Extracting comprehensive metadata...')
    const metadata = await this.extractEnhancedMetadata($, url)

    // Phase 2: Clean and remove unwanted elements
    console.log('🗑️ Phase 2: Cleaning unwanted HTML elements...')
    this.removeUnwantedElements($)

    // Phase 3: Extract structured content hierarchy
    console.log('🏗️ Phase 3: Building structured content hierarchy...')
    const hierarchy = this.extractContentHierarchy($)

    // Phase 4: Generate clean text optimized for LLM processing
    console.log('📝 Phase 4: Generating clean text for LLM...')
    const cleanText = this.generateCleanText(hierarchy)

    // Phase 5: Intelligent truncation at content boundaries (increased to 100,000 for better AI context)
    console.log('✂️ Phase 5: Applying intelligent truncation...')
    const { truncatedHierarchy, truncatedText } = this.intelligentTruncation(hierarchy, cleanText, 100000)

    // Phase 6: Enhance metadata from extracted content
    console.log('🔍 Phase 6: Enhancing metadata from extracted content...')
    const enhancedMetadata = this.enhanceMetadataFromContent(metadata, truncatedText, truncatedHierarchy)

    const processedLength = truncatedText.length
    const tokenEstimate = Math.ceil(processedLength / 4) // Rough token estimation

    console.log(`✅ HTML processing completed in ${Date.now() - startTime}ms`)
    console.log(`📏 Size reduction: ${originalLength} → ${processedLength} chars (${Math.round((1 - processedLength/originalLength) * 100)}% reduction)`)
    console.log(`🎯 Estimated tokens: ${tokenEstimate}`)

    // Generate content quality suggestions
    const suggestions: string[] = []

    // Check for missing H2/H3 headings
    const hasH2 = truncatedHierarchy.some(node => node.type === 'heading' && node.level === 2)
    const hasH3 = truncatedHierarchy.some(node => node.type === 'heading' && node.level === 3)
    if (!hasH2 && !hasH3) {
      suggestions.push('Consider adding H2 or H3 headings to improve content structure and SEO. Well-structured headings help search engines understand your content better.')
    }

    // Check for short content
    if (enhancedMetadata.wordCount && enhancedMetadata.wordCount < 300) {
      suggestions.push(`Content is quite short (${enhancedMetadata.wordCount} words). Consider expanding to at least 300 words for better SEO performance.`)
    }

    // Check for missing author
    if (!enhancedMetadata.author?.name) {
      suggestions.push('Add author information to your article for better entity recognition and trust signals.')
    }

    // Check for missing dates
    if (!enhancedMetadata.publishDate) {
      suggestions.push('Add a publication date to improve temporal relevance signals.')
    }

    return {
      hierarchy: truncatedHierarchy,
      cleanText: truncatedText,
      metadata: enhancedMetadata,
      originalLength,
      processedLength,
      tokenEstimate,
      contentQualitySuggestions: suggestions
    }
  }

  /**
   * Extract comprehensive metadata following expert recommendations
   * Covers Open Graph, Twitter Cards, JSON-LD, and more
   */
  private async extractEnhancedMetadata($: CheerioAPI, url: string): Promise<EnhancedMetadata> {
    // Core page metadata with diagnostic logging
    console.log('\n🔍 ========== HTML CLEANER METADATA EXTRACTION ==========')

    // Title extraction with source tracking
    const titleTag = $('title').text().trim()
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')

    let title = ''
    let titleSource = ''

    if (titleTag) {
      title = titleTag
      titleSource = '<title> tag'
    } else if (ogTitle) {
      title = ogTitle
      titleSource = 'og:title'
    } else if (twitterTitle) {
      title = twitterTitle
      titleSource = 'twitter:title'
    }

    console.log('📄 TITLE EXTRACTION:')
    console.log('  Source used:', titleSource || '[NONE FOUND]')
    console.log('  Extracted value:', title || '[EMPTY]')
    console.log('  Available sources:')
    console.log('    <title> tag:', titleTag || '[EMPTY]')
    console.log('    og:title:', ogTitle || '[EMPTY]')
    console.log('    twitter:title:', twitterTitle || '[EMPTY]')

    // Description extraction with source tracking
    const metaDescription = $('meta[name="description"]').attr('content')
    const ogDescription = $('meta[property="og:description"]').attr('content')
    const twitterDescription = $('meta[name="twitter:description"]').attr('content')

    let description = ''
    let descriptionSource = ''

    if (metaDescription) {
      description = metaDescription
      descriptionSource = 'meta[name="description"]'
    } else if (ogDescription) {
      description = ogDescription
      descriptionSource = 'og:description'
    } else if (twitterDescription) {
      description = twitterDescription
      descriptionSource = 'twitter:description'
    }

    console.log('\n📝 DESCRIPTION EXTRACTION:')
    console.log('  Source used:', descriptionSource || '[NONE FOUND]')
    console.log('  Extracted value:', description || '[EMPTY]')
    console.log('  Available sources:')
    console.log('    meta[name="description"]:', metaDescription || '[EMPTY]')
    console.log('    og:description:', ogDescription || '[EMPTY]')
    console.log('    twitter:description:', twitterDescription || '[EMPTY]')
    console.log('🔍 =====================================================\n')

    const canonicalUrl = $('link[rel="canonical"]').attr('href') || url
    const language = $('html').attr('lang') || $('meta[property="og:locale"]').attr('content') || 'en'

    // Open Graph metadata (complete extraction)
    const openGraph = {
      title: $('meta[property="og:title"]').attr('content'),
      description: $('meta[property="og:description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content'),
      imageAlt: $('meta[property="og:image:alt"]').attr('content'),
      type: $('meta[property="og:type"]').attr('content'),
      siteName: $('meta[property="og:site_name"]').attr('content'),
      url: $('meta[property="og:url"]').attr('content'),
      locale: $('meta[property="og:locale"]').attr('content')
    }

    // Twitter Card metadata (complete extraction)
    const twitterCard = {
      card: $('meta[name="twitter:card"]').attr('content'),
      title: $('meta[name="twitter:title"]').attr('content'),
      description: $('meta[name="twitter:description"]').attr('content'),
      image: $('meta[name="twitter:image"]').attr('content'),
      imageAlt: $('meta[name="twitter:image:alt"]').attr('content'),
      site: $('meta[name="twitter:site"]').attr('content'),
      creator: $('meta[name="twitter:creator"]').attr('content')
    }

    // Enhanced author extraction from multiple sources
    const author = this.extractAuthorInfo($)

    // Existing JSON-LD structured data (extract early to use for metadata)
    const existingJsonLd = this.extractExistingJsonLd($)

    // Publication metadata - extract from JSON-LD first, then fallback to meta tags
    let publishDate = $('meta[property="article:published_time"]').attr('content') ||
                      $('meta[name="date"]').attr('content') ||
                      $('meta[name="publish_date"]').attr('content') ||
                      $('meta[name="publishdate"]').attr('content') ||
                      $('time[itemprop="datePublished"]').attr('datetime') ||
                      $('time[datetime]').first().attr('datetime') ||
                      $('[itemprop="datePublished"]').attr('content') ||
                      $('[itemprop="datePublished"]').attr('datetime') ||
                      $('.blog-post__published-date time').attr('datetime') || // HubSpot
                      $('[class*="publish-date"] time').attr('datetime')

    let modifiedDate = $('meta[property="article:modified_time"]').attr('content') ||
                       $('meta[name="last-modified"]').attr('content') ||
                       $('time[itemprop="dateModified"]').attr('datetime') ||
                       $('[itemprop="dateModified"]').attr('content') ||
                       $('[itemprop="dateModified"]').attr('datetime') ||
                       $('.blog-post__updated-date time').attr('datetime') // HubSpot

    // Try to extract from JSON-LD if not found
    if (!publishDate || !modifiedDate) {
      existingJsonLd.forEach(data => {
        if (!publishDate && data.datePublished) publishDate = data.datePublished
        if (!modifiedDate && data.dateModified) modifiedDate = data.dateModified
      })
    }

    // Last resort: Try to parse date from visible text patterns
    if (!publishDate) {
      const dateSelectors = [
        '.blog-post__date',
        '.post-date',
        '[class*="publish"]',
        '[class*="date"]',
        'time',
        'article p',  // Check article paragraphs
        'main p',     // Check main paragraphs
        '.post-content p',  // Post content paragraphs
        '.entry-content p'  // Entry content paragraphs
      ]

      for (const selector of dateSelectors) {
        const dateText = $(selector).first().text().trim()
        if (dateText) {
          // Try to match common date formats: "September 25, 2025", "Sep 25, 2025", "2025-09-25"
          const dateMatch = dateText.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2}/)
          if (dateMatch) {
            try {
              publishDate = new Date(dateMatch[0]).toISOString().split('T')[0]
              console.log(`📅 Extracted publish date from visible text: ${publishDate}`)
              break
            } catch (e) {
              // Invalid date, continue
            }
          }
        }
      }
    }

    // Extract article sections from H2 headings for better schema structure
    const articleSections: string[] = []
    const h2Selectors = [
      'main h2',
      'article h2',
      '.content h2',
      '.post-content h2',
      '.entry-content h2',
      '.article-content h2',
      '.post-body h2',
      '.blog-post h2',
      'body h2'  // Fallback to all h2s
    ]

    for (const selector of h2Selectors) {
      const $h2s = $(selector)
      if ($h2s.length > 0) {
        console.log(`📑 Found ${$h2s.length} H2 headings using selector: ${selector}`)
        $h2s.each((_, h2) => {
          const sectionTitle = $(h2).text().trim()
          if (sectionTitle && sectionTitle.length > 3 && sectionTitle.length < 100) {
            articleSections.push(sectionTitle)
          }
        })
        break  // Stop after first successful selector
      }
    }

    console.log(`📑 Extracted ${articleSections.length} article sections:`, articleSections.slice(0, 5))

    const articleSection = $('meta[property="article:section"]').attr('content') ||
                          $('[itemprop="articleSection"]').text().trim() ||
                          (articleSections.length > 0 ? articleSections[0] : undefined)

    // Tags and keywords
    const tags = this.extractTags($)
    const keywords = this.extractKeywords($)

    // Image metadata
    const images = this.extractImageMetadata($)

    // Video metadata
    const videos = this.extractVideoMetadata($)

    // Business information
    const business = this.extractBusinessInfo($)

    // Content analysis
    const contentAnalysis = this.analyzeContentType($, url)

    // Technical metadata
    const technical = {
      robots: $('meta[name="robots"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      alternateLanguages: this.extractAlternateLanguages($),
      breadcrumbs: this.extractBreadcrumbs($)
    }

    return {
      title,
      description,
      canonicalUrl,
      language,
      openGraph,
      twitterCard,
      author,
      publishDate,
      modifiedDate,
      articleSection,
      articleSections,
      tags,
      keywords,
      images,
      videos,
      existingJsonLd,
      business,
      contentAnalysis,
      technical
    }
  }

  /**
   * Enhance metadata by extracting missing fields from the processed content
   * This runs AFTER content extraction to catch data that wasn't in meta tags
   */
  private enhanceMetadataFromContent(
    metadata: EnhancedMetadata,
    cleanText: string,
    hierarchy: ContentNode[]
  ): EnhancedMetadata {
    const enhanced = { ...metadata }

    // 1. Extract author name from content if missing or incomplete
    // IMPORTANT: Be very strict to avoid extracting random content as author name
    if (!enhanced.author?.name || enhanced.author.name.split(' ').length < 2) {
      // Look for "By: Author Name" or byline patterns, NOT regular content
      // Must have "by" keyword to avoid matching random content
      const authorPatterns = [
        /(?:by|author|written\s+by)[:\s]+([A-Z][a-z]+(?:[-‑][A-Z][a-z]+)*(?:\s+[A-Z][a-z]+(?:[-‑][A-Z][a-z]+)*)+)/i,
        /P:\s+By\s+([A-Z][a-z]+(?:[-‑][A-Z][a-z]+)*(?:\s+[A-Z][a-z]+(?:[-‑][A-Z][a-z]+)*)+)/i
      ]

      let fullName = null
      for (const pattern of authorPatterns) {
        const authorMatch = cleanText.match(pattern)
        if (authorMatch) {
          fullName = authorMatch[1].trim()

          // STRICT VALIDATION: Must be 2-4 words and not contain common non-name words
          const words = fullName.split(/\s+/)
          const nonNameWords = ['team', 'staff', 'department', 'company', 'website', 'process', 'service', 'our', 'the', 'and', 'richmond', 'services']
          const hasNonNameWord = nonNameWords.some(word => fullName.toLowerCase().includes(word))

          if (words.length >= 2 && words.length <= 4 && !hasNonNameWord) {
            break
          } else {
            console.log(`⚠️ Rejected potential author in content (invalid): ${fullName}`)
            fullName = null // Reset if invalid
          }
        }
      }

      if (fullName) {
        if (!enhanced.author) {
          enhanced.author = { name: fullName, socialProfiles: [] }
        } else {
          // Preserve existing image, URL, and other properties
          enhanced.author = {
            ...enhanced.author,
            name: fullName
          }
        }
        console.log(`✍️ Enhanced author from content: ${fullName}`)
      } else {
        console.log(`⚠️ No valid author found in content (strict validation)`)
      }
    }

    // 1b. Try to find author image from hierarchy if missing
    if (enhanced.author && !enhanced.author.image) {
      console.log(`🔍 Looking for author image in hierarchy. Author name: ${enhanced.author.name}`)
      const authorImageNode = hierarchy.find(node => {
        if (node.type !== 'image') return false
        const content = node.content?.toLowerCase() || ''
        const authorName = enhanced.author!.name?.toLowerCase() || ''
        const hasAuthorKeyword = content.includes('author')
        const hasAuthorName = authorName && content.includes(authorName)
        console.log(`  📷 Checking image: ${node.content} (hasAuthor=${hasAuthorKeyword}, hasName=${hasAuthorName})`)
        return hasAuthorKeyword || hasAuthorName
      })
      if (authorImageNode?.attributes?.url) {
        enhanced.author.image = authorImageNode.attributes.url
        console.log(`📸 Enhanced author image: ${authorImageNode.attributes.url}`)
      } else {
        console.log(`❌ No author image found in hierarchy`)
      }
    }

    // 2. Extract publish date from content if missing
    if (!enhanced.publishDate) {
      // Look for common date formats in content
      const datePatterns = [
        /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i,
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i,
        /\d{4}-\d{2}-\d{2}/
      ]

      for (const pattern of datePatterns) {
        const dateMatch = cleanText.match(pattern)
        if (dateMatch) {
          try {
            const parsedDate = new Date(dateMatch[0])
            if (!isNaN(parsedDate.getTime())) {
              enhanced.publishDate = parsedDate.toISOString().split('T')[0]
              console.log(`📅 Enhanced publish date from content: ${enhanced.publishDate}`)
              break
            }
          } catch (e) {
            // Invalid date, continue to next pattern
          }
        }
      }
    }

    // 3. Set modifiedDate to publishDate if missing (common fallback)
    if (!enhanced.modifiedDate && enhanced.publishDate) {
      enhanced.modifiedDate = enhanced.publishDate
      console.log(`📅 Set modifiedDate to publishDate: ${enhanced.modifiedDate}`)
    }

    // 4. Extract H2 headings from hierarchy for articleSections if empty
    if (enhanced.articleSections.length === 0) {
      // Debug: Show what headings are available
      const allHeadings = hierarchy.filter(node => node.type === 'heading')
      console.log(`🔍 Available headings in hierarchy: ${allHeadings.length} total`)
      if (allHeadings.length > 0) {
        console.log(`  Heading levels: ${allHeadings.map(h => `H${h.level}`).join(', ')}`)
        console.log(`  Sample headings: ${allHeadings.slice(0, 3).map(h => `"${h.content}"`).join(', ')}`)
      }

      const h2Headings = hierarchy
        .filter(node => node.type === 'heading' && node.level === 2)
        .map(node => node.content)
        .filter(content => content.length > 3 && content.length < 100)

      if (h2Headings.length > 0) {
        enhanced.articleSections = h2Headings
        console.log(`📑 Enhanced article sections from H2 hierarchy: ${h2Headings.length} sections`)
      } else {
        // Fallback to H3 headings if no H2s found
        const h3Headings = hierarchy
          .filter(node => node.type === 'heading' && node.level === 3)
          .map(node => node.content)
          .filter(content => content.length > 3 && content.length < 100)

        if (h3Headings.length > 0) {
          enhanced.articleSections = h3Headings
          console.log(`📑 Enhanced article sections from H3 fallback: ${h3Headings.length} sections`)
        } else {
          // Fallback to H4 or even H1 if no H2/H3 found
          const h4Headings = hierarchy
            .filter(node => node.type === 'heading' && node.level === 4)
            .map(node => node.content)
            .filter(content => content.length > 3 && content.length < 100)

          if (h4Headings.length > 0) {
            enhanced.articleSections = h4Headings.slice(0, 6) // Limit to 6
            console.log(`📑 Enhanced article sections from H4 fallback: ${h4Headings.length} sections`)
          } else {
            console.log(`⚠️ No suitable headings found for articleSections (checked H2, H3, H4)`)
          }
        }
      }
    }

    // 5. Enhance business/publisher name if missing or is just a domain
    if ((!enhanced.business?.name || enhanced.business.name.includes('.')) && enhanced.canonicalUrl) {
      // Try to extract brand name from domain intelligently
      // e.g., "blog.helpfulhero.com" → "Helpful Hero"
      //       "www.acme-corp.com" → "Acme Corp"
      try {
        const urlObj = new URL(enhanced.canonicalUrl)
        const hostname = urlObj.hostname.replace('www.', '').replace('blog.', '')
        const domainParts = hostname.split('.')[0] // Get main part before TLD

        // Convert domain to Title Case brand name
        // "helpfulhero" → "Helpful Hero"
        // "acme-corp" → "Acme Corp"
        let words: string[]

        // Check if domain has separators (hyphens/underscores)
        if (domainParts.includes('-') || domainParts.includes('_')) {
          words = domainParts.split(/[-_]/)
        } else {
          // Try to split camelCase or compound words intelligently
          // Look for common word boundaries in compound domains
          // "helpfulhero" → ["helpful", "hero"]
          // "acmecorp" → ["acme", "corp"]
          const commonWords = ['hero', 'corp', 'tech', 'digital', 'media', 'studio', 'labs', 'solutions', 'services', 'group', 'company', 'inc', 'llc', 'blog', 'site', 'web', 'net', 'hub', 'central', 'online', 'world', 'zone', 'spot']

          let remaining = domainParts
          const foundWords: string[] = []

          // Try to find common suffixes/words (only complete words >= 3 chars)
          for (const word of commonWords) {
            if (word.length >= 3 && remaining.endsWith(word) && remaining.length > word.length) {
              foundWords.unshift(word)
              remaining = remaining.slice(0, -word.length)
              break // Only match one suffix
            }
          }

          // Add the remaining part
          if (remaining) {
            foundWords.unshift(remaining)
          }

          words = foundWords.length > 1 ? foundWords : [domainParts]
        }

        const brandName = words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        if (brandName && brandName.length > 2 && brandName.length < 50) {
          if (!enhanced.business) {
            enhanced.business = { name: brandName }
          } else {
            enhanced.business.name = brandName
          }
          console.log(`🏢 Enhanced publisher name from domain "${hostname}" → "${brandName}"`)
        }
      } catch (e) {
        console.log(`⚠️ Failed to extract publisher name from URL: ${e}`)
      }
    }

    return enhanced
  }

  /**
   * Remove unwanted elements following expert recommendations
   * This dramatically reduces token usage and improves LLM focus
   * NOTE: Preserve author, date, and article metadata elements
   */
  private removeUnwantedElements($: CheerioAPI): void {
    // Remove scripts, styles, and non-content elements
    $('script, style, noscript, iframe, embed, object').remove()

    // Remove navigation, footer, aside (but keep header which might have author info)
    $('nav, footer, aside').remove()

    // Remove common non-content classes and IDs (but preserve author/byline elements)
    $([
      '.sidebar', '.menu', '.navigation', '.nav',
      '.ads', '.advertisement', '.ad-banner',
      '.social-share', '.share-buttons',
      '.comments', '.comment-section',
      '.popup', '.modal', '.overlay',
      '.cookie-banner', '.consent-banner',
      '.newsletter-signup', '.subscription',
      '.related-posts', '.recommended',
      '.tags-section',
      '#sidebar', '#menu', '#navigation',
      '#ads', '#comments', '#popup'
    ].join(', ')).remove()

    // Remove elements with common non-content attributes (but not author-related)
    $('[class*="ad-"]:not([class*="author"]):not([class*="date"])').remove()
    $('[class*="advertisement"]').remove()
    $('[id*="ad-"]:not([id*="author"])').remove()
    $('[class*="sidebar"]:not([class*="author"])').remove()
    $('[class*="popup"], [class*="modal"], [class*="overlay"]').remove()

    // Clean up link and meta tags that don't contain content
    $('link, meta').remove()

    // Remove empty elements (but preserve author/byline containers)
    $('*:not([class*="author"]):not([class*="byline"]):not([class*="date"]):not(time)').each((_, element) => {
      const $el = $(element)
      if ($el.children().length === 0 && $el.text().trim() === '') {
        $el.remove()
      }
    })
  }

  /**
   * Extract structured content hierarchy for optimal LLM processing
   * Creates a clean, hierarchical representation of the content
   */
  private extractContentHierarchy($: CheerioAPI): ContentNode[] {
    const hierarchy: ContentNode[] = []

    // Find the main content area using multiple strategies
    const mainContentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.post-body',
      '.blog-post',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.article-body',
      '#content',
      '#main',
      '.hsg-content-id-main-column' // HubSpot blog structure
    ]

    let $mainContent = $('body') // fallback
    for (const selector of mainContentSelectors) {
      const $candidate = $(selector)
      if ($candidate.length > 0) {
        $mainContent = $candidate.first()
        console.log(`📍 Found main content using selector: ${selector}`)
        break
      }
    }

    // Process each element in the main content
    // Use a Set to track already-processed elements to avoid duplicates
    const processedElements = new Set<string>()

    $mainContent.find('*').each((_, element) => {
      const $el = $(element)
      const tagName = element.tagName?.toLowerCase()

      // Create a unique identifier for this element based on content and position
      const elementId = `${tagName}-${$el.text().trim().substring(0, 50)}`

      // Skip if we've already processed this element
      if (processedElements.has(elementId)) return

      // Skip if this element is a direct parent of another element we're processing
      // (This prevents processing both <div> and its child <p> separately)
      const hasProcessedChild = Array.from(processedElements).some(id =>
        id.startsWith(tagName) && $el.text().includes(id.split('-')[1])
      )

      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const level = parseInt(tagName.substring(1))
          const headingText = $el.text().trim()
          if (headingText) {
            hierarchy.push({
              type: 'heading',
              level,
              content: headingText
            })
            processedElements.add(elementId)
          }
          break

        case 'p':
          const paragraphText = $el.text().trim()
          if (paragraphText && paragraphText.length > 20) { // Filter out very short paragraphs
            hierarchy.push({
              type: 'paragraph',
              content: paragraphText
            })
            processedElements.add(elementId)
          }
          break

        case 'ul':
        case 'ol':
          const listItems = $el.find('li').map((_, li) => $(li).text().trim()).get()
          if (listItems.length > 0) {
            hierarchy.push({
              type: 'list',
              content: `${tagName.toUpperCase()} with ${listItems.length} items`,
              attributes: { items: listItems }
            })
            processedElements.add(elementId)
          }
          break

        case 'blockquote':
          const quoteText = $el.text().trim()
          if (quoteText) {
            hierarchy.push({
              type: 'quote',
              content: quoteText
            })
            processedElements.add(elementId)
          }
          break

        case 'img':
          const imgSrc = $el.attr('src')
          const imgAlt = $el.attr('alt')
          if (imgSrc) {
            hierarchy.push({
              type: 'image',
              content: `Image: ${imgAlt || 'No alt text'}`,
              attributes: {
                url: imgSrc,
                alt: imgAlt
              }
            })
            processedElements.add(elementId)
          }
          break

        case 'table':
          const rowCount = $el.find('tr').length
          const colCount = $el.find('tr').first().find('td, th').length
          if (rowCount > 0) {
            hierarchy.push({
              type: 'table',
              content: `Table with ${rowCount} rows and ${colCount} columns`
            })
            processedElements.add(elementId)
          }
          break
      }
    })

    return hierarchy
  }

  /**
   * Generate clean text optimized for LLM processing
   * Follows expert recommendations for structured text format
   */
  private generateCleanText(hierarchy: ContentNode[]): string {
    const sections: string[] = []

    hierarchy.forEach(node => {
      switch (node.type) {
        case 'heading':
          sections.push(`${'#'.repeat(node.level || 1)} ${node.content}`)
          break

        case 'paragraph':
          sections.push(`P: ${node.content}`)
          break

        case 'list':
          sections.push(`LIST: ${node.content}`)
          if (node.attributes?.items) {
            node.attributes.items.forEach(item => {
              sections.push(`  - ${item}`)
            })
          }
          break

        case 'quote':
          sections.push(`QUOTE: ${node.content}`)
          break

        case 'image':
          sections.push(`IMAGE: ${node.content}`)
          break

        case 'table':
          sections.push(`TABLE: ${node.content}`)
          break

        default:
          sections.push(node.content)
      }
    })

    return sections.join('\n\n')
  }

  /**
   * Intelligent truncation at content boundaries following expert recommendations
   * Preserves complete sections and maintains readability
   */
  private intelligentTruncation(
    hierarchy: ContentNode[],
    cleanText: string,
    maxLength: number
  ): { truncatedHierarchy: ContentNode[], truncatedText: string } {

    if (cleanText.length <= maxLength) {
      return { truncatedHierarchy: hierarchy, truncatedText: cleanText }
    }

    console.log(`🔄 Applying intelligent truncation (${cleanText.length} → ${maxLength} chars)`)

    let currentLength = 0
    const truncatedHierarchy: ContentNode[] = []
    const truncatedSections: string[] = []

    // Priority order for content preservation
    const priorityOrder = ['heading', 'paragraph', 'list', 'quote', 'image', 'table']

    // First pass: Add all headings to maintain structure
    hierarchy.forEach(node => {
      if (node.type === 'heading' && currentLength < maxLength * 0.8) {
        const sectionText = `${'#'.repeat(node.level || 1)} ${node.content}\n\n`
        if (currentLength + sectionText.length < maxLength) {
          truncatedHierarchy.push(node)
          truncatedSections.push(sectionText.trim())
          currentLength += sectionText.length
        }
      }
    })

    // Second pass: Add other content types by priority
    for (const contentType of priorityOrder) {
      if (contentType === 'heading') continue // Already processed

      hierarchy.forEach(node => {
        if (node.type === contentType && currentLength < maxLength) {
          let sectionText = ''

          switch (node.type) {
            case 'paragraph':
              sectionText = `P: ${node.content}\n\n`
              break
            case 'list':
              sectionText = `LIST: ${node.content}\n`
              if (node.attributes?.items) {
                sectionText += node.attributes.items.map(item => `  - ${item}`).join('\n') + '\n\n'
              }
              break
            default:
              sectionText = `${node.content}\n\n`
          }

          if (currentLength + sectionText.length < maxLength) {
            truncatedHierarchy.push(node)
            truncatedSections.push(sectionText.trim())
            currentLength += sectionText.length
          }
        }
      })
    }

    const truncatedText = truncatedSections.join('\n\n')

    console.log(`✂️ Truncation completed: ${hierarchy.length} → ${truncatedHierarchy.length} nodes`)

    return { truncatedHierarchy, truncatedText }
  }

  // Helper methods for metadata extraction

  private extractAuthorInfo($: CheerioAPI) {
    // Try multiple sources for author information
    let name = $('meta[name="author"]').attr('content') ||
                 $('meta[property="article:author"]').attr('content') ||
                 $('[rel="author"]').text().trim() ||
                 $('.author-name, .author .name, .byline .name').text().trim() ||
                 $('.blog-author__name, .hs-author-name').text().trim() || // HubSpot specific
                 $('[class*="author-name"]').first().text().trim() ||
                 $('.author, .by-author, .byline').first().text().trim() ||
                 $('[itemprop="author"] [itemprop="name"]').text().trim() ||
                 $('[itemprop="author"]').attr('content') ||
                 $('[itemprop="author"]').text().trim()

    // Check for "By [Author Name]" patterns in specific elements
    if (!name) {
      const bylineSelectors = [
        '.byline',
        '.author-byline',
        '[class*="byline"]',
        '.blog-post__author',
        '.post-author',
        'p:contains("By")',
        'span:contains("By")'
      ]

      for (const selector of bylineSelectors) {
        const bylineText = $(selector).first().text()
        if (bylineText) {
          // STRICT: Require "by" or "author" keyword to avoid matching random content
          // Match patterns like: "By John Doe", "Author: Jane Smith", "Written by Bob Johnson"
          const byMatch = bylineText.match(/(?:by|author|written\s+by)[:\s]+([A-Z][a-z]+(?:[-‑][A-Z][a-z]+)*(?:\s+[A-Z][a-z]+(?:[-‑][A-Z][a-z]+)*)+)/i)
          if (byMatch) {
            const extractedName = byMatch[1].trim()

            // Validate: Must be 2-4 words and not contain common non-name words
            const words = extractedName.split(/\s+/)
            const nonNameWords = ['team', 'staff', 'department', 'company', 'website', 'process', 'service', 'our', 'the', 'and']
            const hasNonNameWord = nonNameWords.some(word => extractedName.toLowerCase().includes(word))

            if (words.length >= 2 && words.length <= 4 && !hasNonNameWord) {
              name = extractedName
              console.log(`✍️ Extracted author from byline: ${name}`)
              break
            } else {
              console.log(`⚠️ Rejected potential author (invalid): ${extractedName}`)
            }
          }
        }
      }
    }

    // Check JSON-LD for author
    if (!name) {
      $('script[type="application/ld+json"]').each((_, script) => {
        try {
          const data = JSON.parse($(script).html() || '')
          if (data.author) {
            if (typeof data.author === 'string') {
              name = data.author
            } else if (data.author.name) {
              name = data.author.name
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      })
    }

    // Clean up author name (remove extra text like "By", "Posted by", etc.)
    if (name) {
      name = name.replace(/^(by|posted by|written by|author:|from)\s*/i, '').trim()
      name = name.split(/\s*\|/)[0].trim() // Remove text after pipe
      name = name.split(/\s*-/)[0].trim() // Remove text after dash (unless it's part of a hyphenated name)
      name = name.replace(/\s+/g, ' ').trim() // Normalize whitespace
    }

    if (!name) return null

    const url = $('a[rel="author"]').attr('href') ||
                $('[itemprop="author"] [itemprop="url"]').attr('href')
    const jobTitle = $('[itemprop="jobTitle"]').text().trim()
    const image = $('meta[property="article:author:image"]').attr('content') ||
                  $('[itemprop="author"] img').attr('src')

    return {
      name,
      url: url || undefined,
      jobTitle: jobTitle || undefined,
      image: image || undefined,
      socialProfiles: [] // Can be enhanced
    }
  }

  private extractTags($: CheerioAPI): string[] {
    const tags: string[] = []

    // From meta tags
    $('meta[property="article:tag"]').each((_, el) => {
      const tag = $(el).attr('content')
      if (tag) {
        // Clean all whitespace variants (newlines, tabs, extra spaces)
        const cleanTag = tag.replace(/[\s\n\r\t\u00A0]+/g, ' ').trim()

        // Check if this is a compound tag (3+ words)
        const wordCount = cleanTag.split(' ').length
        if (wordCount >= 3) {
          // Split compound tags into individual words
          // "marketing seo INBOUND" → ["marketing", "seo", "INBOUND"]
          const individualTags = cleanTag.split(' ')
            .map(t => t.trim())
            .filter(t => t.length > 2 && t.length < 50)
          tags.push(...individualTags)
        } else if (cleanTag && cleanTag.length > 2 && cleanTag.length < 100) {
          // Keep 1-2 word tags as-is
          tags.push(cleanTag)
        }
      }
    })

    // From tag elements
    $('.tag, .tags a, .post-tags a, [class*="tag"]').each((_, el) => {
      const tag = $(el).text().trim()
      if (tag) {
        // Clean all whitespace variants (newlines, tabs, extra spaces)
        const cleanTag = tag.replace(/[\s\n\r\t\u00A0]+/g, ' ').trim()

        // Check if this is a compound tag (3+ words)
        const wordCount = cleanTag.split(' ').length
        if (wordCount >= 3) {
          // Split compound tags
          const individualTags = cleanTag.split(' ')
            .map(t => t.trim())
            .filter(t => t.length > 2 && t.length < 50)
          tags.push(...individualTags)
        } else if (cleanTag && cleanTag.length > 2 && cleanTag.length < 100) {
          // Keep 1-2 word tags as-is
          tags.push(cleanTag)
        }
      }
    })

    // Remove duplicates (case-insensitive) and limit to 10
    const uniqueTags = Array.from(new Set(tags.map(t => t.toLowerCase())))
      .slice(0, 10)

    // Restore original casing for the unique tags
    return uniqueTags.map(lowerTag =>
      tags.find(t => t.toLowerCase() === lowerTag) || lowerTag
    )
  }

  private extractKeywords($: CheerioAPI): string[] {
    // Try meta keywords first
    const keywordsAttr = $('meta[name="keywords"]').attr('content')
    if (keywordsAttr) {
      const metaKeywords = keywordsAttr.split(',').map(k => k.trim()).filter(Boolean).slice(0, 10)
      if (metaKeywords.length > 0) {
        console.log(`📎 Extracted ${metaKeywords.length} keywords from meta tag`)
        return metaKeywords
      }
    }

    // Fallback: Extract keywords from title, headings, and content
    console.log(`⚠️ No meta keywords found, extracting from content...`)
    const keywords: Set<string> = new Set()

    // Extract from page title (split by common separators)
    const title = $('title').text()
    const stopWords = ['richmond', 'va', 'our', 'your', 'the', 'and', 'bcs', 'llc', 'inc', 'ltd', 'corp']

    if (title) {
      const titleWords = title
        .split(/[|\-–—:,]/)
        .map(part => part.trim())
        .filter(part => {
          const words = part.split(/\s+/)
          const lowerPart = part.toLowerCase()
          // Must be 4+ characters, have at least 2 words, not contain stop words
          return part.length >= 4 &&
                 part.length < 50 &&
                 words.length >= 2 &&
                 !stopWords.some(stop => lowerPart.includes(stop))
        })
      titleWords.forEach(word => keywords.add(word))
      console.log(`  📄 Extracted ${titleWords.length} keywords from title`)
    }

    // Extract from H1 and H2 headings (filter out CTAs and marketing fluff)
    const stopPhrases = ['ready to', 'get started', 'contact us', 'learn more', 'find out',
                         'we work with', 'ensure success', 'our', 'your']
    $('h1, h2').each((_, heading) => {
      const text = $(heading).text().trim()
      const lowerText = text.toLowerCase()
      const words = text.split(/\s+/)

      // Skip if:
      // - Too short or too long
      // - Less than 2 words (single words are usually not good keywords)
      // - Contains question mark or exclamation (likely a CTA)
      // - Contains stop phrases (marketing fluff)
      // - All caps (likely a CTA)
      // - Contains stop words like location or company abbreviations
      if (text &&
          text.length >= 4 &&
          text.length <= 30 &&
          words.length >= 2 &&
          !text.includes('?') &&
          !text.includes('!') &&
          text !== text.toUpperCase() &&
          !stopPhrases.some(phrase => lowerText.includes(phrase)) &&
          !stopWords.some(stop => lowerText.includes(stop))) {
        keywords.add(text)
      }
    })
    console.log(`  📋 Total unique keywords from headings (filtered): ${keywords.size}`)

    const keywordsArray = Array.from(keywords).slice(0, 10)
    console.log(`  ✅ Final keywords extracted: ${keywordsArray.length}`)

    return keywordsArray
  }

  private extractImageMetadata($: CheerioAPI) {
    const featured = {
      url: $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') || '',
      alt: $('meta[property="og:image:alt"]').attr('content') ||
           $('meta[name="twitter:image:alt"]').attr('content')
    }

    const all: Array<any> = []
    $('img').each((_, img) => {
      const $img = $(img)
      const src = $img.attr('src')
      if (src && !src.startsWith('data:')) {
        all.push({
          url: src,
          alt: $img.attr('alt'),
          caption: $img.attr('title') || $img.attr('data-caption')
        })
      }
    })

    return {
      featured: featured.url ? featured : undefined,
      all: all.slice(0, 10)
    }
  }

  /**
   * Extract video metadata from various video embed sources
   * Supports: YouTube, Vimeo, Wistia, HubSpot, Vidyard, Brightcove, and native HTML5 video
   */
  private extractVideoMetadata($: CheerioAPI): Array<{
    url: string
    embedUrl?: string
    provider?: string
    title?: string
    description?: string
    thumbnailUrl?: string
    duration?: string
    width?: number
    height?: number
  }> {
    const videos: Array<{
      url: string
      embedUrl?: string
      provider?: string
      title?: string
      description?: string
      thumbnailUrl?: string
      duration?: string
      width?: number
      height?: number
    }> = []

    // Extract YouTube videos
    $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const videoIdMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
      if (videoIdMatch) {
        const videoId = videoIdMatch[1]
        videos.push({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: src,
          provider: 'YouTube',
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          title: $el.attr('title') || $el.attr('data-title'),
          width: parseInt($el.attr('width') || '0') || undefined,
          height: parseInt($el.attr('height') || '0') || undefined
        })
      }
    })

    // Extract Vimeo videos
    $('iframe[src*="vimeo.com"]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const videoIdMatch = src.match(/vimeo\.com\/(?:video\/)?(\d+)/)
      if (videoIdMatch) {
        const videoId = videoIdMatch[1]
        videos.push({
          url: `https://vimeo.com/${videoId}`,
          embedUrl: src,
          provider: 'Vimeo',
          title: $el.attr('title') || $el.attr('data-title'),
          width: parseInt($el.attr('width') || '0') || undefined,
          height: parseInt($el.attr('height') || '0') || undefined
        })
      }
    })

    // Extract Wistia videos
    $('iframe[src*="wistia"], [class*="wistia"], [data-wistia-id]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const wistiaId = $el.attr('data-wistia-id') ||
                       src.match(/wistia\.(?:com|net)\/(?:embed\/iframe\/|medias\/)([a-zA-Z0-9]+)/)?.[1] ||
                       $el.attr('class')?.match(/wistia_embed.*wistia_async_([a-zA-Z0-9]+)/)?.[1]
      if (wistiaId) {
        videos.push({
          url: `https://fast.wistia.com/medias/${wistiaId}`,
          embedUrl: src || undefined,
          provider: 'Wistia',
          title: $el.attr('data-title') || $el.attr('title'),
          width: parseInt($el.attr('width') || '0') || undefined,
          height: parseInt($el.attr('height') || '0') || undefined
        })
      }
    })

    // Extract HubSpot videos
    $('iframe[src*="hubspot"], [class*="hubspot-video"], [class*="hs-video"], div[data-video-id]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const videoId = $el.attr('data-video-id') ||
                      src.match(/hubspot\.com.*video.*\/(\d+)/)?.[1] ||
                      src.match(/hsforms\.com.*video.*\/([a-zA-Z0-9-]+)/)?.[1]

      // Get surrounding context for title
      const parent = $el.parent()
      const title = $el.attr('title') ||
                    $el.attr('data-title') ||
                    parent.find('h1, h2, h3, h4, .video-title').first().text().trim() ||
                    parent.attr('aria-label')

      videos.push({
        url: src || `hubspot-video-${videoId || 'embedded'}`,
        embedUrl: src || undefined,
        provider: 'HubSpot',
        title: title || 'HubSpot Video',
        width: parseInt($el.attr('width') || '0') || undefined,
        height: parseInt($el.attr('height') || '0') || undefined
      })
    })

    // Extract Vidyard videos
    $('iframe[src*="vidyard"], [class*="vidyard"], [data-vidyard-id]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const vidyardId = $el.attr('data-vidyard-id') || src.match(/vidyard\.com\/(?:embed|watch)\/([a-zA-Z0-9]+)/)?.[1]
      if (vidyardId) {
        videos.push({
          url: `https://share.vidyard.com/watch/${vidyardId}`,
          embedUrl: src || undefined,
          provider: 'Vidyard',
          title: $el.attr('data-title') || $el.attr('title'),
          width: parseInt($el.attr('width') || '0') || undefined,
          height: parseInt($el.attr('height') || '0') || undefined
        })
      }
    })

    // Extract Brightcove videos
    $('iframe[src*="brightcove"], video-js[data-video-id]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const videoId = $el.attr('data-video-id') || src.match(/players\.brightcove\.net.*\/(\d+)/)?.[1]
      videos.push({
        url: src || `brightcove-video-${videoId || 'embedded'}`,
        embedUrl: src || undefined,
        provider: 'Brightcove',
        title: $el.attr('data-title') || $el.attr('title'),
        width: parseInt($el.attr('width') || '0') || undefined,
        height: parseInt($el.attr('height') || '0') || undefined
      })
    })

    // Extract native HTML5 video elements
    $('video').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || $el.find('source').first().attr('src')
      if (src) {
        videos.push({
          url: src,
          provider: 'Native',
          title: $el.attr('title') || $el.attr('aria-label'),
          thumbnailUrl: $el.attr('poster'),
          width: parseInt($el.attr('width') || '0') || undefined,
          height: parseInt($el.attr('height') || '0') || undefined
        })
      }
    })

    // Extract Loom videos
    $('iframe[src*="loom.com"]').each((_, el) => {
      const $el = $(el)
      const src = $el.attr('src') || ''
      const videoIdMatch = src.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
      if (videoIdMatch) {
        videos.push({
          url: `https://www.loom.com/share/${videoIdMatch[1]}`,
          embedUrl: src,
          provider: 'Loom',
          title: $el.attr('title'),
          width: parseInt($el.attr('width') || '0') || undefined,
          height: parseInt($el.attr('height') || '0') || undefined
        })
      }
    })

    // Log extracted videos for debugging
    if (videos.length > 0) {
      console.log(`🎬 Extracted ${videos.length} video(s) from page:`, videos.map(v => ({ provider: v.provider, url: v.url })))
    }

    return videos.slice(0, 10) // Limit to 10 videos
  }

  private extractExistingJsonLd($: CheerioAPI): any[] {
    const jsonLdData: any[] = []

    $('script[type="application/ld+json"]').each((_, script) => {
      try {
        const scriptContent = $(script).html() || ''
        const data = JSON.parse(scriptContent)
        jsonLdData.push(data)
      } catch (error) {
        // Skip invalid JSON-LD
      }
    })

    return jsonLdData
  }

  private extractBusinessInfo($: CheerioAPI) {
    const name = $('meta[property="og:site_name"]').attr('content') ||
                 $('meta[name="application-name"]').attr('content')

    if (!name) return null

    // Extract logo from multiple sources
    const logo = $('link[rel="icon"][type="image/png"]').attr('href') ||
                 $('link[rel="icon"][type="image/x-icon"]').attr('href') ||
                 $('link[rel="apple-touch-icon"]').attr('href') ||
                 $('.logo img, .site-logo img, [class*="logo"] img').first().attr('src') ||
                 $('meta[property="og:image"]').attr('content')

    return {
      name,
      logo: logo || undefined,
      website: $('meta[property="og:url"]').attr('content'),
      socialProfiles: [] // Can be enhanced
    }
  }

  private analyzeContentType($: CheerioAPI, url: string) {
    let type: any = 'article'

    // Analyze URL patterns
    if (url.includes('/product/') || url.includes('/shop/')) type = 'product'
    else if (url.includes('/blog/') || url.includes('/post/')) type = 'blog'
    else if (url.includes('/news/')) type = 'news'
    else if (url.includes('/about')) type = 'about'
    else if (url.includes('/contact')) type = 'contact'
    else if (url === new URL(url).origin || url.endsWith('/')) type = 'homepage'

    // Analyze content patterns - Enhanced video detection for multiple providers
    // Check for: native video, YouTube, Vimeo, Wistia, HubSpot, Vidyard, Brightcove, JW Player, etc.
    const videoSelectors = [
      'video',                                    // Native HTML5 video
      'iframe[src*="youtube"]',                   // YouTube
      'iframe[src*="youtu.be"]',                  // YouTube short URLs
      'iframe[src*="vimeo"]',                     // Vimeo
      'iframe[src*="wistia"]',                    // Wistia
      'iframe[src*="hubspot"]',                   // HubSpot video
      'iframe[src*="vidyard"]',                   // Vidyard
      'iframe[src*="brightcove"]',                // Brightcove
      'iframe[src*="jwplatform"]',                // JW Player
      'iframe[src*="dailymotion"]',               // Dailymotion
      'iframe[src*="loom"]',                      // Loom
      'iframe[src*="viddler"]',                   // Viddler
      'iframe[src*="sproutvideo"]',               // Sprout Video
      '[class*="wistia"]',                        // Wistia embed div
      '[class*="hubspot-video"]',                 // HubSpot video class
      '[class*="hs-video"]',                      // HubSpot video module
      '[class*="hhs-video"]',                     // HubSpot video (alternative)
      '[class*="vidyard"]',                       // Vidyard embed
      '[data-wistia-id]',                         // Wistia data attribute
      '[data-video-id]',                          // Generic video data attribute
      '[data-vidyard-id]',                        // Vidyard data attribute
      '.video-container video',                   // Common video container pattern
      '.video-wrapper video',                     // Common video wrapper pattern
      '[id*="video-player"]',                     // Video player IDs
    ].join(', ')
    const hasVideoContent = $(videoSelectors).length > 0
    const hasFaqContent = $('[class*="faq"], [class*="question"]').length > 2
    const hasProductContent = $('[class*="product"], [class*="price"], [class*="buy"]').length > 0
    const hasContactInfo = $('[href^="tel:"], [href^="mailto:"]').length > 0

    // Calculate word count
    const mainText = $('main, article, .content').text() || $('body').text()
    const wordCount = mainText.trim().split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200) // 200 WPM

    return {
      type,
      wordCount,
      readingTime,
      hasVideoContent,
      hasFaqContent,
      hasProductContent,
      hasContactInfo
    }
  }

  private extractAlternateLanguages($: CheerioAPI) {
    const alternates: Array<{ lang: string; url: string }> = []

    $('link[rel="alternate"][hreflang]').each((_, link) => {
      const $link = $(link)
      const lang = $link.attr('hreflang')
      const url = $link.attr('href')

      if (lang && url) {
        alternates.push({ lang, url })
      }
    })

    return alternates
  }

  private extractBreadcrumbs($: CheerioAPI) {
    const breadcrumbs: Array<{ name: string; url?: string }> = []

    // Look for common breadcrumb patterns
    $('.breadcrumb a, .breadcrumbs a, [class*="breadcrumb"] a').each((_, link) => {
      const $link = $(link)
      const name = $link.text().trim()
      const url = $link.attr('href')

      if (name) {
        breadcrumbs.push({ name, url })
      }
    })

    return breadcrumbs
  }
}

export const htmlCleaningService = new HtmlCleaningService()