import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { scraperService } from './scraper.js'
import robotsParser from 'robots-parser'

export interface DiscoveredUrl {
  url: string
  title?: string
  path: string
  depth: number
  discoveredAt: Date
}

export interface CrawlResult {
  domain: string
  urls: DiscoveredUrl[]
  totalFound: number
  status: 'in_progress' | 'completed' | 'failed'
  error?: string
}

class SiteCrawlerService {
  private visited = new Set<string>()
  private queue: string[] = []
  private maxUrls = 500
  private maxDepth = 4
  private timeout = 60000 // 60 seconds

  /**
   * Main entry point: Discover URLs from a domain
   * Returns first 20 URLs immediately, then continues in background
   */
  async *discoverUrls(domain: string): AsyncGenerator<DiscoveredUrl> {
    console.log(`🔍 Starting URL discovery for domain: ${domain}`)

    this.visited.clear()
    this.queue = []

    const normalizedDomain = await this.normalizeDomain(domain)
    const startTime = Date.now()

    try {
      // Check robots.txt first
      const canCrawl = await this.respectsRobotsTxt(normalizedDomain)
      if (!canCrawl) {
        throw new Error('Domain blocks automated crawling via robots.txt')
      }

      // Phase 1: Try sitemap first (fast)
      console.log('📄 Phase 1: Parsing sitemap...')
      const sitemapUrls = await this.parseSitemap(normalizedDomain)

      let count = 0
      for (const sitemapUrl of sitemapUrls) {
        if (count >= this.maxUrls) break

        const discovered: DiscoveredUrl = {
          url: sitemapUrl,
          path: new URL(sitemapUrl).pathname,
          depth: 0,
          discoveredAt: new Date()
        }

        this.visited.add(sitemapUrl)
        count++

        yield discovered

        // Stop after 20 for immediate display
        if (count === 20 && sitemapUrls.length > 20) {
          console.log('✅ Yielded first 20 URLs from sitemap')
        }
      }

      console.log(`📊 Sitemap yielded ${count} URLs`)

      // Phase 2: Supplement with recursive crawling if needed
      if (count < this.maxUrls && Date.now() - startTime < this.timeout) {
        console.log('🕷️ Phase 2: Recursive crawling to find more URLs...')

        for await (const url of this.crawlRecursively(normalizedDomain, this.maxUrls - count)) {
          if (Date.now() - startTime >= this.timeout) {
            console.log('⏱️ Crawl timeout reached')
            break
          }

          yield url
          count++
        }
      }

      console.log(`✅ URL discovery completed: ${count} total URLs found`)

    } catch (error) {
      console.error('❌ URL discovery failed:', error)
      throw error
    }
  }

