import puppeteer, { Browser, Page } from 'puppeteer'
import validator from 'validator'
import type { ContentAnalysis } from './openai.js'
import { htmlCleaningService, type StructuredContent } from './htmlCleaner.js'

// Extend Window interface for mutation observer tracking
declare global {
  interface Window {
    mutationObserver?: MutationObserver
    overlaysDetected?: number
  }
}

export interface ScrapingOptions {
  waitForSelector?: string
  timeout?: number
  userAgent?: string
  viewport?: {
    width: number
    height: number
  }
}

class ScraperService {
  private browser: Browser | null = null

  // Helper function for delays since Puppeteer doesn't have waitForTimeout
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async initialize(): Promise<void> {
    if (this.browser) return

    console.log('Initializing browser...')
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })
      console.log('Browser initialized successfully')
    } catch (error) {
      console.error('Failed to initialize browser:', error)
      throw new Error('Failed to initialize web scraper')
    }
  }

  async scrapeUrl(url: string, options: ScrapingOptions = {}): Promise<ContentAnalysis> {
    await this.initialize()

    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    const page = await this.browser.newPage()

    try {
      // Set user agent
      await page.setUserAgent(
        options.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      )

      // Set viewport
      await page.setViewport(options.viewport || { width: 1920, height: 1080 })

      // Block unnecessary resources for faster loading
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['font', 'stylesheet'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options.timeout || 30000
      })

      // Wait for page to stabilize and dismiss any overlays
      await page.waitForSelector('body', { timeout: 10000 })
      await this.delay(1500)
      await this.dismissOverlays(page, 1)

      // Get the final HTML content
      const html = await page.content()

      console.log('🔄 Processing HTML with advanced cleaning service...')

      // Use the new HTML cleaning service for optimized processing
      const structuredContent = await htmlCleaningService.processHtml(html, url)

      // Convert structured content to ContentAnalysis format
      const analysis: ContentAnalysis = {
        url,
        title: structuredContent.metadata.title,
        description: structuredContent.metadata.description,
        content: structuredContent.cleanText,
        metadata: {
          // Enhanced metadata from HTML cleaning service
          ...structuredContent.metadata,

          // Convert to legacy format for compatibility
          author: structuredContent.metadata.author,  // Keep as object for proper extraction
          publishDate: structuredContent.metadata.publishDate,
          modifiedDate: structuredContent.metadata.modifiedDate,
          images: structuredContent.metadata.images.all.map(img => img.url),
          keywords: structuredContent.metadata.keywords,

          // Extract wordCount and contentType from contentAnalysis
          wordCount: structuredContent.metadata.contentAnalysis.wordCount,
          contentType: structuredContent.metadata.contentAnalysis.type as any,

          // Image info for schema generation
          imageInfo: {
            featuredImage: structuredContent.metadata.images.featured?.url
          },

          // Business info for publisher
          businessInfo: structuredContent.metadata.business ? {
            name: structuredContent.metadata.business.name,
            logo: structuredContent.metadata.business.logo,
            url: structuredContent.metadata.business.website
          } : undefined,

          // Article sections for schema
          articleSections: structuredContent.metadata.articleSections,

          // Add processing metrics
          originalLength: structuredContent.originalLength,
          processedLength: structuredContent.processedLength,
          tokenEstimate: structuredContent.tokenEstimate,
          contentHierarchy: structuredContent.hierarchy
        },
        // Pass through content quality suggestions from htmlCleaner
        contentQualitySuggestions: structuredContent.contentQualitySuggestions
      }

      console.log(`✅ Enhanced scraping completed for ${url}`)
      console.log(`📊 Processing metrics: ${structuredContent.originalLength} → ${structuredContent.processedLength} chars (${Math.round((1 - structuredContent.processedLength/structuredContent.originalLength) * 100)}% reduction)`)

      return analysis

    } catch (error) {
      console.error(`Scraping error for ${url}:`, error)
      throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      await page.close()
    }
  }

  private async dynamicContentExtraction(page: Page, options: ScrapingOptions): Promise<ContentAnalysis> {
    console.log('Starting dynamic content extraction with DOM mutation observers...')

    // Phase 1: Initial overlay dismissal
    await this.initialOverlayDismissal(page)

    // Phase 2: Set up DOM mutation observer for continuous monitoring
    await this.setupDOMObserver(page)

    // Phase 3: Progressive content extraction with validation
    const contentSamples: string[] = []
    const qualityScores: number[] = []

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Content extraction attempt ${attempt}/3`)

      // Continuous overlay monitoring
      await this.continuousOverlayMonitoring(page, attempt)

      // Extract content sample
      const contentSample = await this.extractContentSample(page, attempt)
      const qualityScore = await this.calculateContentQuality(contentSample, page)

      contentSamples.push(contentSample)
      qualityScores.push(qualityScore)

      console.log(`Attempt ${attempt} quality score: ${qualityScore}`)

      // If we have high-quality content, proceed
      if (qualityScore >= 0.8 && contentSample.length > 500) {
        console.log('High-quality content detected, proceeding with extraction')
        break
      }

      // Wait for more DOM changes before next attempt
      if (attempt < 3) {
        await this.delay(2000)
      }
    }

    // Phase 4: Select best content and perform comprehensive analysis
    const bestAttemptIndex = qualityScores.indexOf(Math.max(...qualityScores))
    const bestContent = contentSamples[bestAttemptIndex]

    console.log(`Using content from attempt ${bestAttemptIndex + 1} with quality score: ${qualityScores[bestAttemptIndex]}`)

    // Comprehensive metadata extraction
    const analysis = await this.comprehensiveContentAnalysis(page, bestContent, options)

    // Stop mutation observer (simplified)
    try {
      await page.evaluate(() => {
        if (window.mutationObserver) {
          window.mutationObserver.disconnect()
        }
      })
    } catch (error) {
      console.log('Mutation observer cleanup skipped')
    }

    return analysis
  }

  private async initialOverlayDismissal(page: Page): Promise<void> {
    console.log('Phase 1: Initial overlay dismissal')

    // Wait for page to stabilize
    await page.waitForSelector('body', { timeout: 10000 })
    await this.delay(1000)

    // Comprehensive overlay dismissal (first pass)
    await this.dismissOverlays(page, 1)
    await this.delay(500)
  }

  private async setupDOMObserver(page: Page): Promise<void> {
    console.log('Phase 2: Setting up DOM mutation observer')

    // Simplified DOM observer to avoid browser context issues
    try {
      await page.evaluate(() => {
        window.overlaysDetected = 0
      })
    } catch (error) {
      console.log('DOM observer setup skipped due to browser context limitations')
    }
  }

  private async continuousOverlayMonitoring(page: Page, attempt: number): Promise<void> {
    console.log(`Phase 3.${attempt}: Continuous overlay monitoring`)

    // Simplified overlay monitoring - just check for visible overlays
    await this.checkAndDismissVisibleOverlays(page)
  }

  private async checkAndDismissVisibleOverlays(page: Page): Promise<void> {
    // Simplified overlay detection - just try to dismiss common overlay patterns
    console.log('Checking for visible overlays using simplified detection')

    // Directly attempt dismissal without complex visibility checks
    try {
      await this.dismissOverlays(page, 2)
    } catch (error) {
      console.log('Overlay dismissal completed with some failures (expected)')
    }
  }

  private async extractContentSample(page: Page, attempt: number): Promise<string> {
    console.log(`Extracting content sample (attempt ${attempt})`)

    try {
      // Simple approach using page.$eval and text extraction
      let bestContent = ''

      // Try different selectors in order of preference
      const selectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '#content',
        '.post-content',
        '.article-content',
        '.entry-content'
      ]

      for (const selector of selectors) {
        try {
          const content = await page.$eval(selector, (el: any) => {
            // Remove unwanted elements
            const unwanted = el.querySelectorAll('script, style, nav, header, footer, .sidebar, .comments')
            unwanted.forEach((unwantedEl: any) => {
              if (unwantedEl.remove) unwantedEl.remove()
            })
            return el.textContent?.trim() || ''
          }).catch(() => '')

          if (content && content.length > bestContent.length) {
            bestContent = content
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Fallback to body content if nothing found
      if (bestContent.length < 200) {
        try {
          bestContent = await page.$eval('body', (el: any) => el.textContent?.trim() || '').catch(() => '')
        } catch (e) {
          bestContent = 'Unable to extract content'
        }
      }

      // Clean up whitespace
      return bestContent.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim()

    } catch (error) {
      console.log('Content extraction failed, using fallback')
      return 'Content extraction failed'
    }
  }

  private async calculateContentQuality(content: string, page: Page): Promise<number> {
    if (!content || content.length < 50) return 0

    let score = 0

    // Length score (0-0.3)
    const lengthScore = Math.min(content.length / 2000, 1) * 0.3
    score += lengthScore

    // Cookie/consent content penalty
    const cookieKeywords = ['cookie', 'consent', 'privacy policy', 'accept', 'decline', 'gdpr', 'tracking']
    const cookieRatio = cookieKeywords.reduce((count, keyword) => {
      return count + (content.toLowerCase().split(keyword).length - 1)
    }, 0) / content.split(' ').length

    const cookiePenalty = Math.min(cookieRatio * 10, 0.5) // Max 50% penalty
    score -= cookiePenalty

    // Content diversity score (0-0.3)
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size
    const totalWords = content.split(/\s+/).length
    const diversityScore = Math.min(uniqueWords / totalWords, 1) * 0.3
    score += diversityScore

    // Structural content indicators (0-0.4)
    const structuralIndicators = await page.evaluate(() => {
      const hasHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0
      const hasParagraphs = document.querySelectorAll('p').length > 2
      const hasImages = document.querySelectorAll('img').length > 0
      const hasLinks = document.querySelectorAll('a').length > 2

      return { hasHeadings, hasParagraphs, hasImages, hasLinks }
    })

    const structuralScore = Object.values(structuralIndicators).filter(Boolean).length * 0.1
    score += structuralScore

    return Math.max(0, Math.min(1, score))
  }

  private async comprehensiveContentAnalysis(page: Page, content: string, options: ScrapingOptions): Promise<ContentAnalysis> {
    console.log('Phase 4: Comprehensive content analysis')

    // Basic page information
    const url = page.url()
    const title = await page.title()

    // Meta description
    const description = await page.evaluate(() => {
      const metaDesc = document.querySelector('meta[name="description"]')
      return metaDesc?.getAttribute('content') || ''
    })

    // Enhanced metadata extraction with retry logic
    const metadata = await this.extractEnhancedMetadataWithRetry(page, options)

    return {
      title,
      description,
      content,
      url,
      metadata
    }
  }

  private async extractEnhancedMetadataWithRetry(page: Page, options: ScrapingOptions, maxRetries: number = 3): Promise<any> {
    // Simplified single attempt for now to avoid complex retries
    try {
      console.log('Extracting enhanced metadata')
      return await this.extractBasicMetadata(page)
    } catch (error) {
      console.warn('Metadata extraction failed:', error instanceof Error ? error.message : error)
      console.log('Using fallback basic metadata')
      return this.getFallbackMetadata(page)
    }
  }

  private async extractBasicMetadata(page: Page): Promise<any> {
    try {
      console.log('🔍 Extracting comprehensive AEO metadata...')

      // Get page title and description
      const title = await page.title().catch(() => '')
      const description = await page.$eval('meta[name="description"]', (el: any) => el.getAttribute('content')).catch(() => '')

      // Language detection
      const language = await page.$eval('html', (el: any) => el.getAttribute('lang')).catch(() =>
        page.$eval('meta[property="og:locale"]', (el: any) => el.getAttribute('content')).catch(() => 'en')
      )

      // Canonical URL
      const canonicalUrl = await page.$eval('link[rel="canonical"]', (el: any) => el.getAttribute('href')).catch(() => page.url())

      // Author information (comprehensive)
      const authorInfo = await this.extractAuthorInfo(page)

      // Date information
      const publishDate = await this.extractPublishDate(page)
      const modifiedDate = await this.extractModifiedDate(page)

      // Article section/category
      const articleSection = await this.extractArticleSection(page)

      // Keywords and tags
      const keywordsData = await this.extractKeywordsAndTags(page)

      // Image information (comprehensive)
      const imageInfo = await this.extractImageInfo(page)

      // Content analysis
      const contentAnalysis = await this.analyzeContent(page)

      // Business information
      const businessInfo = await this.extractBusinessInfo(page)

      // FAQ content
      const faqContent = await this.extractFAQContent(page)

      // Social media URLs
      const socialUrls = await this.extractSocialUrls(page)

      // Structured data already present
      const existingJsonLd = await this.extractExistingJsonLd(page)

      return {
        // Core metadata
        author: authorInfo,
        publishDate,
        modifiedDate,
        articleSection,
        language,
        canonicalUrl,

        // Content metadata
        wordCount: contentAnalysis.wordCount,
        readingTime: Math.ceil(contentAnalysis.wordCount / 200), // Assume 200 WPM
        contentType: contentAnalysis.contentType,
        headings: contentAnalysis.headings,

        // Keywords and categorization
        keywords: keywordsData.keywords,
        tags: keywordsData.tags,
        entities: keywordsData.entities,
        categories: keywordsData.categories,

        // Image data
        images: imageInfo.allImages.map(img => img.url),
        imageInfo: {
          featuredImage: imageInfo.featuredImage,
          featuredImageAlt: imageInfo.featuredImageAlt,
          imageCount: imageInfo.imageCount,
          allImages: imageInfo.allImages
        },

        // Structured content
        faqContent,
        socialUrls,
        jsonLdData: existingJsonLd,

        // Business information
        businessInfo: businessInfo.name ? businessInfo : null,

        // Technical metadata
        alternateLanguages: await this.extractAlternateLanguages(page)
      }
    } catch (error) {
      console.log('Enhanced metadata extraction failed, using fallback')
      throw error
    }
  }

  private async extractAuthorInfo(page: Page): Promise<any> {
    try {
      // Try structured author data first
      const authorName = await page.$eval('meta[name="author"]', (el: any) => el.getAttribute('content')).catch(() =>
        page.$eval('[rel="author"]', (el: any) => el.textContent?.trim()).catch(() =>
          page.$eval('.author', (el: any) => el.textContent?.trim()).catch(() =>
            page.$eval('[itemprop="author"]', (el: any) => el.textContent?.trim()).catch(() => '')
          )
        )
      )

      if (!authorName) return null

      // Try to get additional author info
      const authorUrl = await page.$eval('a[rel="author"]', (el: any) => el.getAttribute('href')).catch(() => '')
      const authorJobTitle = await page.$eval('[itemprop="jobTitle"]', (el: any) => el.textContent?.trim()).catch(() => '')

      return {
        name: authorName,
        url: authorUrl || null,
        jobTitle: authorJobTitle || null
      }
    } catch (error) {
      return null
    }
  }

  private async extractPublishDate(page: Page): Promise<string | null> {
    return await page.$eval('meta[property="article:published_time"]', (el: any) => el.getAttribute('content')).catch(() =>
      page.$eval('meta[name="date"]', (el: any) => el.getAttribute('content')).catch(() =>
        page.$eval('time[datetime]', (el: any) => el.getAttribute('datetime')).catch(() =>
          page.$eval('[itemprop="datePublished"]', (el: any) => el.getAttribute('datetime') || el.textContent?.trim()).catch(() => null)
        )
      )
    )
  }

  private async extractModifiedDate(page: Page): Promise<string | null> {
    return await page.$eval('meta[property="article:modified_time"]', (el: any) => el.getAttribute('content')).catch(() =>
      page.$eval('[itemprop="dateModified"]', (el: any) => el.getAttribute('datetime') || el.textContent?.trim()).catch(() => null)
    )
  }

  private async extractArticleSection(page: Page): Promise<string | null> {
    return await page.$eval('meta[property="article:section"]', (el: any) => el.getAttribute('content')).catch(() =>
      page.$eval('[itemprop="articleSection"]', (el: any) => el.textContent?.trim()).catch(() =>
        page.$eval('.category', (el: any) => el.textContent?.trim()).catch(() =>
          page.$eval('.post-category', (el: any) => el.textContent?.trim()).catch(() => null)
        )
      )
    )
  }

  private async extractKeywordsAndTags(page: Page): Promise<any> {
    try {
      // Extract meta keywords
      const metaKeywords = await page.$eval('meta[name="keywords"]', (el: any) => el.getAttribute('content')).catch(() => '')

      // Extract article tags
      const articleTags = await page.$$eval('meta[property="article:tag"]', (elements: any[]) =>
        elements.map(el => el.getAttribute('content')).filter(Boolean)
      ).catch(() => [])

      // Extract from tag elements
      const tagElements = await page.$$eval('.tag, .tags a, .post-tags a, [class*="tag"]', (elements: any[]) =>
        elements.map(el => el.textContent?.trim()).filter(Boolean)
      ).catch(() => [])

      const keywords = metaKeywords ? metaKeywords.split(',').map((k: string) => k.trim()) : []
      const allTags = [...articleTags, ...tagElements].slice(0, 10)

      return {
        keywords: keywords.slice(0, 10),
        tags: allTags,
        entities: [], // Can be enhanced with NLP
        categories: []
      }
    } catch (error) {
      return { keywords: [], tags: [], entities: [], categories: [] }
    }
  }

  private async extractImageInfo(page: Page): Promise<any> {
    try {
      // Featured image from meta tags
      const ogImage = await page.$eval('meta[property="og:image"]', (el: any) => el.getAttribute('content')).catch(() => '')
      const twitterImage = await page.$eval('meta[name="twitter:image"]', (el: any) => el.getAttribute('content')).catch(() => '')
      const featuredImage = ogImage || twitterImage

      // Featured image alt text
      const featuredImageAlt = await page.$eval('meta[property="og:image:alt"]', (el: any) => el.getAttribute('content')).catch(() =>
        page.$eval('meta[name="twitter:image:alt"]', (el: any) => el.getAttribute('content')).catch(() => '')
      )

      // Extract all images with metadata
      const allImages = await page.$$eval('img', (images: any[]) => {
        return images.map(img => ({
          url: img.src,
          alt: img.alt || '',
          caption: img.getAttribute('data-caption') || img.title || ''
        })).filter(img => img.url && !img.url.includes('data:image')).slice(0, 10)
      }).catch(() => [])

      return {
        featuredImage: featuredImage || null,
        featuredImageAlt: featuredImageAlt || null,
        imageCount: allImages.length,
        allImages
      }
    } catch (error) {
      return {
        featuredImage: null,
        featuredImageAlt: null,
        imageCount: 0,
        allImages: []
      }
    }
  }

  private async analyzeContent(page: Page): Promise<any> {
    try {
      // Extract headings
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements: any[]) =>
        elements.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 10)
      ).catch(() => [])

      // Analyze content type based on URL and content
      const url = page.url()
      let contentType = 'article'

      if (url.includes('/blog/') || url.includes('/post/')) contentType = 'blog'
      else if (url.includes('/news/')) contentType = 'news'
      else if (url.includes('/product/')) contentType = 'product'
      else if (url.includes('/about')) contentType = 'about'
      else if (url.includes('/contact')) contentType = 'contact'
      else if (url === new URL(url).origin || url.endsWith('/')) contentType = 'home'

      // Improved word count extraction with multiple fallbacks
      let wordCount = 0
      let mainContent = ''

      // Try multiple content selectors in order of preference
      const contentSelectors = [
        'main',
        'article',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.main-content',
        '[role="main"]',
        '#content',
        '.blog-post',
        '.post-body'
      ]

      for (const selector of contentSelectors) {
        try {
          const content = await page.$eval(selector, (el: any) => {
            // Remove navigation, sidebar, footer, comments, ads
            const unwantedSelectors = [
              'nav', 'header', 'footer', 'aside', '.sidebar', '.comments',
              '.comment', '.navigation', '.nav', '.menu', '.ads', '.advertisement',
              '.social-share', '.related-posts', '.author-bio', '.tags', '.metadata'
            ]

            // Clone the element to avoid modifying original
            const clone = el.cloneNode(true)

            unwantedSelectors.forEach(unwantedSelector => {
              const unwantedElements = clone.querySelectorAll(unwantedSelector)
              unwantedElements.forEach((element: any) => element.remove())
            })

            return clone.textContent?.trim() || ''
          }).catch(() => '')

          if (content && content.length > mainContent.length) {
            mainContent = content
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // If no content found with specific selectors, try body but filter out common non-content
      if (!mainContent || mainContent.length < 100) {
        try {
          mainContent = await page.evaluate(() => {
            // Remove common non-content elements from body
            const unwantedSelectors = [
              'script', 'style', 'nav', 'header', 'footer', 'aside',
              '.sidebar', '.comments', '.comment', '.navigation', '.nav',
              '.menu', '.ads', '.advertisement', '.social-share',
              '.cookie-banner', '.popup', '.modal', '.overlay'
            ]

            const bodyClone = document.body.cloneNode(true) as HTMLElement

            unwantedSelectors.forEach(selector => {
              const elements = bodyClone.querySelectorAll(selector)
              elements.forEach(element => element.remove())
            })

            return bodyClone.textContent?.trim() || ''
          }).catch(() => '')
        } catch (e) {
          console.warn('Body content extraction failed:', e)
        }
      }

      // Calculate word count from the extracted content
      if (mainContent) {
        // Clean up the content and count words
        const cleanContent = mainContent
          .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
          .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
          .trim()

        const words = cleanContent.split(/\s+/).filter(word => word.length > 0)
        wordCount = words.length
      }

      console.log(`📝 Content analysis: ${wordCount} words extracted from ${url}`)

      return {
        headings,
        contentType,
        wordCount,
        contentLength: mainContent.length,
        extractedContent: mainContent.substring(0, 500) + (mainContent.length > 500 ? '...' : '') // First 500 chars for debugging
      }
    } catch (error) {
      console.error('Content analysis error:', error)
      return {
        headings: [],
        contentType: 'article',
        wordCount: 0,
        contentLength: 0,
        extractedContent: ''
      }
    }
  }

  private async extractBusinessInfo(page: Page): Promise<any> {
    try {
      // Extract from meta tags and structured data
      const siteName = await page.$eval('meta[property="og:site_name"]', (el: any) => el.getAttribute('content')).catch(() => '')
      const businessName = siteName || new URL(page.url()).hostname.replace('www.', '')

      return {
        name: businessName || null,
        type: null, // Can be enhanced
        url: page.url()
      }
    } catch (error) {
      return { name: null }
    }
  }

  private async extractFAQContent(page: Page): Promise<any[]> {
    try {
      // Look for FAQ patterns
      const faqElements = await page.$$eval('[class*="faq"], [class*="question"], .qa-item', (elements: any[]) => {
        const faqs: any[] = []
        elements.forEach(element => {
          const question = element.querySelector('[class*="question"], .q, h3, h4')?.textContent?.trim()
          const answer = element.querySelector('[class*="answer"], .a, p')?.textContent?.trim()
          if (question && answer) {
            faqs.push({ question, answer })
          }
        })
        return faqs.slice(0, 5)
      }).catch(() => [])

      return faqElements
    } catch (error) {
      return []
    }
  }

  private async extractSocialUrls(page: Page): Promise<string[]> {
    try {
      return await page.$$eval('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"]',
        (elements: any[]) => elements.map(el => el.href).filter(Boolean).slice(0, 5)
      ).catch(() => [])
    } catch (error) {
      return []
    }
  }

  private async extractExistingJsonLd(page: Page): Promise<any[]> {
    try {
      return await page.$$eval('script[type="application/ld+json"]', (scripts: any[]) => {
        return scripts.map(script => {
          try {
            return JSON.parse(script.textContent || '')
          } catch {
            return null
          }
        }).filter(Boolean)
      }).catch(() => [])
    } catch (error) {
      return []
    }
  }

  private async extractAlternateLanguages(page: Page): Promise<any[]> {
    try {
      return await page.$$eval('link[rel="alternate"][hreflang]', (elements: any[]) =>
        elements.map(el => ({
          lang: el.getAttribute('hreflang'),
          url: el.getAttribute('href')
        })).filter(item => item.lang && item.url)
      ).catch(() => [])
    } catch (error) {
      return []
    }
  }

  private async getFallbackMetadata(page: Page): Promise<any> {
    try {
      console.log('Using fallback metadata extraction strategy')

      // Try to get basic content analysis even in fallback
      const contentAnalysis = await this.analyzeContent(page)

      return {
        wordCount: contentAnalysis.wordCount || 0,
        keywords: [],
        images: [],
        contentLength: contentAnalysis.contentLength || 0,
        extractedContent: contentAnalysis.extractedContent || ''
      }
    } catch (error) {
      console.warn('Fallback metadata extraction failed:', error)
      return {
        wordCount: 0,
        keywords: [],
        images: [],
        contentLength: 0,
        extractedContent: ''
      }
    }
  }

  private async dismissOverlays(page: Page, attempt: number): Promise<void> {
    console.log(`Attempting overlay dismissal (attempt ${attempt})`)

    // Comprehensive list of dismissal selectors
    const dismissalSelectors = [
      // Standard cookie consent patterns
      'button[id*="accept"]', 'button[class*="accept"]',
      'button[id*="agree"]', 'button[class*="agree"]',
      '[data-accept]', '[data-consent="accept"]',

      // Cookie-specific patterns
      'button[id*="cookie"]', 'button[class*="cookie"]',
      '.cookie-accept', '.consent-accept',
      '#cookie-accept', '#consent-accept',

      // Allow/approve patterns
      'button[id*="allow"]', 'button[class*="allow"]',
      'button[id*="approve"]', 'button[class*="approve"]',

      // Continue patterns
      'button[id*="continue"]', 'button[class*="continue"]',

      // GDPR and privacy
      'button[id*="gdpr"]', 'button[class*="gdpr"]',
      'button[id*="privacy"]', 'button[class*="privacy"]',
      '[data-gdpr="accept"]', '[data-privacy="accept"]',

      // Close buttons
      'button[aria-label="Close"]', 'button[title="Close"]',
      'button.close', '.close-button', '.btn-close',
      '.modal-close', '.overlay-close', '.popup-close',

      // Dialog and overlay patterns
      '[role="dialog"] button', '[role="alertdialog"] button',
      '.modal button', '.overlay button', '.popup button'
    ]

    // Try selector-based dismissal
    for (const selector of dismissalSelectors) {
      try {
        const elements = await page.$$(selector)
        for (const element of elements) {
          const isVisible = await element.isIntersectingViewport()
          if (isVisible) {
            await element.click()
            console.log(`Dismissed overlay using selector: ${selector}`)
            await this.delay(500)
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Try text-based dismissal
    const textPatterns = ['accept', 'accept all', 'i accept', 'ok', 'continue', 'agree', 'allow']
    const clickableSelectors = ['button', 'a', 'div[role="button"]', 'span[role="button"]', '.btn']

    for (const elemSelector of clickableSelectors) {
      try {
        const elements = await page.$$(elemSelector)
        for (const element of elements) {
          try {
            const text = await element.evaluate(el => el.textContent)
            if (text) {
              const cleanText = text.trim().toLowerCase()
              if (textPatterns.some(pattern => cleanText.includes(pattern))) {
                const isVisible = await element.isIntersectingViewport()
                if (isVisible) {
                  await element.click()
                  console.log(`Dismissed overlay by clicking element with text: "${text.trim()}"`)
                  await this.delay(500)
                }
              }
            }
          } catch (error) {
            // Continue to next element
          }
        }
      } catch (error) {
        // Continue to next element type
      }
    }
  }

  // Validate URL accessibility
  async validateUrl(url: string): Promise<{ isValid: boolean, statusCode?: number, error?: string }> {
    if (!validator.isURL(url, { protocols: ['http', 'https'] })) {
      return { isValid: false, error: 'Invalid URL format' }
    }

    await this.initialize()

    if (!this.browser) {
      return { isValid: false, error: 'Browser not initialized' }
    }

    const page = await this.browser.newPage()

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      const statusCode = response?.status() || 0

      if (statusCode >= 200 && statusCode < 400) {
        return { isValid: true, statusCode }
      } else {
        return { isValid: false, statusCode, error: `HTTP ${statusCode}` }
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      await page.close()
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

export const scraperService = new ScraperService()

// Graceful shutdown
process.on('SIGINT', async () => {
  await scraperService.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await scraperService.close()
  process.exit(0)
})