  /**
   * Parse sitemap.xml and extract all URLs
   */
  private async parseSitemap(domain: string): Promise<string[]> {
    const urls: string[] = []
    const sitemapUrls = [
      `${domain}/sitemap.xml`,
      `${domain}/sitemap_index.xml`,
      `${domain}/sitemap-index.xml`,
    ]

    // Try to find sitemap from robots.txt
    try {
      const robotsTxtUrl = `${domain}/robots.txt`
      const robotsResponse = await axios.get(robotsTxtUrl, { timeout: 5000 })
      const robotsText = robotsResponse.data

      // Extract sitemap URLs from robots.txt
      const sitemapMatches = robotsText.match(/Sitemap:\s*(.+)/gi)
      if (sitemapMatches) {
        sitemapMatches.forEach((match: string) => {
          const url = match.replace(/Sitemap:\s*/i, '').trim()
          if (url) sitemapUrls.unshift(url) // Add to front of array
        })
      }
    } catch (error) {
      console.log('No robots.txt or unable to parse')
    }

    // Try each sitemap URL
    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log(`Trying sitemap: ${sitemapUrl}`)
        const response = await axios.get(sitemapUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AEO-Schema-Generator/1.0)'
          }
        })

        const xmlData = response.data
        const parser = new XMLParser()
        const parsed = parser.parse(xmlData)

        // Handle sitemap index (contains links to other sitemaps)
        if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
          const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
            ? parsed.sitemapindex.sitemap
            : [parsed.sitemapindex.sitemap]

          for (const sitemap of sitemaps) {
            if (sitemap.loc) {
              try {
                const subUrls = await this.parseSitemap(sitemap.loc)
                urls.push(...subUrls)
              } catch (error) {
                console.log(`Failed to parse sub-sitemap: ${sitemap.loc}`)
              }
            }
          }
        }

        // Handle regular sitemap (contains URLs)
        if (parsed.urlset && parsed.urlset.url) {
          const urlEntries = Array.isArray(parsed.urlset.url)
            ? parsed.urlset.url
            : [parsed.urlset.url]

          urlEntries.forEach((entry: any) => {
            if (entry.loc) {
              urls.push(entry.loc)
            }
          })
        }

        // If we found URLs, break out
        if (urls.length > 0) {
          console.log(`✅ Found ${urls.length} URLs in sitemap`)
          break
        }

      } catch (error) {
        console.log(`Sitemap not found or invalid: ${sitemapUrl}`)
        continue
      }
    }

    return urls.slice(0, this.maxUrls)
  }

  /**
   * Recursively crawl website by following links
   */
  private async *crawlRecursively(startUrl: string, maxUrls: number): AsyncGenerator<DiscoveredUrl> {
    this.queue = [startUrl]
    let count = 0
    const domain = new URL(startUrl).origin

    while (this.queue.length > 0 && count < maxUrls) {
      const currentUrl = this.queue.shift()!

      // Skip if already visited
      if (this.visited.has(currentUrl)) {
        continue
      }

      try {
        // Mark as visited
        this.visited.add(currentUrl)

        // Get depth from URL
        const depth = this.getUrlDepth(currentUrl, domain)
        if (depth > this.maxDepth) {
          continue
        }

        // Yield this URL
        const discovered: DiscoveredUrl = {
          url: currentUrl,
          path: new URL(currentUrl).pathname,
          depth,
          discoveredAt: new Date()
        }

        yield discovered
        count++

        // Extract links from this page
        await scraperService.initialize()
        if (!scraperService['browser']) continue

        const page = await scraperService['browser'].newPage()

        try {
          await page.goto(currentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          })

          // Extract all links
          const links = await page.$$eval('a[href]', (anchors: any[]) =>
            anchors.map(a => a.href).filter(Boolean)
          )

          // Filter and add to queue
          for (const link of links) {
            try {
              const linkUrl = new URL(link)
              const linkOrigin = linkUrl.origin

              // Only same-domain links
              if (linkOrigin === domain) {
                const cleanUrl = linkUrl.origin + linkUrl.pathname

                // Skip if already visited or queued
                if (!this.visited.has(cleanUrl) && !this.queue.includes(cleanUrl)) {
                  // Skip common non-content URLs
                  if (this.isContentUrl(cleanUrl)) {
                    this.queue.push(cleanUrl)
                  }
                }
              }
            } catch (error) {
              // Invalid URL, skip
            }
          }

        } finally {
          await page.close()
        }

      } catch (error) {
        console.log(`Failed to crawl ${currentUrl}:`, error instanceof Error ? error.message : error)
        continue
      }
    }
  }

  /**
   * Check if domain allows automated crawling via robots.txt
   */
  private async respectsRobotsTxt(domain: string): Promise<boolean> {
    try {
      const robotsTxtUrl = `${domain}/robots.txt`
      const response = await axios.get(robotsTxtUrl, { timeout: 5000 })
      const robotsTxt = response.data

      const robots = robotsParser(robotsTxtUrl, robotsTxt)
      const userAgent = 'AEO-Schema-Generator'

      // Check if we're allowed to crawl
      const isAllowed = robots.isAllowed(domain, userAgent)

      if (!isAllowed) {
        console.log('❌ Crawling disallowed by robots.txt')
        return false
      }

      return true

    } catch (error) {
      // If robots.txt doesn't exist or can't be fetched, assume allowed
      console.log('No robots.txt found, assuming crawling is allowed')
      return true
    }
  }

  /**
   * Normalize domain to consistent format and try www variant if needed
   */
  private async normalizeDomain(domain: string): Promise<string> {
    // First, ensure we have a valid URL
    let baseUrl: string
    try {
      const url = new URL(domain)
      baseUrl = url.origin
    } catch {
      // Try adding https:// if missing
      try {
        const url = new URL(`https://${domain}`)
        baseUrl = url.origin
      } catch {
        throw new Error('Invalid domain format')
      }
    }

    // If domain doesn't have www, try www variant
    const urlObj = new URL(baseUrl)
    if (!urlObj.hostname.startsWith('www.')) {
      const wwwUrl = `${urlObj.protocol}//www.${urlObj.hostname}`

      // Test which version has a sitemap
      const hasWwwSitemap = await this.testSitemapExists(wwwUrl)
      const hasBaseSitemap = await this.testSitemapExists(baseUrl)

      console.log(`🔍 Testing domains: base=${baseUrl} (sitemap: ${hasBaseSitemap}), www=${wwwUrl} (sitemap: ${hasWwwSitemap})`)

      // Prefer the version with a sitemap
      if (hasWwwSitemap && !hasBaseSitemap) {
        console.log(`✅ Using www version: ${wwwUrl}`)
        return wwwUrl
      }
    }

    return baseUrl
  }

  /**
   * Test if sitemap exists at a domain
   */
  private async testSitemapExists(domain: string): Promise<boolean> {
    try {
      const response = await axios.get(`${domain}/sitemap.xml`, {
        timeout: 3000,
        validateStatus: (status) => status === 200
      })
      return response.status === 200
    } catch {
      return false
    }
  }

  /**
   * Calculate URL depth from domain root
   */
  private getUrlDepth(url: string, domain: string): number {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname

      // Count slashes in path (excluding trailing slash)
      const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path
      const depth = cleanPath.split('/').filter(Boolean).length

      return depth
    } catch {
      return 0
    }
  }

  /**
   * Check if URL is likely content (not admin, login, etc.)
   */
  private isContentUrl(url: string): boolean {
    const excludePatterns = [
      '/wp-admin/',
      '/admin/',
      '/login',
      '/signin',
      '/signup',
      '/logout',
      '/cart',
      '/checkout',
      '/account',
      '/dashboard',
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.css',
      '.js',
      '.xml',
      '.json'
    ]

    const lowerUrl = url.toLowerCase()
    return !excludePatterns.some(pattern => lowerUrl.includes(pattern))
  }
}

export const siteCrawlerService = new SiteCrawlerService()
